export const QUEUE_SCOPE = 'CHOCO_AUTO_LAB';
export const QUEUE_MODE = 'LAB_APPROVAL_EXECUTION_QUEUE';
export const EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export function enqueueProposal(proposal, approvalState) {
  return {
    queue_id: `LAB-QUEUE-${Date.now()}`,
    scope: QUEUE_SCOPE,
    mode: QUEUE_MODE,
    proposal,
    approval: approvalState,
    status: 'PENDING_ADMIN_APPROVAL',
    execution_permitted: false,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    automatic_action: false,
    queued_at: new Date().toISOString(),
  };
}

export function queueSafetyCheck(item) {
  return Boolean(
    item?.scope === QUEUE_SCOPE &&
    item?.mode === QUEUE_MODE &&
    item?.status === 'PENDING_ADMIN_APPROVAL' &&
    item?.approval?.approval_required === true &&
    item?.approval?.approval_granted === false &&
    item?.execution_permitted === false &&
    item?.production_write_permitted === false &&
    item?.push_or_onesignal_permitted === false &&
    item?.automatic_action === false
  );
}

export function executionDecision(item, decision = 'deny') {
  if (decision !== 'approve') {
    return { ...item, status: 'DENIED', execution_permitted: false };
  }
  return {
    ...item,
    status: 'APPROVED_FOR_REVIEW_ONLY',
    execution_permitted: false,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    automatic_action: false,
  };
}
