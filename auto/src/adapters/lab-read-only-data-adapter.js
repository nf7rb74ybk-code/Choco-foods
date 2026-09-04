export const ADAPTER_MODE = 'CHOCO_AUTO_LAB_READ_ONLY_DATA_ADAPTER';
export const LAB_ONLY = true;
export const PRODUCTION_READ_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const AUTOMATIC_ACTION = false;

export function createLabReadOnlySnapshot({ source = 'LAB_FIXTURE', records = [] } = {}) {
  const safeRecords = Array.isArray(records) ? records.map((record) => ({ ...record })) : [];

  return Object.freeze({
    mode: ADAPTER_MODE,
    lab_only: LAB_ONLY,
    source,
    records: Object.freeze(safeRecords),
    production_read_permitted: PRODUCTION_READ_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    automatic_action: AUTOMATIC_ACTION,
  });
}

export function readOnlyAdapterSafetyCheck(snapshot) {
  return Boolean(
    snapshot?.mode === ADAPTER_MODE &&
    snapshot?.lab_only === true &&
    Array.isArray(snapshot?.records) &&
    snapshot?.production_read_permitted === false &&
    snapshot?.production_write_permitted === false &&
    snapshot?.execution_permitted === false &&
    snapshot?.push_or_onesignal_permitted === false &&
    snapshot?.automatic_action === false
  );
}
