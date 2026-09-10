// CHOCO AUTO LEVEL 5 — Step 9: Decision Validation + Conflict Detection
// LAB/TEST ONLY.
export const DECISION_VALIDATION_MODE = 'LAB_DECISION_VALIDATION_ONLY';
const ALLOWED = new Set(['ASSIGN_SHIPPER','SEND_ALERT','REMIND_STUCK_ORDER','GENERATE_REPORT']);

export function validateDecision(decision) {
  if (!decision || typeof decision !== 'object') return Object.freeze({ status: 'BLOCKED', reason: 'MISSING_DECISION' });
  if (!ALLOWED.has(decision.recommended_action)) return Object.freeze({ status: 'BLOCKED', reason: 'UNSUPPORTED_ACTION' });
  if (decision.executable === true || decision.production_write === true || decision.database_mutation === true || decision.push_sent === true) return Object.freeze({ status: 'BLOCKED', reason: 'UNSAFE_FLAGS' });
  if (decision.requires_target_selection === true && !decision.target) return Object.freeze({ status: 'WAITING_FOR_TARGET', reason: 'TARGET_REQUIRED' });
  return Object.freeze({ status: 'VALID', reason: null });
}

export function detectDecisionConflict(decisions = []) {
  const seen = new Map();
  for (const decision of decisions) {
    const key = decision?.target?.id ?? decision?.target ?? null;
    if (!key) continue;
    const previous = seen.get(String(key));
    if (previous && previous.recommended_action !== decision.recommended_action) {
      return Object.freeze({ conflict: true, target: key, actions: [previous.recommended_action, decision.recommended_action] });
    }
    seen.set(String(key), decision);
  }
  return Object.freeze({ conflict: false, target: null, actions: [] });
}

export function decisionValidationSafetyCheck(result) {
  return Boolean(result && ['VALID','BLOCKED','WAITING_FOR_TARGET'].includes(result.status));
}
