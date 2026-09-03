import { loadDashboardState, adapterSafetyCheck } from '../dashboard/read-only-dashboard-adapter.js';

function query(rows) {
  return {
    select() { return this; },
    limit() { return this; },
    order() { return this; },
    then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
  };
}

const data = {
  orders: [
    { id: 1, status: 'Chờ xác nhận' },
    { id: 2, status: 'Đã giao' },
    { id: 3, status: 'Chờ xác nhận' },
  ],
  profiles: [
    { id: 's1', role: 'shipper', is_online: true, latitude: 10.2, longitude: 103.9 },
    { id: 's2', role: 'shipper', is_online: false, latitude: null, longitude: null },
    { id: 'a1', role: 'admin', is_online: true, latitude: 10.1, longitude: 103.8 },
  ],
  shipper_gps_history: [
    { id: 1, shipper_id: 's1', latitude: 10.2, longitude: 103.9 },
    { id: 2, shipper_id: 's1', latitude: 10.21, longitude: 103.91 },
  ],
};

const calls = [];
const client = {
  from(table) {
    calls.push(table);
    if (!Object.hasOwn(data, table)) throw new Error(`Unexpected table: ${table}`);
    return query(data[table]);
  },
};

const state = await loadDashboardState(client);
const checks = {
  read_only_mode: state.mode === 'LAB_READ_ONLY',
  read_only_flag: state.read_only === true,
  production_write_blocked: state.production_write_permitted === false,
  push_blocked: state.push_or_onesignal_permitted === false,
  order_total: state.orders.total === 3,
  status_counts: state.orders.by_status['Chờ xác nhận'] === 2 && state.orders.by_status['Đã giao'] === 1,
  shipper_summary: state.shippers.total === 2 && state.shippers.online === 1 && state.shippers.with_gps === 1,
  gps_rows: state.gps_history.rows === 2,
  allowed_sources_only: calls.every((t) => ['orders', 'profiles', 'shipper_gps_history'].includes(t)),
  safety_check: adapterSafetyCheck(state),
  no_actions: state.findings.length === 0 && state.proposals.length === 0 && state.approvals.length === 0,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_22',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
