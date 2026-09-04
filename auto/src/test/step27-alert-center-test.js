import { analyzeSnapshot } from '../engine/analysis.js';
import { buildAnomalyRecommendations } from '../ai/anomaly-recommendation.js';
import { buildDailyOperationsReport } from '../report/daily-operations-report.js';
import { runSystemHealthCheck } from '../health/system-health.js';
import { buildAlertCenter, alertCenterSafetyCheck } from '../alerts/alert-center.js';

const snapshot = {
  generated_at: '2026-09-04T14:00:00Z',
  read_only: true,
  production_write_permitted: false,
  orders: {
    total: 4,
    by_status: { 'Chờ xác nhận': 3, UNKNOWN: 1 },
    potentially_stuck_over_30m: [{ id: 101, code: 'LAB-001', age_minutes: 47, shipper_id: null }],
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
const center = buildAlertCenter({
  snapshot,
  analysis,
  recommendations,
  report,
  health,
  production_write_permitted: false,
});

const checks = {
  alert_mode: center.mode === 'LAB_ALERT_CENTER_ONLY',
  alerts_created: center.counts.total === 3,
  critical_first: center.alerts[0]?.level === 'critical' && center.alerts[0]?.finding_id === 'NO_ONLINE_SHIPPER',
  warning_present: center.counts.warning >= 1,
  review_required: center.counts.review_required === center.counts.total,
  report_linked: center.daily_report_id === 'DAILY_2026-09-04',
  recommendation_linked: center.alerts.every((x) => x.recommendation_id !== null),
  production_blocked: center.production_write_permitted === false,
  push_blocked: center.push_or_onesignal_permitted === false,
  execution_blocked: center.execution_permitted === false,
  no_automatic_actions: center.automatic_actions === 0,
  all_non_executable: center.alerts.every((x) => x.action_permitted === false && x.execution_permitted === false),
  safety_check: alertCenterSafetyCheck(center),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const output = {
  suite: 'CHOCO_AUTO_STEP_27',
  passed: failed.length === 0,
  checks,
  center,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(output, null, 2));
if (failed.length) process.exit(1);
