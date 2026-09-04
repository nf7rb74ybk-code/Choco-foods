import { createApprovalState, approvalDecision } from '../approval/admin-approval-gate.js';
import { enqueueProposal } from '../queue/lab-approval-execution-queue.js';
import {
  processQueueItem,
  processorSafetyCheck,
  EXECUTION_ENABLED,
  PRODUCTION_WRITE_PERMITTED,
  PUSH_OR_ONESIGNAL_PERMITTED,
} from '../execution/lab-queue-processor.js';

const approval = createApprovalState({ requestId: 'LAB-STEP36-001' });
const queueItem = enqueueProposal(
  { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-001' },
  approval,
);
const processed = processQueueItem(queueItem);
const approved = approvalDecision(approval, 'approve');
const approvedQueueItem = { ...queueItem, approval: approved };
const approvedProcessed = processQueueItem(approvedQueueItem);

const checks = {
  processor_is_lab_mode: processed.execution_mode === 'SIMULATION_ONLY',
  queue_processed_without_execution: processed.processed === true && processed.execution_permitted === false,
  approved_item_still_not_executable: approvedProcessed.execution_permitted === false,
  production_write_locked: processed.production_write_permitted === false && PRODUCTION_WRITE_PERMITTED === false,
  push_locked: processed.push_or_onesignal_permitted === false && PUSH_OR_ONESIGNAL_PERMITTED === false,
  global_execution_disabled: EXECUTION_ENABLED === false,
  no_automatic_action: processed.automatic_action === false && approvedProcessed.automatic_action === false,
  safety_check_passes: processorSafetyCheck(processed) === true,
  unsafe_item_blocked: processQueueItem({ scope: 'PRODUCTION', status: 'APPROVED' }).result === 'BLOCKED_UNSAFE_QUEUE_ITEM',
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_36_LAB_QUEUE_PROCESSOR',
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
