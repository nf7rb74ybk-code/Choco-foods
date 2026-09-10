// CHOCO AUTO LEVEL 5 — Step 6: Observation + Context Controller
// LAB/TEST ONLY. Normalizes an already-read snapshot into AI context.
// This module never queries, writes, assigns, sends Push, or changes Production.

export const OBSERVATION_CONTEXT_MODE = 'LAB_OBSERVATION_CONTEXT_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const ORDER_STATUS_KEYS = Object.freeze([
  'Chờ xác nhận',
  'Đã nhận',
  'Đang lấy hàng',
  'Đang giao',
  'Đã giao',
  'Hoàn thành',
  'Đã huỷ',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function countStatuses(byStatus) {
  return Object.fromEntries(
    ORDER_STATUS_KEYS.map((status) => [status, Number(byStatus?.[status] ?? 0)])
  );
}

function countPotentialIssues(orders) {
  const stuck = asArray(orders?.potentially_stuck_over_30m);
  return Object.freeze({
    potentially_stuck_over_30m: stuck.length,
    total_flagged: stuck.length,
  });
}

export function buildObservationContext(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('CHOCO AUTO OBSERVATION: snapshot object is required');
  }

  const orders = snapshot.orders ?? {};
  const shippers = snapshot.shippers ?? {};
  const issues = countPotentialIssues(orders);

  return Object.freeze({
    mode: OBSERVATION_CONTEXT_MODE,
    observed_at: snapshot.observed_at ?? new Date().toISOString(),
    source_mode: snapshot.mode ?? 'UNKNOWN',
    read_only: true,
    production_write_permitted: false,
    database_mutation_permitted: false,
    push_or_onesignal_permitted: false,
    orders: Object.freeze({
      total: Number(orders.total ?? 0),
      by_status: Object.freeze(countStatuses(orders.by_status)),
      potentially_stuck_over_30m: issues.potentially_stuck_over_30m,
    }),
    shippers: Object.freeze({
      total: Number(shippers.total ?? 0),
      online: Number(shippers.online ?? 0),
      offline: Math.max(0, Number(shippers.total ?? 0) - Number(shippers.online ?? 0)),
    }),
    gps_history_rows_observed: Number(snapshot.gps_history_rows_observed ?? 0),
    signals: Object.freeze({
      has_orders: Number(orders.total ?? 0) > 0,
      has_online_shippers: Number(shippers.online ?? 0) > 0,
      has_potentially_stuck_orders: issues.total_flagged > 0,
    }),
  });
}

export function observationContextSafetyCheck(context) {
  return Boolean(
    context &&
    context.mode === OBSERVATION_CONTEXT_MODE &&
    context.read_only === true &&
    context.production_write_permitted === false &&
    context.database_mutation_permitted === false &&
    context.push_or_onesignal_permitted === false
  );
}
