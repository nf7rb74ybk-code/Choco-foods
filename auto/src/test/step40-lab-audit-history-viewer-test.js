import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import { getAuditHistory, summarizeAuditHistory, viewerSafetyCheck } from '../audit/lab-audit-history-viewer.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-40',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-040' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});

const filtered = getAuditHistory([entry], { queueId: 'LAB-QUEUE-40', action: 'ASSIGN_SHIPPER' });
const summary = summarizeAuditHistory(filtered);

const checks = {
  filter_works: filtered.length === 1,
  summary_total_correct: summary.total === 1,
  summary_safe_entry: summary.safe_entries === 1,
  execution_locked: summary.execution_enabled === false,
  production_access_locked: summary.production_access_permitted === false,
  export_locked: summary.export_enabled === false,
  viewer_safety_passes: viewerSafetyCheck(summary) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_40_LAB_AUDIT_HISTORY_VIEWER',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_access_permitted: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
