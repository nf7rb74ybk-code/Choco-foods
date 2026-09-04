import { simulateAction } from '../execution/lab-execution-simulator.js';
import { createApprovalState } from '../approval/admin-approval-gate.js';
import { enqueueProposal } from '../queue/lab-approval-execution-queue.js';
import { processQueueItem } from '../execution/lab-queue-processor.js';
import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import {
  getAuditHistory,
  summarizeAuditHistory,
  viewerSafetyCheck,
  EXPORT_ENABLED,
  PRODUCTION_ACCESS_PERMITTED,
} from '../audit/lab-audit-history-viewer.js';

const proposal = simulateAction({ action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-001' });
const approval = createApprovalState({ requestId: 'LAB-STEP39-001' });
const queueItem = enqueueProposal(proposal, approval);
const processingResult = processQueueItem(queueItem);
const entry = createAuditHistoryEntry({ queueId: queueItem.queue_id, proposal, processingResult });
const history = [entry];
const filtered = getAuditHistory(history, { queueId: queueItem.queue_id });
const summary = summarizeAuditHistory(filtered);

const checks = {
  viewer_is_lab_mode: summary.mode === 'LAB_AUDIT_HISTORY_VIEWER',
  queue_filter_works: filtered.length === 1 && filtered[0].queue_id === queueItem.queue_id,
  action_traceable: filtered[0].proposal_action === 'ASSIGN_SHIPPER',
  result_traceable: filtered[0].processing_result === 'LAB_REVIEW_READY',
  all_entries_safe: summary.safe_entries === summary.total && summary.total === 1,
  execution_locked: summary.execution_enabled === false,
  production_access_locked: summary.production_access_permitted === false && PRODUCTION_ACCESS_PERMITTED === false,
  export_locked: summary.export_enabled === false && EXPORT_ENABLED === false,
  viewer_safety_passes: viewerSafetyCheck(summary) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_39_LAB_AUDIT_HISTORY_VIEWER',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_access_permitted: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
