import { analyzeSnapshot } from '../engine/analysis.js';
import {
  buildAnomalyRecommendations,
  anomalyRecommendationSafetyCheck,
} from '../ai/anomaly-recommendation.js';

const snapshot = {
  generated_at: '2026-09-04T11:00:00Z',
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
const result = buildAnomalyRecommendations(analysis);

const checks = {
  recommendation_mode: result.mode === 'LAB_RECOMMENDATION_ONLY',
  read_only: result.read_only === true,
  production_blocked: result.production_write_permitted === false,
  push_blocked: result.push_or_onesignal_permitted === false,
  execution_blocked: result.execution_permitted === false,
  recommendations_created: result.summary.recommendation_count === 3,
  critical_prioritized: result.recommendations[0]?.finding_id === 'NO_ONLINE_SHIPPER',
  stuck_detected: result.recommendations.some((x) => x.finding_id === 'ORDER_STUCK_30M'),
  unknown_status_detected: result.recommendations.some((x) => x.finding_id === 'UNKNOWN_ORDER_STATUS'),
  all_non_executable: result.recommendations.every((x) => x.action_permitted === false && x.execution_permitted === false),
  safety_check: anomalyRecommendationSafetyCheck(result),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_24',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
