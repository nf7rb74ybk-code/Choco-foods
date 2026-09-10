// CHOCO AUTO LAB — Level 6 observer loop test
// Mock-only: verifies repeated observation is possible without any mutation.

import { startLiveObserverLoop, liveObserverLoopSafetyCheck } from '../live/live-observer-loop.js';

const calls = [];
let cycle = 0;
const rows = {
  orders: [
    { id: 1, code: 'TEST-LOOP-001', status: 'Chờ xác nhận', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    { id: 2, code: 'TEST-LOOP-002', status: 'Đang giao', created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
  ],
  profiles: [{ id: 'test-shipper', role: 'shipper', is_online: true }],
  shipper_gps_history: [{ id: 1, shipper_id: 'test-shipper', latitude: 0.123456, longitude: 0.654321 }],
};

const client = {
  from(table) {
    return {
      select() {
        calls.push({ table, operation: 'SELECT' });
        return Promise.resolve({ data: rows[table] || [], error: null });
      },
    };
  },
};

const results = [];
const errors = [];
const loop = startLiveObserverLoop({
  client,
  intervalMs: 1_000,
  onResult(result) {
    cycle += 1;
    results.push(result);
    if (cycle >= 2) loop.stop();
  },
  onError(error) {
    errors.push(error);
    loop.stop();
  },
});

if (!liveObserverLoopSafetyCheck(loop)) throw new Error('Observer loop safety check failed');

const deadline = Date.now() + 4_000;
while (!loop.isStopped() && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 50));
}
loop.stop();

if (errors.length) throw errors[0];
if (results.length < 2) throw new Error(`Expected at least 2 observer cycles, got ${results.length}`);
if (calls.length !== results.length * 3) throw new Error(`Expected exactly 3 SELECT calls per cycle, got ${calls.length}`);
if (calls.some((call) => call.operation !== 'SELECT')) throw new Error('Non-SELECT operation observed');
if (results.some((result) => result.executed !== false)) throw new Error('Observer loop must never execute actions');
if (results.some((result) => result.production_write_permitted !== false)) throw new Error('Production writes must remain disabled');
if (results.some((result) => result.database_mutation_permitted !== false)) throw new Error('Database mutation must remain disabled');
if (results.some((result) => result.push_or_onesignal_permitted !== false)) throw new Error('Push/OneSignal must remain disabled');

console.log('CHOCO_AUTO_LEVEL_6_LIVE_OBSERVER_LOOP_TEST: PASS');
console.log(JSON.stringify({
  cycles: results.length,
  select_calls: calls.length,
  last_mode: results.at(-1)?.mode ?? null,
  recommended_action: results.at(-1)?.decision?.recommended_action ?? null,
  executed: results.at(-1)?.executed ?? null,
}));
