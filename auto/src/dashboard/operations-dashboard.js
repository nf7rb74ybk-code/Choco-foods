export const DASHBOARD_MODE = 'LAB_REVIEW_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

function assertState(state) {
  if (!state || typeof state !== 'object') throw new Error('Dashboard state is required');
  if (state.production_write_permitted !== false) throw new Error('Dashboard requires production_write_permitted=false');
  return state;
}

export function buildOperationsDashboard(state) {
  assertState(state);
  const findings = Array.isArray(state.findings) ? state.findings : [];
  const proposals = Array.isArray(state.proposals) ? state.proposals : [];
  const approvals = Array.isArray(state.approvals) ? state.approvals : [];

  return {
    mode: DASHBOARD_MODE,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    system: state.system ?? { status: 'UNKNOWN' },
    orders: state.orders ?? { total: 0, by_status: {} },
    shippers: state.shippers ?? { total: 0, online: 0, with_gps: 0 },
    findings,
    proposals,
    approvals,
    counts: {
      findings: findings.length,
      proposals: proposals.length,
      pending_approvals: approvals.filter((a) => a.status === 'PENDING').length,
      approved_reviews: approvals.filter((a) => a.status === 'APPROVED').length,
      rejected_reviews: approvals.filter((a) => a.status === 'REJECTED').length,
    },
  };
}

export function dashboardSafetyCheck(dashboard) {
  if (!dashboard || typeof dashboard !== 'object') return false;
  return dashboard.mode === DASHBOARD_MODE
    && dashboard.production_write_permitted === false
    && dashboard.push_or_onesignal_permitted === false;
}
