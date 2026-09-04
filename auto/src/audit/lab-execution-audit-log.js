export const AUDIT_SCOPE = 'CHOCO_AUTO_LAB';
export const AUDIT_MODE = 'LAB_EXECUTION_AUDIT_LOG';
export const PRODUCTION_AUDIT_WRITE_PERMITTED = false;

const auditEntries = [];

export function recordExecutionResult(result, metadata = {}) {
  const entry = {
    audit_id: `LAB-AUDIT-${Date.now()}-${auditEntries.length + 1}`,
    scope: AUDIT_SCOPE,
    mode: AUDIT_MODE,
    timestamp: new Date().toISOString(),
    result: result?.result ?? 'UNKNOWN',
    queue_id: result?.queue_id ?? null,
    processed: result?.processed === true,
    execution_permitted: result?.execution_permitted === true,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    automatic_action: false,
    execution_mode: 'SIMULATION_ONLY',
    metadata: { ...metadata },
  };

  auditEntries.push(Object.freeze(entry));
  return entry;
}

export function getAuditLog() {
  return auditEntries.map((entry) => ({ ...entry, metadata: { ...entry.metadata } }));
}

export function auditSafetyCheck(entry) {
  return Boolean(
    entry?.scope === AUDIT_SCOPE &&
    entry?.mode === AUDIT_MODE &&
    entry?.execution_permitted === false &&
    entry?.production_write_permitted === false &&
    entry?.push_or_onesignal_permitted === false &&
    entry?.automatic_action === false &&
    entry?.execution_mode === 'SIMULATION_ONLY'
  );
}
