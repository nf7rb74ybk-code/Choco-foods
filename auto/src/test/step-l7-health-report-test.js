import assert from 'node:assert/strict';
import { runHealthCheck, healthCheckSafetyCheck } from '../agent/health-check.js';
import { buildDailyOperationsReport, dailyReportSafetyCheck } from '../agent/daily-report.js';

const snapshot = { read_only: true, orders_total: 4, stuck_orders_count: 1 };
const observation = {
  orders: { total: 4, stuck: 1, status_counts: { 'Chờ xác nhận': 2, 'Đã giao': 2 } },
  shippers: { total: 2, online: 1, offline: 1 },
};
const controllerResult = {
  production_execution_enabled: false,
  production_write_permitted: false,
  database_mutation_permitted: false,
  push_or_onesignal_permitted: false,
};

const health = runHealthCheck({ snapshot, observation, controllerResult });
assert.equal(health.healthy, true);
assert.equal(health.failed.length, 0);
assert.equal(healthCheckSafetyCheck(health), true);

const report = buildDailyOperationsReport({
  snapshot,
  observation,
  changes: { orders_total: 1 },
  events: [{ type: 'ORDER_STUCK' }],
  processed: [{ status: 'WAITING_FOR_TARGET' }],
  auditCount: 2,
});
assert.equal(report.orders.total, 4);
assert.equal(report.orders.stuck, 1);
assert.equal(report.automation.events_detected, 1);
assert.equal(report.automation.tasks_processed, 1);
assert.equal(report.automation.simulated_only, true);
assert.equal(dailyReportSafetyCheck(report), true);

console.log('CHOCO_AUTO_LEVEL_7_HEALTH_REPORT_TEST: PASS');
