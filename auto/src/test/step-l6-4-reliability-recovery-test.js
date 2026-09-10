import { createLabOrchestrator } from '../agent/auto-orchestrator.js';
import { createRetryPolicy } from '../agent/reliability.js';

let calls = 0;
const orchestrator = createLabOrchestrator({
  retryPolicy: createRetryPolicy({ maxAttempts: 3 }),
  pipelineRunner: () => {
    calls += 1;
    if (calls < 3) throw new Error('LAB_TRANSIENT_FAILURE');
    return Object.freeze({
      decision: null,
      task: Object.freeze({ type: 'GENERATE_REPORT' }),
      state: Object.freeze({ task_id: 'recovery-task-1' }),
      waiting_for_target: false,
      production_write: false,
      database_mutation: false,
      push_sent: false,
      executed: false,
    });
  },
});

const first = orchestrator.ingest({ type: 'DAILY_REPORT', target: null, dedupe_key: 'recovery-1' });
if (first.accepted !== true) throw new Error('Recovery test: initial task was not accepted');

const duplicate = orchestrator.ingest({ type: 'DAILY_REPORT', target: null, dedupe_key: 'recovery-1' });
if (duplicate.accepted !== false || duplicate.reason !== 'DUPLICATE') throw new Error('Recovery test: duplicate was not blocked');

const retry1 = orchestrator.processNext();
if (retry1?.retry_scheduled !== true || retry1.attempts !== 1) throw new Error('Recovery test: first failure was not scheduled for retry');

const retry2 = orchestrator.processNext();
if (retry2?.retry_scheduled !== true || retry2.attempts !== 2) throw new Error('Recovery test: second failure was not scheduled for retry');

const success = orchestrator.processNext();
if (!success || success.recovered !== false) throw new Error('Recovery test: task did not recover successfully');
if (success.item.status !== 'PROCESSING') throw new Error('Recovery test: processing item state mismatch');
if (orchestrator.queue.stats().done !== 1) throw new Error('Recovery test: recovered task was not completed');
if (orchestrator.audit().filter((entry) => entry.result === 'RETRY_SCHEDULED').length !== 2) throw new Error('Recovery test: retry audit count mismatch');
if (orchestrator.audit().filter((entry) => entry.result === 'SIMULATED').length !== 1) throw new Error('Recovery test: success audit missing');

console.log('CHOCO_AUTO_LEVEL_6_4_RELIABILITY_RECOVERY_TEST: PASS');
