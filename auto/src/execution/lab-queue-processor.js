import { queueSafetyCheck } from '../queue/lab-approval-execution-queue.js';

export const PROCESSOR_MODE = 'LAB_QUEUE_PROCESSOR';
export const PROCESSING_ENABLED = true;
export const EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export function processQueueItem(item) {
  if (!queueSafetyCheck(item)) {
    return {
      result: 'BLOCKED_UNSAFE_QUEUE_ITEM',
      processed: false,
      execution_permitted: false,
      production_write_permitted: false,
      push_or_onesignal_permitted: false,
      automatic_action: false,
      execution_mode: 'SIMULATION_ONLY',
    };
  }

  return {
    result: 'LAB_REVIEW_READY',
    processed: true,
    queue_id: item.queue_id,
    execution_permitted: false,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    automatic_action: false,
    execution_mode: 'SIMULATION_ONLY',
  };
}

export function processorSafetyCheck(result) {
  return Boolean(
    result?.processed === true &&
    result?.execution_permitted === false &&
    result?.production_write_permitted === false &&
    result?.push_or_onesignal_permitted === false &&
    result?.automatic_action === false &&
    result?.execution_mode === 'SIMULATION_ONLY'
  );
}
