export const CONSISTENCY_MODE = 'LAB_APPROVAL_HISTORY_CONSISTENCY';
export const CONSISTENCY_CHECK_ENABLED = true;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

export function validateApprovalHistoryConsistency({ approvalRecord, ledger, integrity }) {
  const source = Array.isArray(ledger) ? ledger : [];
  const linked = source.filter((entry) => entry?.record_id === approvalRecord?.record_id);
  const consistent = Boolean(
    approvalRecord?.record_id &&
    linked.length === 1 &&
    linked[0]?.manifest_checksum === approvalRecord?.manifest_checksum &&
    linked[0]?.requested_by === approvalRecord?.requested_by &&
    linked[0]?.decision === approvalRecord?.decision &&
    integrity?.valid === true &&
    approvalRecord?.approval_granted === false &&
    approvalRecord?.export_approved === false &&
    approvalRecord?.execution_permitted === false &&
    approvalRecord?.production_access_permitted === false &&
    approvalRecord?.production_write_permitted === false &&
    approvalRecord?.automatic_action === false
  );

  return {
    mode: CONSISTENCY_MODE,
    consistent,
    linked_records: linked.length,
    record_id: approvalRecord?.record_id ?? null,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    automatic_action: false,
  };
}

export function approvalHistoryConsistencySafetyCheck(result) {
  return Boolean(
    result?.mode === CONSISTENCY_MODE &&
    result?.consistent === true &&
    result?.linked_records === 1 &&
    result?.production_access_permitted === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false &&
    result?.automatic_action === false
  );
}
