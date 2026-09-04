import { traceAuditHistory, auditHistorySafetyCheck } from './lab-audit-history.js';

export const VIEWER_MODE = 'LAB_AUDIT_HISTORY_VIEWER';
export const EXPORT_ENABLED = false;
export const PRODUCTION_ACCESS_PERMITTED = false;

export function getAuditHistory(entries, filters = {}) {
  let result = [...entries];
  if (filters.queueId) result = traceAuditHistory(result, filters.queueId);
  if (filters.action) result = result.filter((entry) => entry?.proposal_action === filters.action);
  if (filters.result) result = result.filter((entry) => entry?.processing_result === filters.result);
  return result;
}

export function summarizeAuditHistory(entries) {
  return {
    mode: VIEWER_MODE,
    total: entries.length,
    safe_entries: entries.filter(auditHistorySafetyCheck).length,
    execution_enabled: false,
    production_access_permitted: PRODUCTION_ACCESS_PERMITTED,
    export_enabled: EXPORT_ENABLED,
  };
}

export function viewerSafetyCheck(summary) {
  return Boolean(
    summary?.mode === VIEWER_MODE &&
    summary?.execution_enabled === false &&
    summary?.production_access_permitted === false &&
    summary?.export_enabled === false &&
    summary?.safe_entries === summary?.total
  );
}
