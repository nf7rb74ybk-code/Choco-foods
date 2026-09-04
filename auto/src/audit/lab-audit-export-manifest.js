import { createHash } from 'node:crypto';

export const MANIFEST_MODE = 'LAB_AUDIT_EXPORT_MANIFEST';
export const EXPORT_ENABLED = false;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

export function createExportManifest(entries = []) {
  const source = Array.isArray(entries) ? entries : [];
  const safeEntries = source.filter((entry) =>
    entry?.execution_mode === 'SIMULATION_ONLY' &&
    entry?.execution_permitted === false &&
    entry?.production_write_permitted === false &&
    entry?.push_or_onesignal_permitted === false &&
    entry?.automatic_action === false
  );

  const payload = JSON.stringify(safeEntries);
  const checksum = createHash('sha256').update(payload).digest('hex');

  return {
    mode: MANIFEST_MODE,
    entry_count: safeEntries.length,
    checksum_algorithm: 'SHA-256',
    checksum,
    export_enabled: EXPORT_ENABLED,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
  };
}

export function manifestSafetyCheck(manifest) {
  return Boolean(
    manifest?.mode === MANIFEST_MODE &&
    manifest?.checksum_algorithm === 'SHA-256' &&
    typeof manifest?.checksum === 'string' &&
    manifest.checksum.length === 64 &&
    manifest?.export_enabled === false &&
    manifest?.production_access_permitted === false &&
    manifest?.production_write_permitted === false &&
    manifest?.execution_permitted === false
  );
}
