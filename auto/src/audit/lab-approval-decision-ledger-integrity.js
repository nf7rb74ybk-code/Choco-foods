export const LEDGER_INTEGRITY_MODE = 'LAB_APPROVAL_DECISION_LEDGER_INTEGRITY';
export const INTEGRITY_CHECK_ENABLED = true;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

export function validateLedgerIntegrity(ledger) {
  const source = Array.isArray(ledger) ? ledger : [];
  const ids = new Set();
  const invalid = source.filter((entry) => {
    const valid =
      entry?.mode === 'LAB_APPROVAL_DECISION_LEDGER' &&
      typeof entry?.ledger_id === 'string' &&
      typeof entry?.record_id === 'string' &&
      !ids.has(entry.ledger_id) &&
      entry?.approval_granted === false &&
      entry?.export_approved === false &&
      entry?.execution_permitted === false &&
      entry?.production_access_permitted === false &&
      entry?.production_write_permitted === false &&
      entry?.automatic_action === false;
    if (entry?.ledger_id) ids.add(entry.ledger_id);
    return !valid;
  });

  return {
    mode: LEDGER_INTEGRITY_MODE,
    valid: invalid.length === 0,
    entries_checked: source.length,
    invalid_entries: invalid.length,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    automatic_action: false,
  };
}

export function ledgerIntegritySafetyCheck(result) {
  return Boolean(
    result?.mode === LEDGER_INTEGRITY_MODE &&
    result?.valid === true &&
    result?.production_access_permitted === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false &&
    result?.automatic_action === false
  );
}
