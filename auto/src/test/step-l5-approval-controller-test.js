// CHOCO AUTO LEVEL 5 — Step 4 test
// Verifies approval state transitions and hard safety invariants.

import { buildPlan, createTask } from '../agent/task-planner.js';
import {
  createApprovalRequest,
  decideApproval,
  approvalAllowsSimulation,
  approvalSafetyCheck,
} from '../agent/approval-controller.js';

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const highRiskPlan = buildPlan(createTask({
  type: 'ASSIGN_SHIPPER',
  target: 'order-test-003',
  context: { shipper_id: 'shipper-test-001' },
}));

const pending = createApprovalRequest(highRiskPlan);
assert(pending.status === 'PENDING_APPROVAL', 'high-risk plan starts pending');
assert(approvalAllowsSimulation(pending) === false, 'pending approval cannot simulate');
assert(approvalSafetyCheck(pending) === true, 'pending request is safe');
assert(pending.production_execution_enabled === false, 'production execution stays disabled');

const approved = decideApproval(pending, 'APPROVE', 'LAB_ADMIN', 'Approved for lab simulation');
assert(approved.status === 'APPROVED', 'approval transitions to approved');
assert(approved.approved_by === 'LAB_ADMIN', 'reviewer is recorded');
assert(approvalAllowsSimulation(approved) === true, 'approved request may enter lab simulation');
assert(approved.production_execution_enabled === false, 'approval never enables production');
assert(approved.production_write === false, 'approval never permits production write');
assert(approved.push_sent === false, 'approval never sends push');
assert(approved.database_mutation === false, 'approval never mutates database');
assert(approvalSafetyCheck(approved) === true, 'approved request remains safe');

const rejected = decideApproval(pending, 'REJECT', 'LAB_ADMIN', 'Rejected for lab test');
assert(rejected.status === 'REJECTED', 'rejection transitions to rejected');
assert(approvalAllowsSimulation(rejected) === false, 'rejected request cannot simulate');
assert(approvalSafetyCheck(rejected) === true, 'rejected request is safe');

const lowRiskPlan = buildPlan(createTask({ type: 'GENERATE_REPORT', target: 'daily-test' }));
const notRequired = createApprovalRequest(lowRiskPlan);
assert(notRequired.status === 'NOT_REQUIRED', 'low-risk report does not require approval');
assert(approvalAllowsSimulation(notRequired) === true, 'no-approval report may enter lab simulation');

console.log('PASS: CHOCO AUTO LEVEL 5 STEP 4 — APPROVAL CONTROLLER');
console.log('PENDING -> APPROVED/REJECTED');
console.log('PRODUCTION_EXECUTION=false');
console.log('DATABASE_MUTATION=false');
console.log('PUSH_SENT=false');
