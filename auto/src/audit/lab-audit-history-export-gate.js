export const EXPORT_GATE_MODE = 'LAB_AUDIT_HISTORY_EXPORT_GATE';
export const EXPORT_ENABLED = false;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export function exportAuditHistory(entries, options = {}) {
  const requested = options?.enabled === true;

  if (!requested || EXPORT_ENABLED !== true) {
    return {
      exported: false,
      result: 'EXPORT_DISABLED',
      entries: [],
      mode: EXPORT_GATE_MODE,
      production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
      production_write_permitted: PRODUCTION_WRITE_PERMITTED,
      push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
      execution_permitted: false,
    };
  }

  return {
    exported: false,
    result: 'EXPORT_BLOCKED',
    entries: [],
    mode: EXPORT_GATE_MODE,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    execution_permitted: false,
  };
}

export function exportGateSafetyCheck(result) {
  return Boolean(
    result?.exported === false &&
    Array.isArray(result?.entries) &&
    result.entries.length === 0 &&
    result?.mode === EXPORT_GATE_MODE &&
    result?.production_access_permitted === false &&
    result?.production_write_permitted === false &&
    result?.push_or_onesignal_permitted === false &&
    result?.execution_permitted === false
  );
}
