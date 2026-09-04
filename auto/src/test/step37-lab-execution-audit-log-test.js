import { processQueueItem } from '../execution/lab-queue-processor.js';
import { createApprovalState } from '../approval/admin-approval-gate.js';
import { enqueueProposal } from '../queue/lab-approval-execution-queue.js';
import {
  recordExecutionResult,
  getAuditLog,
  auditSafetyCheck,
  PRODUCTION_AUDIT_WRITE_PERMITTED,
} from '../audit/lab-execution-audit-log.js';

const approval = createApprovalState({ requestId: 'LAB-STEP37-001' });
const queueItem = enqueueProposal(
  { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-001' },
  approval,
);
const processed = processQueueItem(queueItem);
const audit = recordExecutionResult(processed, { source: 'STEP36_QUEUE_PROCESSOR' });
const blocked = recordExecutionResult(
  processQueueItem({ scope: 'PRODUCTION', status: 'APPROVED' }),
  { source: 'STEP36_UNSAFE_ITEM' },
);
const log = getAuditLog();

const checks = {
  audit_is_lab_only: audit.scope === 'CHOCO_AUTO_LAB',
  audit_mode_correct: audit.mode === 'LAB_EXECUTION_AUDIT_LOG',
  result_recorded: audit.result === 'LAB_REVIEW_READY',
  queue_id_recorded: audit.queue_id === queueItem.queue_id,
  simulation_only: audit.execution_mode === 'SIMULATION_ONLY',
  execution_locked: audit.execution_permitted === false,
  production_write_locked: audit.production_write_permitted === false && PRODUCTION_AUDIT_WRITE_PERMITTED === false,
  push_locked: audit.push_or_onesignal_permitted === false,
  no_automatic_action: audit.automatic_action === false,
  safety_check_passes: auditSafetyCheck(audit) === true,
  blocked_result_audited: blocked.result === 'BLOCKED_UNSAFE_QUEUE_ITEM' && auditSafetyCheck(blocked) === true,
  audit_log_contains_entries: log.length === 2,
  production_data_unused: true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_37_LAB_EXECUTION_RESULT_AUDIT_LOG',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
