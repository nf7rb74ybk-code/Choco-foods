export const DECISION_LEDGER_MODE = 'LAB_APPROVAL_DECISION_LEDGER';
export const LEDGER_ENABLED = true;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

export function appendDecision(ledger, approvalRecord) {
  const source = Array.isArray(ledger) ? ledger : [];
  if (!approvalRecord?.record_id) return source;

  return [
    ...source,
    {
      ledger_id: `LAB-DECISION-${Date.now()}`,
      record_id: approvalRecord.record_id,
      manifest_checksum: approvalRecord.manifest_checksum ?? null,
      requested_by: approvalRecord.requested_by ?? null,
      decision: approvalRecord.decision ?? 'UNRESOLVED',
      recorded_at: approvalRecord.recorded_at ?? null,
      approval_granted: false,
      export_approved: false,
      execution_permitted: false,
      production_access_permitted: false,
      production_write_permitted: false,
      automatic_action: false,
      mode: DECISION_LEDGER_MODE,
    },
  ];
}

export function findDecision(ledger, recordId) {
  return (Array.isArray(ledger) ? ledger : []).find(
    (entry) => entry?.record_id === recordId
  ) ?? null;
}

export function decisionLedgerSafetyCheck(ledger) {
  const source = Array.isArray(ledger) ? ledger : [];
  return source.every((entry) =>
    entry?.mode === DECISION_LEDGER_MODE &&
    typeof entry?.ledger_id === 'string' &&
    typeof entry?.record_id === 'string' &&
    entry?.approval_granted === false &&
    entry?.export_approved === false &&
    entry?.execution_permitted === false &&
    entry?.production_access_permitted === false &&
    entry?.production_write_permitted === false &&
    entry?.automatic_action === false
  );
}
