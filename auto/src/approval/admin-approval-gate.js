export const APPROVAL_MODE = 'LAB_ADMIN_APPROVAL_GATE';
export const ADMIN_APPROVAL_REQUIRED = true;
export const APPROVAL_GRANTED = false;
export const EXECUTION_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export function createApprovalState({ requestId = null, scope = 'CHOCO_AUTO_LAB' } = {}) {
  return {
    mode: APPROVAL_MODE,
    request_id: requestId,
    scope,
    approval_required: ADMIN_APPROVAL_REQUIRED,
    approval_granted: APPROVAL_GRANTED,
    execution_permitted: EXECUTION_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    status: 'PENDING_ADMIN_APPROVAL',
    auditable: true,
    revocable: true,
    automatic_action: false,
  };
}

export function adminApprovalSafetyCheck(state = createApprovalState()) {
  return Boolean(
    state.mode === APPROVAL_MODE &&
    state.approval_required === true &&
    state.approval_granted === false &&
    state.execution_permitted === false &&
    state.production_write_permitted === false &&
    state.push_or_onesignal_permitted === false &&
    state.status === 'PENDING_ADMIN_APPROVAL' &&
    state.auditable === true &&
    state.revocable === true &&
    state.automatic_action === false
  );
}

export function approvalDecision(state, decision = 'deny') {
  if (decision !== 'approve') return { ...state, approval_granted: false, status: 'DENIED' };
  return {
    ...state,
    approval_granted: true,
    status: 'APPROVED_FOR_REVIEW_ONLY',
    execution_permitted: false,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    automatic_action: false,
  };
}
