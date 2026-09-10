// CHOCO AUTO LEVEL 5 — Step 4 pipeline test
// Verifies Agent -> Planner -> Safety Gate -> Approval Controller -> Simulator.

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
assert(result.simulations.length === 0, 'pending approval blocks simulation');
assert(result.executed === false, 'pipeline never executes Production');
assert(result.production_write === false, 'pipeline cannot write Production');
assert(result.database_mutation === false, 'pipeline cannot mutate database');
assert(result.push_sent === false, 'pipeline cannot send Push/OneSignal');

const report = runAgentPipeline({ type: 'GENERATE_REPORT', target: 'daily-2026-09-10' });
assert(report.approval_required === false, 'low-risk report needs no approval');
assert(report.approval_status === 'NOT_REQUIRED', 'report approval status is correct');
assert(report.simulations.length === 1, 'no-approval report enters lab simulation');
assert(report.simulations[0].result === 'SIMULATED_ONLY', 'report is simulation only');
assert(report.simulations[0].executed === false, 'report is not executed');

console.log('PASS: CHOCO AUTO LEVEL 5 STEP 4 — APPROVAL PIPELINE');
console.log('CHAIN=AGENT->PLANNER->SAFETY_GATE->APPROVAL_CONTROLLER->EXECUTION_SIMULATOR');
console.log('PRODUCTION_EXECUTION=false');
console.log('DATABASE_MUTATION=false');
console.log('PUSH_SENT=false');
console.log(`SIMULATIONS=${result.simulations.length + report.simulations.length}`);
