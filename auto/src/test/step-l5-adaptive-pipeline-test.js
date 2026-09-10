// CHOCO AUTO LEVEL 5 — Adaptive Pipeline Integration Test
// LAB/TEST ONLY.
import { runAgentPipeline } from '../agent/agent-pipeline.js';
import { createTaskQueue, taskQueueSafetyCheck } from '../agent/task-queue.js';

const snapshot = {
  mode: 'LIVE_READ_ONLY',
  orders: {
    total: 12,
    potentially_stuck_over_30m: [{ id: 1 }, { id: 2 }, { id: 3 }],
  },
  shippers: { total: 2, online: 1 },
};

const result = runAgentPipeline({
  observationContext: snapshot,
  requestedBy: 'CHOCO_AUTO_LAB',
});

if (result.priority_score === null || result.priority_score <= 0) throw new Error('Adaptive priority score missing');
if (result.priority_decision?.priority_score !== result.priority_score) throw new Error('Priority decision mismatch');
if (result.task?.priority_score !== result.priority_score) throw new Error('Task priority score not propagated');
if (result.executed !== false || result.production_write !== false || result.database_mutation !== false || result.push_sent !== false) {
  throw new Error('Unsafe execution flag detected');
}

const queue = createTaskQueue();
if (!taskQueueSafetyCheck(queue)) throw new Error('Queue safety check failed');
queue.enqueue({ type: 'REMIND_STUCK_ORDER', target: { id: 1 }, priority_score: 72, dedupe_key: 'adaptive:1' });
queue.enqueue({ type: 'REMIND_STUCK_ORDER', target: { id: 2 }, priority_score: 88, dedupe_key: 'adaptive:2' });
const next = queue.next();
if (!next || next.task.target.id !== 2) throw new Error('Adaptive queue did not select highest-scored task');
if (next.adaptive_priority_score !== 88) throw new Error('Adaptive queue score missing');

console.log('CHOCO_AUTO_ADAPTIVE_PIPELINE_TEST: PASS');
