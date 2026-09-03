// CHOCO AUTO LAB — admin approval gate
// Step 16: explicit human approval boundary.
// This module creates review decisions only. It never executes production actions.

const APPROVED = 'APPROVED';
const REJECTED = 'REJECTED';
const PENDING = 'PENDING';

function assertProposal(proposal) {
  if (!proposal || typeof proposal !== 'object') {
    throw new Error('A CHOCO AUTO proposal is required');
  }
  if (proposal.mode !== 'REVIEW_ONLY' || proposal.action !== 'NO_AUTOMATIC_ACTION') {
    throw new Error('Unsafe proposal: only REVIEW_ONLY / NO_AUTOMATIC_ACTION is accepted');
  }
}

export function createApprovalRequest(proposal) {
  assertProposal(proposal);
  return Object.freeze({
    approval_id: `APPROVAL_${proposal.proposal_id}`,
    proposal_id: proposal.proposal_id,
    status: PENDING,
    requires_admin: true,
    execution_permitted: false,
    created_at: new Date().toISOString(),
  });
}

export function reviewApproval(request, decision, reviewer = 'admin') {
  if (!request || request.requires_admin !== true) {
    throw new Error('Invalid approval request');
  }
  if (![APPROVED, REJECTED].includes(decision)) {
    throw new Error('Decision must be APPROVED or REJECTED');
  }
  if (!reviewer) throw new Error('A reviewer is required');

  return Object.freeze({
    ...request,
    status: decision,
    reviewer,
    reviewed_at: new Date().toISOString(),
    execution_permitted: false,
  });
}

export const APPROVAL_STATUS = Object.freeze({ PENDING, APPROVED, REJECTED });
