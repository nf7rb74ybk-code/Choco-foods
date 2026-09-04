import { analyzeSnapshot } from '../engine/analysis.js';
import { buildAnomalyRecommendations } from '../ai/anomaly-recommendation.js';
import { buildDailyOperationsReport } from '../report/daily-operations-report.js';
import { runSystemHealthCheck, systemHealthSafetyCheck } from '../health/system-health.js';

const snapshot = {
  generated_at: '2026-09-04T13:00:00Z',
  read_only: true,
  production_write_permitted: false,
  orders: {
    total: 4,
    by_status: { 'Chờ xác nhận': 3, UNKNOWN: 1 },
    potentially_stuck_over_30m: [{ id: 1, code: 'LAB-001', age_minutes: 47 }],
  },
  shippers: { total: 2, online: 0, with_gps: 0 },
};

const analysis = analyzeSnapshot(snapshot);
const recommendations = buildAnomalyRecommendations(analysis);
const report = buildDailyOperationsReport({
  snapshot,
  analysis,
  recommendations,
  production_write_permitted: false,
});
const health = runSystemHealthCheck({ snapshot, analysis, recommendations, report });

const checks = {
  health_mode: health.mode === 'LAB_SELF_DIAGNOSTICS_ONLY',
  healthy_pipeline: health.status === 'HEALTHY',
  all_checks_passed: health.failed_count === 0 && health.passed_count === health.checks.length,
  snapshot_validated: health.checks.find((x) => x.name === 'snapshot_shape')?.passed === true,
  analysis_validated: health.checks.find((x) => x.name === 'analysis_shape')?.passed === true,
  recommendation_safety_validated: health.checks.find((x) => x.name === 'recommendation_safety')?.passed === true,
  report_safety_validated: health.checks.find((x) => x.name === 'report_safety')?.passed === true,
  pipeline_consistent: health.checks.find((x) => x.name === 'pipeline_consistency')?.passed === true,
  production_blocked: health.production_write_permitted === false,
  push_blocked: health.push_or_onesignal_permitted === false,
  execution_blocked: health.execution_permitted === false,
  no_automatic_actions: health.automatic_actions === 0,
  safety_check: systemHealthSafetyCheck(health),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const output = {
  suite: 'CHOCO_AUTO_STEP_26',
  passed: failed.length === 0,
  checks,
  health,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(output, null, 2));
if (failed.length) process.exit(1);
