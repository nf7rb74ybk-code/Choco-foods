import { loadLiveSnapshot, liveSnapshotSafetyCheck } from '../live/live-snapshot.js';

function query(rows) {
  const q = {
    select() { return q; },
    eq() { return q; },
    order() { return q; },
    limit() { return q; },
    then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
  };
  return q;
}

const data = {
  orders: [
    { id: 1, code: 'LAB-001', status: 'Chờ xác nhận', created_at: '2026-09-04T10:00:00Z' },
    { id: 2, code: 'LAB-002', status: 'Đã giao', created_at: '2026-09-04T10:20:00Z' },
  ],
  profiles: [
    { id: 's1', role: 'shipper', is_online: true, latitude: 10.2, longitude: 103.9 },
    { id: 's2', role: 'shipper', is_online: false, latitude: null, longitude: null },
  ],
  shipper_gps_history: [
    { id: 1, shipper_id: 's1', latitude: 10.2, longitude: 103.9, recorded_at: '2026-09-04T10:30:00Z' },
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

const snapshot = await loadLiveSnapshot(client);
const checks = {
  live_read_only_mode: snapshot.mode === 'LIVE_READ_ONLY',
  read_only_flag: snapshot.read_only === true,
  production_write_blocked: snapshot.production_write_permitted === false,
  push_blocked: snapshot.push_or_onesignal_permitted === false,
  orders_observed: snapshot.orders.total === 2,
  status_count: snapshot.orders.by_status['Chờ xác nhận'] === 1 && snapshot.orders.by_status['Đã giao'] === 1,
  shippers_observed: snapshot.shippers.total === 2 && snapshot.shippers.online === 1,
  gps_observed: snapshot.gps_history_rows_observed === 1,
  stuck_detection_present: Array.isArray(snapshot.orders.potentially_stuck_over_30m),
  allowed_sources_only: calls.length === 3 && calls.every((t) => ['orders', 'profiles', 'shipper_gps_history'].includes(t)),
  safety_check: liveSnapshotSafetyCheck(snapshot),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_23',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
