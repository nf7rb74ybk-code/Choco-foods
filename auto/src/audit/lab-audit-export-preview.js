export const PREVIEW_MODE = 'LAB_AUDIT_EXPORT_PREVIEW';
export const EXPORT_ENABLED = false;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

export function validateExportPreview(entries) {
  const source = Array.isArray(entries) ? entries : [];
  const safe = source.every((entry) =>
    entry?.execution_mode === 'SIMULATION_ONLY' &&
    entry?.execution_permitted === false &&
    entry?.production_write_permitted === false &&
    entry?.push_or_onesignal_permitted === false &&
    entry?.automatic_action === false
  );

  return {
    mode: PREVIEW_MODE,
    preview_ready: safe,
    entry_count: source.length,
    export_enabled: EXPORT_ENABLED,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
  };
}

export function previewSafetyCheck(result) {
  return Boolean(
    result?.mode === PREVIEW_MODE &&
    result?.preview_ready === true &&
    result?.export_enabled === false &&
    result?.production_access_permitted === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false
  );
}
