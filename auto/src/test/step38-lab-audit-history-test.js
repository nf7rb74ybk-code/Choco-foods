import { simulateAction } from '../execution/lab-execution-simulator.js';
import { createApprovalState } from '../approval/admin-approval-gate.js';
import { enqueueProposal } from '../queue/lab-approval-execution-queue.js';
import { processQueueItem } from '../execution/lab-queue-processor.js';
import {
  createAuditHistoryEntry,
  traceAuditHistory,
  auditHistorySafetyCheck,
  PRODUCTION_READ_PERMITTED,
  PRODUCTION_WRITE_PERMITTED,
} from '../audit/lab-audit-history.js';

const proposal = simulateAction({ action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-001' });
const approval = createApprovalState({ requestId: 'LAB-STEP38-001' });
const queueItem = enqueueProposal(proposal, approval);
const processingResult = processQueueItem(queueItem);
const auditEntry = createAuditHistoryEntry({
  queueId: queueItem.queue_id,
  proposal,
  processingResult,
});
const history = traceAuditHistory([auditEntry], queueItem.queue_id);

const checks = {
  audit_mode_is_lab: auditEntry.audit_mode === 'LAB_AUDIT_HISTORY',
  queue_traceable: auditEntry.queue_id === queueItem.queue_id,
  proposal_traceable: auditEntry.proposal_action === 'ASSIGN_SHIPPER',
  result_traceable: auditEntry.processing_result === 'LAB_REVIEW_READY',
  history_lookup_works: history.length === 1 && history[0].queue_id === queueItem.queue_id,
  simulation_only: auditEntry.execution_mode === 'SIMULATION_ONLY',
  execution_locked: auditEntry.execution_permitted === false,
  production_read_locked: PRODUCTION_READ_PERMITTED === false && auditEntry.production_read_permitted === false,
  production_write_locked: PRODUCTION_WRITE_PERMITTED === false && auditEntry.production_write_permitted === false,
  push_locked: auditEntry.push_or_onesignal_permitted === false,
  automatic_action_locked: auditEntry.automatic_action === false,
  safety_check_passes: auditHistorySafetyCheck(auditEntry) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_38_LAB_AUDIT_HISTORY',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_read_permitted: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
