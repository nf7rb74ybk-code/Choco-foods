// CHOCO AUTO LAB — Step 26
// System Health Check & Self-Diagnostics — LAB / READ-ONLY.
// Validates the in-memory pipeline only. No database writes, RPC, Edge Functions,
// Push, OneSignal, or production execution.

export const HEALTH_MODE = 'LAB_SELF_DIAGNOSTICS_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

function safeBoolean(value) {
  return value === true;
}

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

export function runSystemHealthCheck({ snapshot, analysis, recommendations, report } = {}) {
  const checks = [];

  checks.push(check(
    'snapshot_shape',
    !!snapshot && typeof snapshot === 'object'
      && snapshot.read_only === true
      && snapshot.production_write_permitted === false
      && !!snapshot.orders && !!snapshot.shippers,
    'Snapshot must be read-only and contain orders/shippers summaries.',
  ));

  checks.push(check(
    'analysis_shape',
    !!analysis && typeof analysis === 'object'
      && analysis.read_only === true
      && analysis.production_write_permitted === false
      && Array.isArray(analysis.findings)
      && Array.isArray(analysis.proposals),
    'Analysis must remain review-only with findings and proposals arrays.',
  ));

  checks.push(check(
    'recommendation_safety',
    !!recommendations && typeof recommendations === 'object'
      && recommendations.read_only === true
      && recommendations.production_write_permitted === false
      && recommendations.push_or_onesignal_permitted === false
      && recommendations.execution_permitted === false
      && Array.isArray(recommendations.recommendations)
      && recommendations.recommendations.every((x) => x.action_permitted === false && x.execution_permitted === false),
    'Recommendations must never grant an executable action.',
  ));

  checks.push(check(
    'report_safety',
    !!report && typeof report === 'object'
      && report.read_only === true
      && report.production_write_permitted === false
      && report.push_or_onesignal_permitted === false
      && report.execution_permitted === false,
    'Daily report must remain read-only and non-executable.',
  ));

  checks.push(check(
    'pipeline_consistency',
    !!snapshot && !!analysis && !!recommendations && !!report
      && report.generated_at === snapshot.generated_at
      && report.alerts?.findings_total === analysis.summary?.finding_count
      && report.alerts?.recommendations_total === recommendations.summary?.recommendation_count,
    'Snapshot, analysis, recommendations, and report metadata must agree.',
  ));

  checks.push(check(
    'global_execution_block',
    safeBoolean(PRODUCTION_WRITE_PERMITTED) === false
      && safeBoolean(PUSH_OR_ONESIGNAL_PERMITTED) === false
      && safeBoolean(EXECUTION_PERMITTED) === false,
    'Global Step 26 execution flags are permanently blocked in LAB.',
  ));

  const failed = checks.filter((item) => !item.passed);
  return Object.freeze({
    mode: HEALTH_MODE,
    generated_at: report?.generated_at ?? snapshot?.generated_at ?? new Date().toISOString(),
    status: failed.length === 0 ? 'HEALTHY' : 'DEGRADED_REVIEW_REQUIRED',
    read_only: true,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    checks,
    passed_count: checks.length - failed.length,
    failed_count: failed.length,
    automatic_actions: 0,
  });
}

export function systemHealthSafetyCheck(result) {
  return !!result
    && result.mode === HEALTH_MODE
    && result.read_only === true
    && result.production_write_permitted === false
    && result.push_or_onesignal_permitted === false
    && result.execution_permitted === false
    && result.automatic_actions === 0
    && Array.isArray(result.checks);
}
