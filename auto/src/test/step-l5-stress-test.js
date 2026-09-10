// CHOCO AUTO LEVEL 5 — Final Stress Test
// LAB/TEST ONLY. No production execution, writes, database mutation, or Push/OneSignal.
import { createLabOrchestrator } from '../agent/auto-orchestrator.js';
import { finalSafetyCheck } from '../agent/final-safety-gate.js';
import { rankDecisions } from '../agent/adaptive-priority-engine.js';

const context = {
  orders: { total: 20, potentially_stuck_over_30m: [{ id: 1 }, { id: 2 }, { id: 3 }] },
  shippers: { online: 1 },
};

const ranked = rankDecisions([
  { recommended_action: 'GENERATE_REPORT', requires_approval: false },
  { recommended_action: 'REMIND_STUCK_ORDER', requires_approval: true },
  { recommended_action: 'ASSIGN_SHIPPER', requires_approval: true },
], context);

if (ranked[0].recommended_action !== 'ASSIGN_SHIPPER') throw new Error('Stress ranking failed');

const orchestrator = createLabOrchestrator();
const events = [
  { type: 'ORDER_STUCK', target: null, context: { count: 3 }, dedupe_key: 'stress:1' },
  { type: 'ORDER_STUCK', target: null, context: { count: 3 }, dedupe_key: 'stress:1' },
  { type: 'ORDER_STUCK', target: null, context: { count: 2 }, dedupe_key: 'stress:2' },
  // event-trigger maps DAILY_REPORT -> GENERATE_REPORT; GENERATE_REPORT itself is a task type, not an event type.
  { type: 'DAILY_REPORT', target: null, context: {}, dedupe_key: 'stress:3' },
];

const accepted = events.map((event) => orchestrator.ingest(event));
if (!accepted[0].accepted || accepted[1].accepted) throw new Error('Idempotency stress check failed');
if (!accepted[2].accepted || !accepted[3].accepted) throw new Error('Queue stress ingestion failed');

let processed = 0;
for (;;) {
  const result = orchestrator.processNext();
  if (!result) break;
  processed += 1;
  if (!finalSafetyCheck(result.result)) throw new Error('Final safety gate failed during stress run');
  if (result.result.executed !== false || result.result.production_write !== false || result.result.database_mutation !== false || result.result.push_sent !== false) {
    throw new Error('Unsafe flag detected during stress run');
  }
}

if (processed !== 3) throw new Error(`Expected 3 processed tasks, got ${processed}`);
if (orchestrator.queue.size() !== 0) throw new Error('Queue was not drained');
if (orchestrator.audit().length !== 3) throw new Error('Audit count mismatch');

console.log('CHOCO_AUTO_LEVEL_5_FINAL_STRESS_TEST: PASS');
