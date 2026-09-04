import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import { exportAuditHistory, exportGateSafetyCheck } from '../audit/lab-audit-history-export-gate.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-41',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-041' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});

const disabled = exportAuditHistory([entry]);
const explicitlyRequested = exportAuditHistory([entry], { enabled: true });

const checks = {
  default_export_disabled: disabled.exported === false && disabled.result === 'EXPORT_DISABLED',
  default_entries_empty: disabled.entries.length === 0,
  requested_export_still_blocked: explicitlyRequested.exported === false,
  requested_entries_empty: explicitlyRequested.entries.length === 0,
  production_access_locked: disabled.production_access_permitted === false,
  production_write_locked: disabled.production_write_permitted === false,
  push_locked: disabled.push_or_onesignal_permitted === false,
  execution_locked: disabled.execution_permitted === false,
  safety_check_passes: exportGateSafetyCheck(disabled) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_41_LAB_AUDIT_HISTORY_EXPORT_GATE',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_access_permitted: false,
  production_write_permitted: false,
  push_or_onesignal_permitted: false,
  execution_permitted: false,
  export_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
