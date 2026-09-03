/**
 * CHOCO AUTO LAB — Dashboard READ-ONLY Adapter
 *
 * Bridges the existing SELECT-only data layer to the Operations Dashboard.
 * No credentials, writes, RPC, Edge Functions, Push, or OneSignal calls.
 */
import { readOrders, readShippers, readGpsHistory } from '../readonly-data-layer.js';
import { buildOperationsDashboard } from './operations-dashboard.js';

export async function loadDashboardState(client) {
  const [orders, shippers, gpsHistory] = await Promise.all([
    readOrders(client),
    readShippers(client),
    readGpsHistory(client)
  ]);

  const orderStatus = {};
  for (const order of orders) {
    const status = order.status || 'UNKNOWN';
    orderStatus[status] = (orderStatus[status] || 0) + 1;
  }

  const state = {
    production_write_permitted: false,
    system: {
      status: 'READ_ONLY_CONNECTED',
      gps_rows: gpsHistory.length
    },
    orders: {
      total: orders.length,
      by_status: orderStatus
    },
    shippers: {
      total: shippers.filter((s) => s.role === 'shipper').length,
      online: shippers.filter((s) => s.role === 'shipper' && s.is_online === true).length,
      with_gps: shippers.filter((s) => s.role === 'shipper' && s.latitude != null && s.longitude != null).length
    },
    findings: [],
    proposals: [],
    approvals: []
  };

  return buildOperationsDashboard(state);
}
