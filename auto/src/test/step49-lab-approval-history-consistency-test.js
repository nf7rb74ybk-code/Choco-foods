import { createApprovalRecord } from '../audit/lab-audit-export-approval-record.js';
import { createExportManifest } from '../audit/lab-audit-export-manifest.js';
import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import { createExportApprovalRequest, resolveExportApproval } from '../audit/lab-audit-export-approval-gate.js';
import { appendDecision } from '../audit/lab-approval-decision-ledger.js';
import { validateLedgerIntegrity } from '../audit/lab-approval-decision-ledger-integrity.js';
import { validateApprovalHistoryConsistency, approvalHistoryConsistencySafetyCheck, CONSISTENCY_MODE } from '../audit/lab-approval-history-consistency.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-49',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-049' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});
const manifest = createExportManifest([entry]);
const request = createExportApprovalRequest(manifest, 'LAB_ADMIN_TEST');
const resolution = resolveExportApproval(request, 'approve');
const approvalRecord = createApprovalRecord(request, resolution);
const ledger = appendDecision([], approvalRecord);
const integrity = validateLedgerIntegrity(ledger);
const consistency = validateApprovalHistoryConsistency({ approvalRecord, ledger, integrity });

const checks = {
  mode_correct: consistency.mode === CONSISTENCY_MODE,
  consistency_passes: consistency.consistent === true,
  exactly_one_linked_record: consistency.linked_records === 1,
  record_id_linked: consistency.record_id === approvalRecord.record_id,
  integrity_valid: integrity.valid === true,
  production_access_locked: consistency.production_access_permitted === false,
  production_write_locked: consistency.production_write_permitted === false,
  execution_locked: consistency.execution_permitted === false,
  automatic_action_locked: consistency.automatic_action === false,
  safety_check_passes: approvalHistoryConsistencySafetyCheck(consistency) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_49_LAB_APPROVAL_HISTORY_CONSISTENCY',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
