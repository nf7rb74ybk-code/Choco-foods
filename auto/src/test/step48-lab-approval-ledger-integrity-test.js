import { createApprovalRecord } from '../audit/lab-audit-export-approval-record.js';
import { createExportManifest } from '../audit/lab-audit-export-manifest.js';
import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import { createExportApprovalRequest, resolveExportApproval } from '../audit/lab-audit-export-approval-gate.js';
import { appendDecision } from '../audit/lab-approval-decision-ledger.js';
import { validateLedgerIntegrity, ledgerIntegritySafetyCheck, LEDGER_INTEGRITY_MODE } from '../audit/lab-approval-decision-ledger-integrity.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-48',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-048' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});
const manifest = createExportManifest([entry]);
const request = createExportApprovalRequest(manifest, 'LAB_ADMIN_TEST');
const resolution = resolveExportApproval(request, 'approve');
const record = createApprovalRecord(request, resolution);
const ledger = appendDecision([], record);
const integrity = validateLedgerIntegrity(ledger);

const checks = {
  integrity_mode_correct: integrity.mode === LEDGER_INTEGRITY_MODE,
  ledger_valid: integrity.valid === true,
  entries_checked: integrity.entries_checked === 1,
  invalid_entries_zero: integrity.invalid_entries === 0,
  production_access_locked: integrity.production_access_permitted === false,
  production_write_locked: integrity.production_write_permitted === false,
  execution_locked: integrity.execution_permitted === false,
  automatic_action_locked: integrity.automatic_action === false,
  safety_check_passes: ledgerIntegritySafetyCheck(integrity) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_48_LAB_APPROVAL_LEDGER_INTEGRITY',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
