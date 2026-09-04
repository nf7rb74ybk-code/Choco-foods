export const SNAPSHOT_GATE_MODE = 'CHOCO_AUTO_STEP_53_LAB_SNAPSHOT_VALIDATION_GATE';
export const LAB_ONLY = true;
export const PRODUCTION_DATA_ALLOWED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const AUTOMATIC_ACTION = false;

export function validateLabSnapshot(snapshot = {}) {
  const validShape =
    snapshot?.source === 'LAB_FIXTURE' &&
    Array.isArray(snapshot?.orders) &&
    Array.isArray(snapshot?.profiles) &&
    Array.isArray(snapshot?.shipper_gps_history);

  return {
    mode: SNAPSHOT_GATE_MODE,
    lab_only: LAB_ONLY,
    valid_shape: validShape,
    production_data_allowed: PRODUCTION_DATA_ALLOWED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    automatic_action: AUTOMATIC_ACTION,
    gate_open: validShape && LAB_ONLY && !PRODUCTION_DATA_ALLOWED && !PRODUCTION_WRITE_PERMITTED && !EXECUTION_PERMITTED && !PUSH_OR_ONESIGNAL_PERMITTED && !AUTOMATIC_ACTION,
  };
}

export function snapshotGateSafetyCheck(result) {
  return Boolean(
    result?.mode === SNAPSHOT_GATE_MODE &&
    result?.lab_only === true &&
    result?.valid_shape === true &&
    result?.gate_open === true &&
    result?.production_data_allowed === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false &&
    result?.push_or_onesignal_permitted === false &&
    result?.automatic_action === false
  );
}
