import { createExportManifest } from '../audit/lab-audit-export-manifest.js';
import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import {
  createExportApprovalRequest,
  resolveExportApproval,
  approvalGateSafetyCheck,
} from '../audit/lab-audit-export-approval-gate.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-44',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-044' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});

const manifest = createExportManifest([entry]);
const request = createExportApprovalRequest(manifest, 'LAB_ADMIN_TEST');
const denied = resolveExportApproval(request, 'deny');
const approvedButLocked = resolveExportApproval(request, 'approve');

const checks = {
  request_mode_correct: request.mode === 'LAB_AUDIT_EXPORT_APPROVAL_GATE',
  manifest_checksum_attached: request.manifest_checksum === manifest.checksum,
  approval_required: request.approval_required === true,
  approval_starts_denied: request.approval_granted === false,
  export_starts_disabled: request.export_enabled === false,
  deny_keeps_export_disabled: denied.export_enabled === false && denied.export_approved === false,
  approve_cannot_enable_export: approvedButLocked.export_enabled === false,
  approve_cannot_grant_export: approvedButLocked.export_approved === false,
  approve_cannot_enable_execution: approvedButLocked.execution_permitted === false,
  production_access_locked: approvedButLocked.production_access_permitted === false,
  production_write_locked: approvedButLocked.production_write_permitted === false,
  automatic_action_locked: approvedButLocked.automatic_action === false,
  safety_check_passes: approvalGateSafetyCheck(approvedButLocked) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_44_LAB_AUDIT_EXPORT_APPROVAL_GATE',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  export_enabled: false,
  execution_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
