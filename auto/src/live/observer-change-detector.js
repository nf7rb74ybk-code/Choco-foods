// CHOCO AUTO LAB — Level 6.2 read-only change detector
// Compares observer snapshots in memory only. No database writes or external actions.

export const OBSERVER_CHANGE_DETECTOR_MODE = 'LIVE_READ_ONLY_CHANGE_DETECTOR';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

function statusCounts(snapshot) {
  return snapshot?.orders?.by_status || {};
}

function snapshotKey(snapshot) {
  return JSON.stringify({
    orders_total: snapshot?.orders?.total ?? 0,
    by_status: statusCounts(snapshot),
    potentially_stuck_over_30m: snapshot?.orders?.potentially_stuck_over_30m || [],
    shippers_total: snapshot?.shippers?.total ?? 0,
    shippers_online: snapshot?.shippers?.online ?? 0,
    gps_history_rows_observed: snapshot?.gps_history_rows_observed ?? 0,
  });
}

function changedStatuses(previous, current) {
  const keys = new Set([
    ...Object.keys(statusCounts(previous)),
    ...Object.keys(statusCounts(current)),
  ]);
  return [...keys]
    .filter((status) => (statusCounts(previous)[status] ?? 0) !== (statusCounts(current)[status] ?? 0))
    .map((status) => ({
      status,
      previous: statusCounts(previous)[status] ?? 0,
      current: statusCounts(current)[status] ?? 0,
      delta: (statusCounts(current)[status] ?? 0) - (statusCounts(previous)[status] ?? 0),
    }));
}

export function detectObserverChanges(previous, current) {
  if (!current || current.mode !== 'LIVE_READ_ONLY' || current.read_only !== true) {
    throw new Error('CHOCO AUTO CHANGE DETECTOR: current snapshot must be read-only');
  }
  if (previous && (previous.mode !== 'LIVE_READ_ONLY' || previous.read_only !== true)) {
    throw new Error('CHOCO AUTO CHANGE DETECTOR: previous snapshot must be read-only');
  }

  if (!previous) {
    return Object.freeze({
      mode: OBSERVER_CHANGE_DETECTOR_MODE,
      baseline: true,
      changed: false,
      changes: Object.freeze([]),
      production_execution_enabled: false,
      production_write_permitted: false,
      database_mutation_permitted: false,
      push_or_onesignal_permitted: false,
    });
  }

  const changes = [];
  const previousStuck = previous.orders?.potentially_stuck_over_30m?.length ?? 0;
  const currentStuck = current.orders?.potentially_stuck_over_30m?.length ?? 0;
  if ((previous.orders?.total ?? 0) !== (current.orders?.total ?? 0)) {
    changes.push({ type: 'ORDERS_TOTAL', previous: previous.orders?.total ?? 0, current: current.orders?.total ?? 0 });
  }
  if (previousStuck !== currentStuck) {
    changes.push({ type: 'STUCK_ORDERS', previous: previousStuck, current: currentStuck });
  }
  if ((previous.shippers?.online ?? 0) !== (current.shippers?.online ?? 0)) {
    changes.push({ type: 'ONLINE_SHIPPERS', previous: previous.shippers?.online ?? 0, current: current.shippers?.online ?? 0 });
  }
  if ((previous.gps_history_rows_observed ?? 0) !== (current.gps_history_rows_observed ?? 0)) {
    changes.push({ type: 'GPS_ROWS', previous: previous.gps_history_rows_observed ?? 0, current: current.gps_history_rows_observed ?? 0 });
  }
  for (const change of changedStatuses(previous, current)) {
    changes.push({ type: 'STATUS_COUNT', ...change });
  }

  return Object.freeze({
    mode: OBSERVER_CHANGE_DETECTOR_MODE,
    baseline: false,
    changed: snapshotKey(previous) !== snapshotKey(current),
    changes: Object.freeze(changes.map((change) => Object.freeze(change))),
    production_execution_enabled: false,
    production_write_permitted: false,
    database_mutation_permitted: false,
    push_or_onesignal_permitted: false,
  });
}

export function observerChangeDetectorSafetyCheck(result) {
  return Boolean(
    result &&
    result.mode === OBSERVER_CHANGE_DETECTOR_MODE &&
    result.production_execution_enabled === false &&
    result.production_write_permitted === false &&
    result.database_mutation_permitted === false &&
    result.push_or_onesignal_permitted === false &&
    Array.isArray(result.changes)
  );
}
