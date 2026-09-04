import { createApprovalRecord } from '../audit/lab-audit-export-approval-record.js';
import { createExportManifest } from '../audit/lab-audit-export-manifest.js';
import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import { createExportApprovalRequest, resolveExportApproval } from '../audit/lab-audit-export-approval-gate.js';
import { appendDecision, findDecision, decisionLedgerSafetyCheck, DECISION_LEDGER_MODE } from '../audit/lab-approval-decision-ledger.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-47',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-047' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});
const manifest = createExportManifest([entry]);
const request = createExportApprovalRequest(manifest, 'LAB_ADMIN_TEST');
const resolution = resolveExportApproval(request, 'approve');
const record = createApprovalRecord(request, resolution);
const ledger = appendDecision([], record);
const found = findDecision(ledger, record.record_id);

const checks = {
  ledger_created: Array.isArray(ledger) && ledger.length === 1,
  mode_correct: found?.mode === DECISION_LEDGER_MODE,
  record_linked: found?.record_id === record.record_id,
  checksum_linked: found?.manifest_checksum === manifest.checksum,
  requester_linked: found?.requested_by === 'LAB_ADMIN_TEST',
  decision_linked: found?.decision === 'APPROVAL_RECORDED_BUT_EXPORT_DISABLED',
  approval_locked: found?.approval_granted === false,
  export_locked: found?.export_approved === false,
  execution_locked: found?.execution_permitted === false,
  production_access_locked: found?.production_access_permitted === false,
  production_write_locked: found?.production_write_permitted === false,
  automatic_action_locked: found?.automatic_action === false,
  lookup_works: findDecision(ledger, record.record_id) !== null,
  safety_check_passes: decisionLedgerSafetyCheck(ledger) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_47_LAB_APPROVAL_DECISION_LEDGER',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
