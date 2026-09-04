export const AUDIT_HISTORY_MODE = 'LAB_AUDIT_HISTORY';
export const PRODUCTION_READ_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;

export function createAuditHistoryEntry({ queueId, proposal, processingResult }) {
  return {
    audit_id: `LAB-AUDIT-${Date.now()}`,
    queue_id: queueId,
    proposal_action: proposal?.action ?? null,
    proposal_target: proposal?.target ?? null,
    processing_result: processingResult?.result ?? null,
    processed: processingResult?.processed === true,
    execution_permitted: false,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    automatic_action: false,
    execution_mode: 'SIMULATION_ONLY',
    audit_mode: AUDIT_HISTORY_MODE,
    production_read_permitted: false,
    recorded_at: new Date().toISOString(),
  };
}

export function traceAuditHistory(entries, queueId) {
  return entries.filter((entry) => entry?.queue_id === queueId);
}

export function auditHistorySafetyCheck(entry) {
  return Boolean(
    entry?.audit_mode === AUDIT_HISTORY_MODE &&
    entry?.execution_mode === 'SIMULATION_ONLY' &&
    entry?.execution_permitted === false &&
    entry?.production_write_permitted === false &&
    entry?.push_or_onesignal_permitted === false &&
    entry?.automatic_action === false
  );
}
