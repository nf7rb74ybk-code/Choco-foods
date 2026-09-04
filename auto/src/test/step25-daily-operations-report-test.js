import { analyzeSnapshot } from '../engine/analysis.js';
import { buildAnomalyRecommendations } from '../ai/anomaly-recommendation.js';
import {
  buildDailyOperationsReport,
  dailyReportSafetyCheck,
} from '../report/daily-operations-report.js';

const snapshot = {
  generated_at: '2026-09-04T12:00:00Z',
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

const checks = {
  report_mode: report.mode === 'LAB_DAILY_SUMMARY_ONLY',
  daily_report_id: report.report_id === 'DAILY_2026-09-04',
  orders_summary: report.operations.orders_total === 4,
  stuck_summary: report.operations.potentially_stuck_orders === 1,
  shipper_summary: report.operations.shippers_online === 0,
  critical_health: report.health === 'CRITICAL_REVIEW_REQUIRED',
  recommendations_included: report.alerts.recommendations_total === 3,
  top_recommendation: report.alerts.top_recommendations[0]?.finding_id === 'NO_ONLINE_SHIPPER',
  production_blocked: report.production_write_permitted === false,
  push_blocked: report.push_or_onesignal_permitted === false,
  execution_blocked: report.execution_permitted === false,
  safety_check: dailyReportSafetyCheck(report),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const output = {
  suite: 'CHOCO_AUTO_STEP_25',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(output, null, 2));
if (failed.length) process.exit(1);
