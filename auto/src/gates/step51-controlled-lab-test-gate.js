export const GATE_MODE = 'CHOCO_AUTO_STEP_51_CONTROLLED_LAB_TEST_GATE';
export const LAB_ONLY = true;
export const PRODUCTION_READ_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const AI_AGENT_PRODUCTION_ACCESS_PERMITTED = false;
export const AUTOMATIC_ACTION = false;

export function evaluateControlledLabGate({ foundationComplete = false, safety = {} } = {}) {
  const safe =
    safety.production_read_permitted === false &&
    safety.production_write_permitted === false &&
    safety.execution_permitted === false &&
    safety.push_or_onesignal_permitted === false &&
    safety.ai_agent_production_access_permitted === false &&
    safety.automatic_action === false;

  return {
    mode: GATE_MODE,
    lab_only: LAB_ONLY,
    foundation_complete: foundationComplete === true,
    gate_open: foundationComplete === true && safe,
    production_read_permitted: PRODUCTION_READ_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    ai_agent_production_access_permitted: AI_AGENT_PRODUCTION_ACCESS_PERMITTED,
    automatic_action: AUTOMATIC_ACTION,
    safe,
  };
}

export function controlledLabGateSafetyCheck(result) {
  return Boolean(
    result?.mode === GATE_MODE &&
    result?.lab_only === true &&
    result?.foundation_complete === true &&
    result?.gate_open === true &&
    result?.production_read_permitted === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false &&
    result?.push_or_onesignal_permitted === false &&
    result?.ai_agent_production_access_permitted === false &&
    result?.automatic_action === false
  );
}
