import { loadDashboardState } from '../dashboard/read-only-dashboard-adapter.js';

function makeQuery(data) {
  const query = {
    select() { return this; },
    limit() { return this; },
    order() { return this; },
    then(resolve) { return Promise.resolve({ data, error: null }).then(resolve); }
  };
  return query;
}

const calls = [];
const client = {
  from(table) {
    calls.push(table);
    const rows = {
      orders: [
        { id: 1, status: 'Chờ xác nhận', created_at: '2026-09-04T00:00:00Z' },
        { id: 2, status: 'Đã giao', created_at: '2026-09-04T00:01:00Z' }
      ],
      profiles: [
        { id: 's1', role: 'shipper', is_online: true, latitude: 10, longitude: 103 },
        { id: 's2', role: 'shipper', is_online: false, latitude: null, longitude: null }
      ],
      shipper_gps_history: [{ id: 1, shipper_id: 's1', latitude: 10, longitude: 103, recorded_at: '2026-09-04T00:02:00Z' }]
    }[table];
    return makeQuery(rows);
  }
};

const dashboard = await loadDashboardState(client);
const checks = {
  connected_read_only: dashboard.system.status === 'READ_ONLY_CONNECTED',
  orders_count: dashboard.orders.total === 2,
  online_shippers: dashboard.shippers.online === 1,
  gps_shippers: dashboard.shippers.with_gps === 1,
  gps_history_count: dashboard.system.gps_rows === 1,
  production_blocked: dashboard.production_write_permitted === false,
  only_allowed_tables: calls.every((t) => ['orders', 'profiles', 'shipper_gps_history'].includes(t)),
  expected_table_reads: calls.length === 3
};

const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  suite: 'CHOCO_AUTO_STEP_22_READ_ONLY_DASHBOARD',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
