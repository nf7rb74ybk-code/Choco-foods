// CHOCO AUTO LAB — Step 23 SELECT-only operational observer
// Reads operational data only. No INSERT/UPDATE/DELETE/RPC mutations.

export const OBSERVER_MODE = 'LIVE_READ_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const STATUS_KEYS = Object.freeze([
  'Chờ xác nhận',
  'Đã nhận',
  'Đang lấy hàng',
  'Đang giao',
  'Đã giao',
  'Hoàn thành',
  'Đã huỷ',
]);

const TERMINAL_STATUSES = new Set(['Đã giao', 'Hoàn thành', 'Đã huỷ']);

function assertClient(client) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('CHOCO AUTO OBSERVER: a Supabase client is required');
  }
}

async function selectRows(client, table) {
  // Deliberately use SELECT-only query construction.
  const response = await client.from(table).select('*');
  if (response?.error) throw new Error(`CHOCO AUTO OBSERVER: ${table} read failed: ${response.error.message || response.error}`);
  return Array.isArray(response?.data) ? response.data : [];
}

function isPotentiallyStuck(order, nowMs) {
  if (!order || TERMINAL_STATUSES.has(order.status)) return false;
  const raw = order.created_at || order.time;
  const createdMs = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(createdMs) && nowMs - createdMs > 30 * 60 * 1000;
}

function buildStatusCounts(orders) {
  const counts = Object.fromEntries(STATUS_KEYS.map((status) => [status, 0]));
  for (const order of orders) {
    if (Object.hasOwn(counts, order?.status)) counts[order.status] += 1;
  }
  return Object.freeze(counts);
}

function buildShipperSummary(profiles) {
  const shippers = profiles.filter((profile) => profile?.role === 'shipper');
  const now = Date.now();
  const online = shippers.filter((shipper) => {
    if (shipper.is_online !== true) return false;
    if (!shipper.last_seen) return true;
    const seen = new Date(shipper.last_seen).getTime();
    return Number.isFinite(seen) && now - seen <= 90 * 1000;
  }).length;

  return Object.freeze({ total: shippers.length, online });
}

export async function readSnapshot(client) {
  assertClient(client);
  const observedAt = new Date().toISOString();
  const nowMs = Date.now();

  const [orders, profiles, gpsHistory] = await Promise.all([
    selectRows(client, 'orders'),
    selectRows(client, 'profiles'),
    selectRows(client, 'shipper_gps_history'),
  ]);

  const potentiallyStuck = orders.filter((order) => isPotentiallyStuck(order, nowMs));

  return Object.freeze({
    mode: OBSERVER_MODE,
    observed_at: observedAt,
    read_only: true,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    database_mutation_permitted: DATABASE_MUTATION_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    orders: Object.freeze({
      total: orders.length,
      by_status: buildStatusCounts(orders),
      potentially_stuck_over_30m: Object.freeze(potentiallyStuck.map((order) => Object.freeze({ id: order.id, code: order.code, status: order.status }))),
    }),
    shippers: buildShipperSummary(profiles),
    gps_history_rows_observed: gpsHistory.length,
  });
}

export function observerSafetyCheck(snapshot) {
  return Boolean(
    snapshot &&
    snapshot.mode === OBSERVER_MODE &&
    snapshot.read_only === true &&
    snapshot.production_write_permitted === false &&
    snapshot.database_mutation_permitted === false &&
    snapshot.push_or_onesignal_permitted === false
  );
}
