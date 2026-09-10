// CHOCO AUTO LEVEL 5 — Step 17: Full Lab Orchestrator
// LAB/TEST ONLY. Coordinates triggers and queue; never executes Production.
import { eventToTask, eventTriggerSafetyCheck } from './event-trigger.js';
import { createTaskQueue, taskQueueSafetyCheck } from './task-queue.js';
import { runAgentPipeline } from './agent-pipeline.js';
import { createIdempotencyGuard, createAuditEntry, reliabilitySafetyCheck } from './reliability.js';
import { validateDecision, decisionValidationSafetyCheck } from './decision-validation.js';

export const AUTO_ORCHESTRATOR_MODE = 'LAB_AUTO_ORCHESTRATOR_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;

export function createLabOrchestrator() {
  const queue = createTaskQueue();
  const idempotency = createIdempotencyGuard();
  const audit = [];

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
   */
  function processNext({ observationContext = null } = {}) {
    const item = queue.next();
    if (!item) return null;
    const result = runAgentPipeline({
      ...item.task,
      ...(observationContext ? { observationContext } : {}),
    });
    const validation = result.decision ? validateDecision(result.decision) : Object.freeze({ status: 'VALID' });
    if (!decisionValidationSafetyCheck(validation)) throw new Error('CHOCO AUTO ORCHESTRATOR: decision validation failed');
    const entry = createAuditEntry({ task_id: result.state.task_id, action: result.task.type, result: result.waiting_for_target ? 'WAITING_FOR_TARGET' : 'SIMULATED' });
    if (!reliabilitySafetyCheck(entry)) throw new Error('CHOCO AUTO ORCHESTRATOR: audit safety failed');
    audit.push(entry);
    queue.complete(item.queue_id, validation.status === 'BLOCKED' ? 'BLOCKED' : 'DONE');
    return Object.freeze({ item, result, validation, audit: entry });
  }

  return Object.freeze({ ingest, processNext, queue, audit: () => Object.freeze(audit.slice()), mode: AUTO_ORCHESTRATOR_MODE, production_execution_enabled: PRODUCTION_EXECUTION_ENABLED });
}
