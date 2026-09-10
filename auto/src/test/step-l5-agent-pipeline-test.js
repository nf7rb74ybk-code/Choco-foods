// CHOCO AUTO LEVEL 5 — Step 3 test
// Verifies the complete Agent -> Planner -> Safety Gate -> Simulator chain.

import { runAgentPipeline } from '../agent/agent-pipeline.js';

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const result = runAgentPipeline({
  type: 'ASSIGN_SHIPPER',
  target: 'order-test-002',
  context: { shipper_id: 'shipper-test-001', status: 'Đã nhận' },
});

assert(result.mode === 'LAB_AGENT_PIPELINE_ONLY', 'pipeline stays in LAB mode');
assert(result.plan.planner_mode === 'LAB_PLANNER_ONLY', 'planner is connected');
assert(result.safety.allowed === true, 'safety gate allows safe lab plan');
assert(result.approval_required === true, 'high-risk action requires approval');
assert(result.approval_status === 'PENDING_APPROVAL', 'approval is pending');
assert(result.simulations.length === 1, 'one requested action is simulated');
assert(result.simulations[0].result === 'SIMULATED_ONLY', 'action is simulated only');
assert(result.simulations[0].executed === false, 'action is not executed');
assert(result.executed === false, 'pipeline never executes Production');
assert(result.production_write === false, 'pipeline cannot write Production');
assert(result.database_mutation === false, 'pipeline cannot mutate database');
assert(result.push_sent === false, 'pipeline cannot send Push/OneSignal');

const report = runAgentPipeline({ type: 'GENERATE_REPORT', target: 'daily-2026-09-10' });
assert(report.approval_required === false, 'low-risk report needs no approval');
assert(report.approval_status === 'NOT_REQUIRED', 'report approval status is correct');
assert(report.simulations[0].result === 'SIMULATED_ONLY', 'report is simulation only');

console.log('PASS: CHOCO AUTO LEVEL 5 STEP 3 — AGENT PIPELINE');
console.log('CHAIN=AGENT->PLANNER->SAFETY_GATE->EXECUTION_SIMULATOR');
console.log('PRODUCTION_EXECUTION=false');
console.log('DATABASE_MUTATION=false');
console.log('PUSH_SENT=false');
console.log(`SIMULATIONS=${result.simulations.length + report.simulations.length}`);
