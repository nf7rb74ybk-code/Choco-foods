// CHOCO AUTO LEVEL 5 — Step 7: Reasoning + Decision Engine
// LAB/TEST ONLY. Converts read-only observation context into a non-executable proposal.
// This module never queries, writes, assigns, sends Push/OneSignal, or changes Production.

export const REASONING_MODE = 'LAB_REASONING_DECISION_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

const ALLOWED_ACTIONS = Object.freeze([
  'ASSIGN_SHIPPER',
  'SEND_ALERT',
  'REMIND_STUCK_ORDER',
  'GENERATE_REPORT',
]);

export function buildReasoningDecision(context) {
  if (!context || typeof context !== 'object') {
    throw new Error('CHOCO AUTO REASONING: observation context is required');
  }

  const stuckCount = Number(context.orders?.potentially_stuck_over_30m ?? 0);
  const onlineShippers = Number(context.shippers?.online ?? 0);
  const totalOrders = Number(context.orders?.total ?? 0);

  let action = 'GENERATE_REPORT';
  let risk = 'LOW';
  let approvalRequired = false;
  let reason = 'No urgent operational signal detected; prepare a safe operational report.';
  let requiresTargetSelection = false;

  if (stuckCount > 0) {
    action = 'REMIND_STUCK_ORDER';
    risk = 'MEDIUM';
    approvalRequired = true;
    reason = `${stuckCount} potentially stuck order(s) over 30 minutes were observed.`;
    requiresTargetSelection = true;
  } else if (totalOrders > 0 && onlineShippers === 0) {
    action = 'GENERATE_REPORT';
    risk = 'LOW';
    approvalRequired = false;
    reason = 'Orders exist but no online shippers are observed; generate a report for human review.';
  }

  return Object.freeze({
    mode: REASONING_MODE,
    decision_id: `decision-${Date.now()}`,
    decision: 'PROPOSE_ACTION',
    recommended_action: action,
    risk,
    approval_required: approvalRequired,
    requires_target_selection: requiresTargetSelection,
    target: null,
    reason,
    based_on: Object.freeze({
      observation_mode: context.mode ?? 'UNKNOWN',
      orders_total: totalOrders,
      potentially_stuck_over_30m: stuckCount,
      online_shippers: onlineShippers,
    }),
    executable: false,
    production_write: false,
    database_mutation: false,
    push_sent: false,
  });
}

export function decisionSafetyCheck(decision) {
  return Boolean(
    decision &&
    decision.mode === REASONING_MODE &&
    decision.decision === 'PROPOSE_ACTION' &&
    ALLOWED_ACTIONS.includes(decision.recommended_action) &&
    decision.executable === false &&
    decision.production_write === false &&
    decision.database_mutation === false &&
    decision.push_sent === false &&
    decision.target === null
  );
}
