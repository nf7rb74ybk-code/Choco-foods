import { createExportManifest } from '../audit/lab-audit-export-manifest.js';
import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import {
  createExportApprovalRequest,
  resolveExportApproval,
} from '../audit/lab-audit-export-approval-gate.js';
import {
  APPROVAL_RECORD_MODE,
  createApprovalRecord,
  approvalRecordSafetyCheck,
} from '../audit/lab-audit-export-approval-record.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-45',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-045' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});

const manifest = createExportManifest([entry]);
const request = createExportApprovalRequest(manifest, 'LAB_ADMIN_TEST');
const denied = resolveExportApproval(request, 'deny');
const approvedButLocked = resolveExportApproval(request, 'approve');
const denyRecord = createApprovalRecord(request, denied);
const approveRecord = createApprovalRecord(request, approvedButLocked);

const checks = {
  mode_correct: denyRecord.mode === APPROVAL_RECORD_MODE,
  record_id_present: typeof denyRecord.record_id === 'string' && denyRecord.record_id.length > 0,
  manifest_checksum_attached: denyRecord.manifest_checksum === manifest.checksum,
  requested_by_recorded: denyRecord.requested_by === 'LAB_ADMIN_TEST',
  approval_required_recorded: denyRecord.approval_required === true,
  deny_decision_recorded: denyRecord.decision === 'EXPORT_APPROVAL_DENIED',
  approve_decision_recorded: approveRecord.decision === 'APPROVAL_RECORDED_BUT_EXPORT_DISABLED',
  approval_granted_locked: approveRecord.approval_granted === false,
  export_approved_locked: approveRecord.export_approved === false,
  export_disabled: approveRecord.export_enabled === false,
  execution_disabled: approveRecord.execution_permitted === false,
  production_access_locked: approveRecord.production_access_permitted === false,
  production_write_locked: approveRecord.production_write_permitted === false,
  automatic_action_locked: approveRecord.automatic_action === false,
  recorded_at_present: typeof approveRecord.recorded_at === 'string' && approveRecord.recorded_at.length > 0,
  deny_safety_check_passes: approvalRecordSafetyCheck(denyRecord) === true,
  approve_safety_check_passes: approvalRecordSafetyCheck(approveRecord) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_45_LAB_AUDIT_EXPORT_APPROVAL_RECORD',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  export_enabled: false,
  execution_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
