import { simulateAction, executionSafetyCheck, productionExecutionSafetyCheck } from '../execution/lab-execution-simulator.js';
import { createApprovalState, approvalDecision } from '../approval/admin-approval-gate.js';

const proposal = simulateAction({
  action: 'ASSIGN_SHIPPER',
  target: 'LAB-ORDER-001',
  payload: { shipper_id: 'LAB-SHIPPER-001' },
});

const pending = createApprovalState({ requestId: 'LAB-PROPOSAL-001' });
const approvedForReview = approvalDecision(pending, 'approve');

const checks = {
  proposal_is_simulation: proposal.result === 'SIMULATED_ONLY',
  proposal_not_executed: proposal.executed === false,
  proposal_no_production_write: proposal.production_write === false,
  proposal_no_database_mutation: proposal.database_mutation === false,
  proposal_safety_check: executionSafetyCheck(proposal) === true,
  approval_required: pending.approval_required === true,
  default_denied: pending.approval_granted === false,
  approval_is_review_only: approvedForReview.status === 'APPROVED_FOR_REVIEW_ONLY',
  approval_does_not_unlock_execution: approvedForReview.execution_permitted === false,
  approval_does_not_unlock_production: approvedForReview.production_write_permitted === false,
  approval_does_not_unlock_push: approvedForReview.push_or_onesignal_permitted === false,
  production_execution_disabled: productionExecutionSafetyCheck() === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_34_PROPOSAL_REVIEW',
  passed: failed.length === 0,
  checks,
  proposal_review_only: true,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
