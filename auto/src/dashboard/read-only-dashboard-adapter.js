/**
 * CHOCO AUTO LAB — Read-only Dashboard Adapter
 *
 * Bridges the existing READ-ONLY data layer into the Operations Dashboard.
 * Safety boundary: SELECT-only, review-only, no production writes, no Push.
 */

import {
  readOrders,
  readShippers,
  readGpsHistory,
} from '../readonly-data-layer.js';

export const ADAPTER_MODE = 'LAB_READ_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

function assertClient(client) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('CHOCO AUTO: Supabase client is required');
  }
}

function buildStatusCounts(orders) {
  return orders.reduce((counts, order) => {
    const status = typeof order.status === 'string' && order.status.trim()
      ? order.status
      : 'UNKNOWN';
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
}

function buildShipperSummary(shippers) {
  const onlyShippers = shippers.filter((profile) => profile.role === 'shipper');
  return {
    total: onlyShippers.length,
    online: onlyShippers.filter((profile) => profile.is_online === true).length,
    with_gps: onlyShippers.filter(
      (profile) => Number.isFinite(profile.latitude) && Number.isFinite(profile.longitude),
    ).length,
  };
}

/**
 * Read production-backed sources through the existing SELECT-only layer.
 * The caller supplies an already-authorized client; this module stores no keys.
 */
export async function loadDashboardState(client) {
  assertClient(client);

  const [orders, profiles, gpsHistory] = await Promise.all([
    readOrders(client),
    readShippers(client),
    readGpsHistory(client),
  ]);

  return {
    mode: ADAPTER_MODE,
    read_only: true,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    system: {
      status: 'READ_ONLY_CONNECTED',
      source: 'CHOCO_AUTO_READ_ONLY_DATA_LAYER',
    },
    orders: {
      total: orders.length,
      by_status: buildStatusCounts(orders),
    },
    shippers: buildShipperSummary(profiles),
    gps_history: {
      rows: gpsHistory.length,
    },
    findings: [],
    proposals: [],
    approvals: [],
  };
}

export function adapterSafetyCheck(state) {
  return !!state
    && state.mode === ADAPTER_MODE
    && state.read_only === true
    && state.production_write_permitted === false
    && state.push_or_onesignal_permitted === false;
}
