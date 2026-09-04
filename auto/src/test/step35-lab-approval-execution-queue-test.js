import { simulateAction } from '../execution/lab-execution-simulator.js';
import { createApprovalState } from '../approval/admin-approval-gate.js';
import {
  enqueueProposal,
  queueSafetyCheck,
  executionDecision,
} from '../queue/lab-approval-execution-queue.js';

const proposal = simulateAction({
  action: 'ASSIGN_SHIPPER',
  target: 'LAB-ORDER-001',
  payload: { shipper_id: 'LAB-SHIPPER-001' },
});
const approval = createApprovalState({ requestId: 'LAB-QUEUE-001' });
const queued = enqueueProposal(proposal, approval);
const approvedForReview = executionDecision(queued, 'approve');
const denied = executionDecision(queued, 'deny');

const checks = {
  queue_is_lab_only: queued.scope === 'CHOCO_AUTO_LAB',
  queue_mode_correct: queued.mode === 'LAB_APPROVAL_EXECUTION_QUEUE',
  proposal_is_simulation: queued.proposal.result === 'SIMULATED_ONLY',
  pending_admin_approval: queued.status === 'PENDING_ADMIN_APPROVAL',
  approval_required: queued.approval.approval_required === true,
  default_denied: queued.approval.approval_granted === false,
  execution_locked: queued.execution_permitted === false,
  production_write_locked: queued.production_write_permitted === false,
  push_locked: queued.push_or_onesignal_permitted === false,
  no_automatic_action: queued.automatic_action === false,
  queue_safety_check: queueSafetyCheck(queued) === true,
  approval_remains_review_only: approvedForReview.status === 'APPROVED_FOR_REVIEW_ONLY',
  approval_does_not_unlock_execution: approvedForReview.execution_permitted === false,
  approval_does_not_unlock_production: approvedForReview.production_write_permitted === false,
  denial_blocks_execution: denied.execution_permitted === false && denied.status === 'DENIED',
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_35_LAB_APPROVAL_EXECUTION_QUEUE',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
