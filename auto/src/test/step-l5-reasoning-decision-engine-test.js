// CHOCO AUTO LEVEL 5 — Step 7 test
// LAB/TEST ONLY. No Production, DB mutation, Push, or OneSignal.

import {
  buildReasoningDecision,
  decisionSafetyCheck,
  REASONING_MODE,
} from '../agent/reasoning-decision-engine.js';

const context = {
  mode: 'LAB_OBSERVATION_CONTEXT_ONLY',
  orders: {
    total: 4,
    potentially_stuck_over_30m: 1,
  },
  shippers: {
    total: 2,
    online: 2,
  },
};

const decision = buildReasoningDecision(context);

if (decision.mode !== REASONING_MODE) throw new Error('wrong reasoning mode');
if (decision.recommended_action !== 'REMIND_STUCK_ORDER') throw new Error('stuck-order decision failed');
if (decision.risk !== 'MEDIUM') throw new Error('risk classification failed');
if (decision.approval_required !== true) throw new Error('approval requirement failed');
if (decision.requires_target_selection !== true) throw new Error('target selection flag failed');
if (decision.target !== null) throw new Error('decision must not invent a target');
if (decision.executable !== false) throw new Error('decision became executable');
if (decision.production_write !== false) throw new Error('production write enabled');
if (decision.database_mutation !== false) throw new Error('database mutation enabled');
if (decision.push_sent !== false) throw new Error('push enabled');
if (!decisionSafetyCheck(decision)) throw new Error('decision safety check failed');

const safeReportDecision = buildReasoningDecision({
  mode: 'LAB_OBSERVATION_CONTEXT_ONLY',
  orders: { total: 0, potentially_stuck_over_30m: 0 },
  shippers: { total: 0, online: 0 },
});

if (safeReportDecision.recommended_action !== 'GENERATE_REPORT') throw new Error('default report decision failed');
if (!decisionSafetyCheck(safeReportDecision)) throw new Error('safe report decision check failed');

console.log('CHOCO AUTO STEP 7: PASS — reasoning/decision safety verified');
