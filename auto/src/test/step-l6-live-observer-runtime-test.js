// CHOCO AUTO LAB — Level 6 runtime integration test
// Mock-only: validates the full read-only observer -> decision pipeline without Production access.

import { runLiveObserver, liveObserverRuntimeSafetyCheck } from '../live/run-live-observer.js';

const calls = [];
const mockRows = {
  orders: [
    { id: 1, code: 'TEST-001', status: 'Chờ xác nhận', created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 2, code: 'TEST-002', status: 'Đang giao', created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { id: 3, code: 'TEST-003', status: 'Đã giao', created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  ],
  profiles: [
    { id: 'shipper-1', role: 'shipper', is_online: true },
    { id: 'customer-1', role: 'customer', is_online: false },
  ],
  // Neutral test coordinates only. Do not embed real operational/geographic coordinates in CI fixtures.
  shipper_gps_history: [
    { id: 1, shipper_id: 'shipper-1', latitude: 0.123456, longitude: 0.654321 },
  ],
};

function queryFor(table) {
  const rows = mockRows[table] || [];
  return {
    select() {
      calls.push({ table, operation: 'SELECT' });
      return Promise.resolve({ data: rows, error: null });
    },
  };
}

const client = { from(table) { return queryFor(table); } };
const result = await runLiveObserver({ client });

if (!liveObserverRuntimeSafetyCheck(result)) throw new Error('Level 6 runtime safety check failed');
if (result.snapshot.orders.total !== 3) throw new Error('Expected 3 observed orders');
if (result.snapshot.shippers.total !== 1) throw new Error('Expected 1 observed shipper');
if (result.snapshot.gps_history_rows_observed !== 1) throw new Error('Expected 1 GPS history row');
if (result.snapshot.orders.potentially_stuck_over_30m.length !== 1) throw new Error('Expected 1 potentially stuck order');
if (result.executed !== false) throw new Error('Runtime execution must remain disabled');
if (result.production_write_permitted !== false) throw new Error('Production writes must remain disabled');
if (result.database_mutation_permitted !== false) throw new Error('Database mutation must remain disabled');
if (result.push_or_onesignal_permitted !== false) throw new Error('Push/OneSignal must remain disabled');
if (calls.length !== 3) throw new Error(`Expected exactly 3 SELECT calls, got ${calls.length}`);
if (calls.some((call) => call.operation !== 'SELECT')) throw new Error('Non-SELECT operation observed');

console.log('CHOCO_AUTO_LEVEL_6_LIVE_OBSERVER_RUNTIME_TEST: PASS');
console.log(JSON.stringify({
  mode: result.mode,
  observed_orders: result.snapshot.orders.total,
  observed_shippers: result.snapshot.shippers.total,
  potentially_stuck: result.snapshot.orders.potentially_stuck_over_30m.length,
  recommended_action: result.decision?.recommended_action ?? null,
  priority_score: result.priority_score,
  executed: result.executed,
  production_write_permitted: result.production_write_permitted,
  database_mutation_permitted: result.database_mutation_permitted,
  push_or_onesignal_permitted: result.push_or_onesignal_permitted,
}));
