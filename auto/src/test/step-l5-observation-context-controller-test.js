// CHOCO AUTO LEVEL 5 — Step 6 test
// Verifies snapshot normalization and read-only safety.

import { buildObservationContext, observationContextSafetyCheck } from '../agent/observation-context-controller.js';

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const snapshot = {
  mode: 'LIVE_READ_ONLY',
  observed_at: '2026-09-10T08:30:00Z',
  orders: {
    total: 4,
    by_status: { 'Chờ xác nhận': 1, 'Đang giao': 2, 'Đã giao': 1 },
    potentially_stuck_over_30m: [{ id: 101 }],
  },
  shippers: { total: 3, online: 2 },
  gps_history_rows_observed: 5,
};

const context = buildObservationContext(snapshot);

assert(context.mode === 'LAB_OBSERVATION_CONTEXT_ONLY', 'context stays in LAB mode');
assert(context.read_only === true, 'context is read-only');
assert(context.orders.total === 4, 'order total is observed');
assert(context.orders.by_status['Đang giao'] === 2, 'status counts are preserved');
assert(context.orders.potentially_stuck_over_30m === 1, 'stuck-order signal is preserved');
assert(context.shippers.total === 3, 'shipper total is observed');
assert(context.shippers.online === 2, 'online shipper count is observed');
assert(context.shippers.offline === 1, 'offline shipper count is derived');
assert(context.signals.has_potentially_stuck_orders === true, 'stuck signal is exposed');
assert(context.production_write_permitted === false, 'production write is blocked');
assert(context.database_mutation_permitted === false, 'database mutation is blocked');
assert(context.push_or_onesignal_permitted === false, 'Push/OneSignal is blocked');
assert(observationContextSafetyCheck(context) === true, 'context passes safety check');

console.log('PASS: CHOCO AUTO LEVEL 5 STEP 6 — OBSERVATION CONTEXT');
console.log('READ_ONLY=true');
console.log('DATABASE_MUTATION=false');
console.log('PUSH_SENT=false');
console.log('PRODUCTION_EXECUTION=false');
