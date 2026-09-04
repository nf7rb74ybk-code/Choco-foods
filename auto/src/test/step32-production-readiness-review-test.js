import { createApprovalState, approvalDecision } from '../approval/admin-approval-gate.js';

const pending = createApprovalState({ requestId: 'LAB-READINESS-001' });
const approved = approvalDecision(pending, 'approve');

const checks = {
  lab_scope_only: pending.scope === 'CHOCO_AUTO_LAB',
  approval_required: pending.approval_required === true,
  default_denied: pending.approval_granted === false,
  execution_locked: pending.execution_permitted === false,
  production_write_locked: pending.production_write_permitted === false,
  push_locked: pending.push_or_onesignal_permitted === false,
  approval_remains_review_only: approved.status === 'APPROVED_FOR_REVIEW_ONLY',
  approval_does_not_unlock_execution: approved.execution_permitted === false,
  approval_does_not_unlock_production: approved.production_write_permitted === false,
  approval_does_not_unlock_push: approved.push_or_onesignal_permitted === false,
  no_automatic_action: approved.automatic_action === false,
  auditable: pending.auditable === true,
  revocable: pending.revocable === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_32_PRODUCTION_READINESS_REVIEW',
  passed: failed.length === 0,
  checks,
  readiness_review_only: true,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
