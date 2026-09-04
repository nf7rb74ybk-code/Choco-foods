// CHOCO AUTO LAB — Step 27
// Alert Center — LAB / READ-ONLY.
// Aggregates existing findings, recommendations, report and health state only.
// No database writes, RPC, Edge Functions, Push, OneSignal, or production execution.

export const ALERT_MODE = 'LAB_ALERT_CENTER_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

const LEVEL_ORDER = { critical: 0, warning: 1, info: 2 };

function normalizeLevel(value) {
  return Object.prototype.hasOwnProperty.call(LEVEL_ORDER, value) ? value : 'info';
}

function assertInput(input) {
  if (!input || typeof input !== 'object') throw new Error('Alert Center input is required');
  if (input.production_write_permitted !== false) {
    throw new Error('Alert Center requires production_write_permitted=false');
  }
  return input;
}

export function buildAlertCenter(input) {
  const state = assertInput(input);
  const snapshot = state.snapshot ?? {};
  const analysis = state.analysis ?? {};
  const recommendations = state.recommendations ?? {};
  const report = state.report ?? {};
  const health = state.health ?? {};
  const findings = Array.isArray(analysis.findings) ? analysis.findings : [];
  const recs = Array.isArray(recommendations.recommendations) ? recommendations.recommendations : [];
  const generatedAt = report.generated_at ?? snapshot.generated_at ?? new Date().toISOString();

  const alerts = findings.map((finding) => {
    const level = normalizeLevel(finding.severity);
    const recommendation = recs.find((item) => item.finding_id === finding.id);
    return {
      alert_id: `ALERT_${finding.id}`,
      level,
      finding_id: finding.id,
      type: finding.type ?? 'ANOMALY',
      message: finding.message ?? 'Review required',
      evidence: finding.evidence ?? null,
      recommendation_id: recommendation?.recommendation_id ?? null,
      order_id: finding.evidence?.order_id ?? finding.evidence?.id ?? null,
      shipper_id: finding.evidence?.shipper_id ?? null,
      status: 'REVIEW_REQUIRED',
      action_permitted: false,
      execution_permitted: false,
      generated_at: generatedAt,
    };
  });

  if (health.status && health.status !== 'HEALTHY') {
    alerts.push({
      alert_id: 'ALERT_SYSTEM_HEALTH',
      level: health.status === 'DEGRADED_REVIEW_REQUIRED' ? 'critical' : 'warning',
      finding_id: 'SYSTEM_HEALTH',
      type: 'SYSTEM_HEALTH',
      message: `System health: ${health.status}`,
      evidence: { failed_count: Number(health.failed_count ?? 0) },
      recommendation_id: null,
      order_id: null,
      shipper_id: null,
      status: 'REVIEW_REQUIRED',
      action_permitted: false,
      execution_permitted: false,
      generated_at: generatedAt,
    });
  }

  alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.alert_id.localeCompare(b.alert_id));

  const counts = {
    total: alerts.length,
    critical: alerts.filter((x) => x.level === 'critical').length,
    warning: alerts.filter((x) => x.level === 'warning').length,
    info: alerts.filter((x) => x.level === 'info').length,
    review_required: alerts.filter((x) => x.status === 'REVIEW_REQUIRED').length,
    linked_orders: new Set(alerts.filter((x) => x.order_id != null).map((x) => String(x.order_id))).size,
    linked_shippers: new Set(alerts.filter((x) => x.shipper_id != null).map((x) => String(x.shipper_id))).size,
  };

  return Object.freeze({
    mode: ALERT_MODE,
    generated_at: generatedAt,
    read_only: true,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    alerts,
    counts,
    daily_report_id: report.report_id ?? null,
    health_status: health.status ?? 'UNKNOWN',
    automatic_actions: 0,
  });
}

export function alertCenterSafetyCheck(center) {
  return Boolean(center && center.mode === ALERT_MODE
    && center.read_only === true
    && center.production_write_permitted === false
    && center.push_or_onesignal_permitted === false
    && center.execution_permitted === false
    && center.automatic_actions === 0
    && Array.isArray(center.alerts)
    && center.alerts.every((x) => x.action_permitted === false && x.execution_permitted === false));
}
