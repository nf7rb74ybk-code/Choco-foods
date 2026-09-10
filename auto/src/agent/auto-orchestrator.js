// CHOCO AUTO LEVEL 5 — Step 17: Full Lab Orchestrator
// LAB/TEST ONLY. Coordinates triggers and queue; never executes Production.
import { eventToTask, eventTriggerSafetyCheck } from './event-trigger.js';
import { createTaskQueue, taskQueueSafetyCheck } from './task-queue.js';
import { runAgentPipeline } from './agent-pipeline.js';
import { createIdempotencyGuard, createRetryPolicy, shouldRetry, createAuditEntry, reliabilitySafetyCheck } from './reliability.js';
import { validateDecision, decisionValidationSafetyCheck } from './decision-validation.js';

export const AUTO_ORCHESTRATOR_MODE = 'LAB_AUTO_ORCHESTRATOR_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;

export function createLabOrchestrator({ pipelineRunner = runAgentPipeline, retryPolicy = createRetryPolicy() } = {}) {
  const queue = createTaskQueue();
  const idempotency = createIdempotencyGuard();
  const audit = [];

  if (typeof pipelineRunner !== 'function') throw new Error('CHOCO AUTO ORCHESTRATOR: pipelineRunner must be a function');

  function recordAudit({ taskId, action, result, reason = null }) {
    const entry = createAuditEntry({ task_id: taskId, action, result, reason });
    if (!reliabilitySafetyCheck(entry)) throw new Error('CHOCO AUTO ORCHESTRATOR: audit safety failed');
    audit.push(entry);
    return entry;
  }

  function ingest(event) {
    if (!eventTriggerSafetyCheck() || !taskQueueSafetyCheck(queue)) throw new Error('CHOCO AUTO ORCHESTRATOR: trigger/queue safety failed');
    const task = eventToTask(event);
    if (!task) return Object.freeze({ accepted: false, reason: 'UNSUPPORTED_EVENT' });
    const guard = idempotency.check(task.dedupe_key);
    if (!guard.allowed) return Object.freeze({ accepted: false, reason: guard.reason, task });
    const queued = queue.enqueue(task);
    return Object.freeze({
      accepted: queued.added === true,
      reason: queued.added === true ? 'QUEUED' : queued.reason,
      task,
      queue: queued,
    });
  }

  /**
   * Process one queued task. An observation context may be supplied by the
   * read-only observer controller so reasoning is based on the same snapshot.
   * Failures are contained and retried a bounded number of times in LAB only.
   */
  function processNext({ observationContext = null } = {}) {
    const item = queue.next();
    if (!item) return null;

    try {
      const result = pipelineRunner({
        ...item.task,
        ...(observationContext ? { observationContext } : {}),
      });
      const validation = result.decision ? validateDecision(result.decision) : Object.freeze({ status: 'VALID' });
      if (!decisionValidationSafetyCheck(validation)) throw new Error('CHOCO AUTO ORCHESTRATOR: decision validation failed');
      const auditEntry = recordAudit({
        taskId: result.state.task_id,
        action: result.task.type,
        result: result.waiting_for_target ? 'WAITING_FOR_TARGET' : 'SIMULATED',
      });
      queue.complete(item.queue_id, validation.status === 'BLOCKED' ? 'BLOCKED' : 'DONE');
      return Object.freeze({ item, result, validation, audit: auditEntry, recovered: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retry = shouldRetry(item.attempts, retryPolicy);
      if (retry) {
        queue.retry(item.queue_id, message);
        const auditEntry = recordAudit({ taskId: item.task.task_id ?? item.queue_id, action: item.task.type, result: 'RETRY_SCHEDULED', reason: message });
        return Object.freeze({ item, error: message, retry_scheduled: true, attempts: item.attempts, audit: auditEntry, recovered: true });
      }

      queue.complete(item.queue_id, 'BLOCKED', message);
      const auditEntry = recordAudit({ taskId: item.task.task_id ?? item.queue_id, action: item.task.type, result: 'BLOCKED', reason: message });
      return Object.freeze({ item, error: message, retry_scheduled: false, attempts: item.attempts, audit: auditEntry, recovered: true });
    }
  }

  return Object.freeze({
    ingest,
    processNext,
    queue,
    audit: () => Object.freeze(audit.slice()),
    mode: AUTO_ORCHESTRATOR_MODE,
    production_execution_enabled: PRODUCTION_EXECUTION_ENABLED,
  });
}
