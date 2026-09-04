export const PROVENANCE_GATE_MODE = 'CHOCO_AUTO_STEP_54_LAB_SNAPSHOT_INTEGRITY_PROVENANCE_GATE';
export const LAB_ONLY = true;
export const PRODUCTION_DATA_ALLOWED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const AUTOMATIC_ACTION = false;

export function validateSnapshotProvenance(snapshot = {}) {
  const validProvenance =
    snapshot?.source === 'LAB_FIXTURE' &&
    snapshot?.lab_only === true &&
    typeof snapshot?.snapshot_id === 'string' &&
    snapshot.snapshot_id.length > 0 &&
    typeof snapshot?.captured_at === 'string' &&
    snapshot.captured_at.length > 0 &&
    typeof snapshot?.checksum === 'string' &&
    snapshot.checksum.length > 0;

  return {
    mode: PROVENANCE_GATE_MODE,
    lab_only: LAB_ONLY,
    valid_provenance: validProvenance,
    production_data_allowed: PRODUCTION_DATA_ALLOWED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    automatic_action: AUTOMATIC_ACTION,
    gate_open: validProvenance && LAB_ONLY && !PRODUCTION_DATA_ALLOWED && !PRODUCTION_WRITE_PERMITTED && !EXECUTION_PERMITTED && !PUSH_OR_ONESIGNAL_PERMITTED && !AUTOMATIC_ACTION,
  };
}

export function snapshotProvenanceSafetyCheck(result) {
  return Boolean(
    result?.mode === PROVENANCE_GATE_MODE &&
    result?.lab_only === true &&
    result?.valid_provenance === true &&
    result?.gate_open === true &&
    result?.production_data_allowed === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false &&
    result?.push_or_onesignal_permitted === false &&
    result?.automatic_action === false
  );
}
