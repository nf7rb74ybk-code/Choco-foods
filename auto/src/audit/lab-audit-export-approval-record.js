export const APPROVAL_RECORD_MODE = 'LAB_AUDIT_EXPORT_APPROVAL_RECORD';
export const RECORDING_ENABLED = true;
export const EXPORT_ENABLED = false;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

export function createApprovalRecord(request, resolution) {
  return {
    record_id: `LAB-APPROVAL-RECORD-${Date.now()}`,
    mode: APPROVAL_RECORD_MODE,
    manifest_checksum: request?.manifest_checksum ?? null,
    requested_by: request?.requested_by ?? null,
    approval_required: request?.approval_required === true,
    decision: resolution?.result ?? 'UNRESOLVED',
    approval_granted: false,
    export_approved: false,
    export_enabled: EXPORT_ENABLED,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    automatic_action: false,
    recorded_at: new Date().toISOString(),
  };
}

export function approvalRecordSafetyCheck(record) {
  return Boolean(
    record?.mode === APPROVAL_RECORD_MODE &&
    record?.approval_required === true &&
    record?.approval_granted === false &&
    record?.export_approved === false &&
    record?.export_enabled === false &&
    record?.production_access_permitted === false &&
    record?.production_write_permitted === false &&
    record?.execution_permitted === false &&
    record?.automatic_action === false &&
    typeof record?.record_id === 'string' &&
    record.record_id.length > 0 &&
    typeof record?.recorded_at === 'string' &&
    record.recorded_at.length > 0
  );
}
