// CHOCO AUTO LEVEL 5 — Steps 19-20: Final LAB Integrity Test
// This file is intended to be run by the project's configured JS test runner.
import { createLabOrchestrator } from '../agent/auto-orchestrator.js';
import { finalSafetyCheck } from '../agent/final-safety-gate.js';
import { buildObservationContext } from '../agent/observation-context-controller.js';
import { buildReasoningDecision } from '../agent/reasoning-decision-engine.js';
import { validateDecision, detectDecisionConflict } from '../agent/decision-validation.js';

const snapshot = {
  mode: 'LIVE_READ_ONLY',
  orders: { total: 3, by_status: { 'Chờ xác nhận': 0, 'Đã nhận': 0, 'Đang lấy hàng': 0, 'Đang giao': 0, 'Đã giao': 0, 'Hoàn thành': 0, 'Đã huỷ': 0 }, potentially_stuck_over_30m: [{ id: 1 }, { id: 2 }] },
  shippers: { total: 2, online: 1 },
  gps_history_rows_observed: 4,
};

const context = buildObservationContext(snapshot);
const decision = buildReasoningDecision(context);
const validation = validateDecision(decision);
const conflict = detectDecisionConflict([
  { recommended_action: 'ASSIGN_SHIPPER', target: { id: 1 } },
  { recommended_action: 'REMIND_STUCK_ORDER', target: { id: 1 } },
]);
if (validation.status !== 'WAITING_FOR_TARGET') throw new Error('Expected WAITING_FOR_TARGET');
if (!conflict.conflict) throw new Error('Expected conflict detection');

const orchestrator = createLabOrchestrator();
const accepted = orchestrator.ingest({ type: 'ORDER_STUCK', target: null, context: { count: 2 }, dedupe_key: 'test:stuck' });
if (!accepted.accepted) throw new Error('Expected event to be accepted');
const processed = orchestrator.processNext();
if (!processed) throw new Error('Expected queue task to process');
if (!finalSafetyCheck(processed.result)) throw new Error('Final safety gate failed');
if (processed.result.executed !== false || processed.result.production_write !== false || processed.result.database_mutation !== false || processed.result.push_sent !== false) throw new Error('Unsafe flag detected');

console.log('CHOCO_AUTO_LEVEL_5_FINAL_LAB_TEST: PASS');
