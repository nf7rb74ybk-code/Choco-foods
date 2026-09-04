export const APPROVAL_GATE_MODE = 'LAB_AUDIT_EXPORT_APPROVAL_GATE';
export const EXPORT_APPROVAL_ENABLED = false;
export const PRODUCTION_ACCESS_PERMITTED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

export function createExportApprovalRequest(manifest, requestedBy = 'LAB_ADMIN') {
  return {
    mode: APPROVAL_GATE_MODE,
    requested_by: requestedBy,
    manifest_checksum: manifest?.checksum ?? null,
    approval_required: true,
    approval_granted: false,
    export_approved: false,
    export_enabled: EXPORT_APPROVAL_ENABLED,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    automatic_action: false,
    requested_at: new Date().toISOString(),
  };
}

export function resolveExportApproval(request, decision = 'deny') {
  if (decision !== 'approve') {
    return {
      ...request,
      approval_granted: false,
      export_approved: false,
      export_enabled: false,
      execution_permitted: false,
      automatic_action: false,
      result: 'EXPORT_APPROVAL_DENIED',
    };
  }

  return {
    ...request,
    approval_granted: false,
    export_approved: false,
    export_enabled: false,
    execution_permitted: false,
    automatic_action: false,
    result: 'APPROVAL_RECORDED_BUT_EXPORT_DISABLED',
  };
}

export function approvalGateSafetyCheck(result) {
  return Boolean(
    result?.mode === APPROVAL_GATE_MODE &&
    result?.approval_required === true &&
    result?.approval_granted === false &&
    result?.export_approved === false &&
    result?.export_enabled === false &&
    result?.production_access_permitted === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false &&
    result?.automatic_action === false
  );
}
