import { buildOperationsDashboard, dashboardSafetyCheck } from '../dashboard/operations-dashboard.js';

const state = {
  production_write_permitted: false,
  system: { status: 'HEALTHY' },
  orders: { total: 3, by_status: { 'Chờ xác nhận': 2, 'Đã giao': 1 } },
  shippers: { total: 2, online: 1, with_gps: 1 },
  findings: [{ id: 'F1', severity: 'warning' }],
  proposals: [{ proposal_id: 'P1', mode: 'REVIEW_ONLY' }],
  approvals: [{ approval_id: 'A1', status: 'PENDING' }],
};

const dashboard = buildOperationsDashboard(state);

const checks = {
  dashboard_mode: dashboard.mode === 'LAB_REVIEW_ONLY',
  findings_visible: dashboard.counts.findings === 1,
  proposals_visible: dashboard.counts.proposals === 1,
  pending_approval_count: dashboard.counts.pending_approvals === 1,
  production_blocked: dashboard.production_write_permitted === false,
  push_blocked: dashboard.push_or_onesignal_permitted === false,
  safety_check: dashboardSafetyCheck(dashboard),
};

const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  suite: 'CHOCO_AUTO_STEP_20',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
