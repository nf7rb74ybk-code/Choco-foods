// CHOCO AUTO LEVEL 5 — Adaptive Priority Intelligence
// LAB/TEST ONLY. Deterministic scoring; never executes or writes Production.

export const ADAPTIVE_PRIORITY_MODE = 'LAB_ADAPTIVE_PRIORITY_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const ACTION_BASE = Object.freeze({
  ASSIGN_SHIPPER: 80,
  REMIND_STUCK_ORDER: 70,
  SEND_ALERT: 50,
  GENERATE_REPORT: 20,
});

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function scoreDecision(decision = {}, context = {}) {
  const action = decision.recommended_action;
  let score = ACTION_BASE[action] ?? 10;

  const stuck = Number(context.orders?.potentially_stuck_over_30m?.length ?? context.potentially_stuck_over_30m ?? 0);
  const totalOrders = Number(context.orders?.total ?? context.total_orders ?? 0);
  const onlineShippers = Number(context.shippers?.online ?? context.online_shippers ?? 0);

  if (stuck > 0) score += Math.min(15, stuck * 5);
  if (totalOrders >= 10) score += 5;
  if (onlineShippers === 0 && totalOrders > 0) score += 10;
  if (decision.requires_approval) score += 2;

  return clamp(score);
}

export function rankDecisions(decisions = [], context = {}) {
  if (!Array.isArray(decisions)) throw new Error('CHOCO AUTO ADAPTIVE: decisions must be an array');
  return Object.freeze(decisions
    .map((decision, index) => Object.freeze({
      ...decision,
      priority_score: scoreDecision(decision, context),
      original_index: index,
    }))
    .sort((a, b) => b.priority_score - a.priority_score || a.original_index - b.original_index));
}

export function adaptivePrioritySafetyCheck(result) {
  return Boolean(
    result &&
    ADAPTIVE_PRIORITY_MODE === 'LAB_ADAPTIVE_PRIORITY_ONLY' &&
    PRODUCTION_EXECUTION_ENABLED === false &&
    PRODUCTION_WRITE_PERMITTED === false &&
    DATABASE_MUTATION_PERMITTED === false &&
    PUSH_OR_ONESIGNAL_PERMITTED === false &&
    Array.isArray(result)
  );
}
