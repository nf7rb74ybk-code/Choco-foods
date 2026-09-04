import { createApprovalState, adminApprovalSafetyCheck, approvalDecision } from '../approval/admin-approval-gate.js';

const pending = createApprovalState({ requestId: 'LAB-APPROVAL-001' });
const approved = approvalDecision(pending, 'approve');
const denied = approvalDecision(pending, 'deny');

const checks = {
  lab_approval_mode: pending.mode === 'LAB_ADMIN_APPROVAL_GATE',
  admin_approval_required: pending.approval_required === true,
  default_denied: pending.approval_granted === false,
  default_execution_blocked: pending.execution_permitted === false,
  default_production_write_blocked: pending.production_write_permitted === false,
  default_push_blocked: pending.push_or_onesignal_permitted === false,
  pending_status: pending.status === 'PENDING_ADMIN_APPROVAL',
  auditable: pending.auditable === true,
  revocable: pending.revocable === true,
  no_automatic_action: pending.automatic_action === false,
  safety_check_passes: adminApprovalSafetyCheck(pending) === true,
  approval_is_scoped: pending.scope === 'CHOCO_AUTO_LAB',
  approval_does_not_enable_execution: approved.execution_permitted === false,
  approval_does_not_enable_production_write: approved.production_write_permitted === false,
  approval_does_not_enable_push: approved.push_or_onesignal_permitted === false,
  approval_is_review_only: approved.status === 'APPROVED_FOR_REVIEW_ONLY',
  deny_is_revocable: denied.approval_granted === false && denied.status === 'DENIED',
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_31_ADMIN_APPROVAL_GATE',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
