export const EXECUTION_MODE = 'LAB_SIMULATION_ONLY';
export const SIMULATION_ENABLED = true;
export const PRODUCTION_EXECUTION_ENABLED = false;

const ALLOWED_ACTIONS = new Set([
  'ASSIGN_SHIPPER',
  'SEND_ALERT',
  'REMIND_STUCK_ORDER',
  'GENERATE_REPORT',
]);

export function simulateAction({ action, target = null, payload = {} } = {}) {
  const actionAllowed = ALLOWED_ACTIONS.has(action);

  return {
    mode: EXECUTION_MODE,
    simulated: true,
    executed: false,
    production: false,
    production_write: false,
    push_sent: false,
    database_mutation: false,
    action,
    target,
    payload,
    action_allowed_for_simulation: actionAllowed,
    result: actionAllowed ? 'SIMULATED_ONLY' : 'BLOCKED_UNKNOWN_ACTION',
  };
}

export function executionSafetyCheck(result) {
  return Boolean(
    result.mode === EXECUTION_MODE &&
    result.simulated === true &&
    result.executed === false &&
    result.production === false &&
    result.production_write === false &&
    result.push_sent === false &&
    result.database_mutation === false
  );
}

export function productionExecutionSafetyCheck() {
  return PRODUCTION_EXECUTION_ENABLED === false;
}
