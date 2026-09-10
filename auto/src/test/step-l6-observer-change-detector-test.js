import { detectObserverChanges, observerChangeDetectorSafetyCheck } from '../live/observer-change-detector.js';

const previous = {
  mode: 'LIVE_READ_ONLY',
  read_only: true,
  orders: {
    total: 2,
    by_status: { 'Chờ xác nhận': 2, 'Đã giao': 0 },
    potentially_stuck_over_30m: [],
  },
  shippers: { total: 1, online: 1 },
  gps_history_rows_observed: 1,
};

const current = {
  mode: 'LIVE_READ_ONLY',
  read_only: true,
  orders: {
    total: 3,
    by_status: { 'Chờ xác nhận': 1, 'Đã giao': 2 },
    potentially_stuck_over_30m: [{ id: 3, code: 'TEST-3', status: 'Chờ xác nhận' }],
  },
  shippers: { total: 1, online: 0 },
  gps_history_rows_observed: 2,
};

const baseline = detectObserverChanges(null, previous);
if (!baseline.baseline || baseline.changed || baseline.changes.length !== 0) {
  throw new Error('Baseline observer change detection failed');
}

const result = detectObserverChanges(previous, current);
if (!result.changed) throw new Error('Observer changes were not detected');
if (result.changes.length < 4) throw new Error('Expected multiple operational changes');
if (!result.changes.some((change) => change.type === 'STUCK_ORDERS')) throw new Error('Stuck-order change was not detected');
if (!result.changes.some((change) => change.type === 'ONLINE_SHIPPERS')) throw new Error('Shipper-online change was not detected');
if (!observerChangeDetectorSafetyCheck(result)) throw new Error('Observer change detector safety check failed');

console.log('CHOCO_AUTO_LEVEL_6_2_OBSERVER_CHANGE_DETECTOR_TEST: PASS');
