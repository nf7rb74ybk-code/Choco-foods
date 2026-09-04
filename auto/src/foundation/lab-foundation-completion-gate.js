export const FOUNDATION_MODE = 'CHOCO_AUTO_LAB_FOUNDATION_COMPLETE';
export const FOUNDATION_STEPS = 50;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;
export const AUTOMATIC_ACTION = false;

export function evaluateFoundationCompletion({ completedSteps = [], safety = {} } = {}) {
  const uniqueSteps = [...new Set(completedSteps.filter(Number.isInteger))];
  const missingSteps = Array.from({ length: FOUNDATION_STEPS }, (_, i) => i + 1)
    .filter((step) => !uniqueSteps.includes(step));

  const safe =
    safety.production_access_permitted === false &&
    safety.production_write_permitted === false &&
    safety.execution_permitted === false &&
    safety.automatic_action === false;

  return {
    mode: FOUNDATION_MODE,
    complete: missingSteps.length === 0 && safe,
    completed_steps: uniqueSteps.length,
    required_steps: FOUNDATION_STEPS,
    missing_steps: missingSteps,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    automatic_action: AUTOMATIC_ACTION,
  };
}

export function foundationCompletionSafetyCheck(result) {
  return Boolean(
    result?.mode === FOUNDATION_MODE &&
    result?.complete === true &&
    result?.completed_steps === FOUNDATION_STEPS &&
    Array.isArray(result?.missing_steps) &&
    result.missing_steps.length === 0 &&
    result.production_access_permitted === false &&
    result.production_write_permitted === false &&
    result.execution_permitted === false &&
    result.automatic_action === false
  );
}
