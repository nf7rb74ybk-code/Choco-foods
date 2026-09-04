// CHOCO AUTO LAB — Step 25
// Automatic Daily Operations Summary — LAB / READ-ONLY.
// Builds a report from already-observed snapshot/analysis/recommendations.
// No database writes, RPC, Edge Functions, Push, OneSignal, or execution.

export const REPORT_MODE = 'LAB_DAILY_SUMMARY_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

function assertInput(input) {
  if (!input || typeof input !== 'object') throw new Error('Report input is required');
  if (input.production_write_permitted !== false) {
    throw new Error('Daily report requires production_write_permitted=false');
  }
  return input;
}

export function buildDailyOperationsReport(input) {
  const state = assertInput(input);
  const snapshot = state.snapshot ?? {};
  const analysis = state.analysis ?? {};
  const recommendations = state.recommendations ?? {};
  const orders = snapshot.orders ?? {};
  const shippers = snapshot.shippers ?? {};
  const summary = analysis.summary ?? {};
  const recSummary = recommendations.summary ?? {};
  const findings = Array.isArray(analysis.findings) ? analysis.findings : [];
  const recs = Array.isArray(recommendations.recommendations)
    ? recommendations.recommendations
    : [];

  const critical = findings.filter((x) => x.severity === 'critical').length;
  const warnings = findings.filter((x) => x.severity === 'warning').length;

  return {
    report_id: `DAILY_${(snapshot.generated_at ?? new Date().toISOString()).slice(0, 10)}`,
    generated_at: snapshot.generated_at ?? new Date().toISOString(),
    mode: REPORT_MODE,
    read_only: true,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    operations: {
      orders_total: Number(orders.total ?? 0),
      orders_by_status: orders.by_status ?? {},
      potentially_stuck_orders: Array.isArray(orders.potentially_stuck_over_30m)
        ? orders.potentially_stuck_over_30m.length
        : 0,
      shippers_total: Number(shippers.total ?? 0),
      shippers_online: Number(shippers.online ?? 0),
      shippers_with_gps: Number(shippers.with_gps ?? 0),
    },
    alerts: {
      findings_total: Number(summary.finding_count ?? findings.length),
      critical,
      warnings,
      recommendations_total: Number(recSummary.recommendation_count ?? recs.length),
      top_recommendations: recs.slice(0, 5),
    },
    health: critical > 0 ? 'CRITICAL_REVIEW_REQUIRED' : warnings > 0 ? 'WARNING_REVIEW_REQUIRED' : 'HEALTHY',
    next_step: critical > 0 || warnings > 0 ? 'ADMIN_REVIEW_REQUIRED' : 'NO_ACTION_REQUIRED',
  };
}

export function dailyReportSafetyCheck(report) {
  return Boolean(report && report.mode === REPORT_MODE
    && report.read_only === true
    && report.production_write_permitted === false
    && report.push_or_onesignal_permitted === false
    && report.execution_permitted === false);
}
