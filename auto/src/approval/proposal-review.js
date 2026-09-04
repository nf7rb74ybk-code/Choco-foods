export const PROPOSAL_REVIEW_MODE = 'LAB_PROPOSAL_REVIEW';
export const PROPOSAL_REQUIRES_ADMIN_APPROVAL = true;
export const PROPOSAL_EXECUTION_PERMITTED = false;
export const PROPOSAL_PRODUCTION_WRITE_PERMITTED = false;
export const PROPOSAL_PUSH_PERMITTED = false;

export function createProposal({ proposalId = null, action = null, target = null, payload = {} } = {}) {
  return {
    mode: PROPOSAL_REVIEW_MODE,
    proposal_id: proposalId,
    action,
    target,
    payload,
    status: 'PENDING_REVIEW',
    requires_admin_approval: PROPOSAL_REQUIRES_ADMIN_APPROVAL,
    execution_permitted: PROPOSAL_EXECUTION_PERMITTED,
    production_write_permitted: PROPOSAL_PRODUCTION_WRITE_PERMITTED,
    push_permitted: PROPOSAL_PUSH_PERMITTED,
    automatic_action: false,
    auditable: true,
    revocable: true,
  };
}

export function proposalSafetyCheck(proposal = createProposal()) {
  return Boolean(
    proposal.mode === PROPOSAL_REVIEW_MODE &&
    proposal.status === 'PENDING_REVIEW' &&
    proposal.requires_admin_approval === true &&
    proposal.execution_permitted === false &&
    proposal.production_write_permitted === false &&
    proposal.push_permitted === false &&
    proposal.automatic_action === false &&
    proposal.auditable === true &&
    proposal.revocable === true
  );
}

export function reviewProposal(proposal, decision = 'deny') {
  if (decision !== 'approve') {
    return { ...proposal, status: 'DENIED', execution_permitted: false, production_write_permitted: false, push_permitted: false };
  }
  return { ...proposal, status: 'APPROVED_FOR_REVIEW_ONLY', execution_permitted: false, production_write_permitted: false, push_permitted: false, automatic_action: false };
}
