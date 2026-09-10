// CHOCO AUTO LEVEL 5 — Step 4: Approval Controller
// LAB/TEST ONLY. Approval changes state only; it never enables Production execution.

export const APPROVAL_CONTROLLER_MODE = 'LAB_APPROVAL_CONTROLLER_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const TERMINAL_STATUSES = new Set(['APPROVED', 'REJECTED']);

function requirePlan(plan) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('CHOCO AUTO APPROVAL: plan object is required');
  }
  if (plan.executable !== false || plan.production_write !== false || plan.push_sent !== false || plan.database_mutation !== false) {
    throw new Error('CHOCO AUTO APPROVAL: unsafe plan rejected');
  }
}

export function createApprovalRequest(plan, requestedBy = 'CHOCO_AI') {
  requirePlan(plan);

  return Object.freeze({
    approval_id: `LAB-APPROVAL-${plan.plan_id ?? Date.now()}`,
    plan_id: plan.plan_id ?? null,
    requested_by: requestedBy,
    risk: plan.risk ?? 'UNKNOWN',
    required: plan.requires_approval === true,
    status: plan.requires_approval === true ? 'PENDING_APPROVAL' : 'NOT_REQUIRED',
    approved_by: null,
    decision_reason: null,
    production_execution_enabled: false,
    production_write: false,
    push_sent: false,
    database_mutation: false,
  });
}

export function decideApproval(request, decision, decidedBy = 'LAB_REVIEWER', reason = null) {
  if (!request || typeof request !== 'object') throw new Error('CHOCO AUTO APPROVAL: request is required');
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error(`CHOCO AUTO APPROVAL: invalid decision: ${decision}`);
  if (TERMINAL_STATUSES.has(request.status)) throw new Error(`CHOCO AUTO APPROVAL: request already ${request.status}`);

  const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  return Object.freeze({
    ...request,
    status,
    approved_by: decidedBy,
    decision_reason: reason,
    production_execution_enabled: false,
    production_write: false,
    push_sent: false,
    database_mutation: false,
  });
}

export function approvalAllowsSimulation(request) {
  if (!request || typeof request !== 'object') return false;
  return request.status === 'APPROVED' || request.status === 'NOT_REQUIRED';
}

export function approvalSafetyCheck(request) {
  return Boolean(
    request &&
    request.approval_id &&
    [ 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'NOT_REQUIRED' ].includes(request.status) &&
    request.production_execution_enabled === false &&
    request.production_write === false &&
    request.push_sent === false &&
    request.database_mutation === false &&
    (request.status !== 'APPROVED' || request.approved_by)
  );
}
