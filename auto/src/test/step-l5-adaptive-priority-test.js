// CHOCO AUTO LEVEL 5 — Adaptive Priority Intelligence Test
// LAB/TEST ONLY.
import { rankDecisions, adaptivePrioritySafetyCheck } from '../agent/adaptive-priority-engine.js';

const context = {
  orders: { total: 12, potentially_stuck_over_30m: [{ id: 1 }, { id: 2 }] },
  shippers: { online: 0 },
};

const ranked = rankDecisions([
  { recommended_action: 'GENERATE_REPORT', requires_approval: false },
  { recommended_action: 'REMIND_STUCK_ORDER', requires_approval: true },
  { recommended_action: 'ASSIGN_SHIPPER', requires_approval: true },
], context);

if (ranked[0].recommended_action !== 'ASSIGN_SHIPPER') throw new Error('Expected ASSIGN_SHIPPER to rank first');
if (ranked[0].priority_score <= ranked[1].priority_score) throw new Error('Expected descending priority scores');
if (!adaptivePrioritySafetyCheck(ranked)) throw new Error('Adaptive priority safety gate failed');
if (ranked.some((item) => item.executed || item.production_write || item.database_mutation || item.push_sent)) {
  throw new Error('Unsafe execution flag detected');
}

console.log('CHOCO_AUTO_LEVEL_5_ADAPTIVE_PRIORITY_TEST: PASS');
