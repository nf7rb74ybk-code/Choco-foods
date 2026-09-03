/**
 * CHOCO AUTO LAB — READ-ONLY Data Layer
 *
 * Safety contract:
 * - SELECT only. No INSERT/UPDATE/DELETE/upsert.
 * - No production writes.
 * - No Push/OneSignal calls.
 * - No automatic dispatch or order mutation.
 * - The Supabase client must be supplied by the caller; no credentials live here.
 */

const READ_ONLY_TABLES = Object.freeze({
  orders: [
    'id', 'code', 'status', 'time', 'created_at',
    'latitude', 'longitude', 'shipper_id', 'shipper_name',
    'distance_km', 'total', 'food_total', 'shipping_fee'
  ],
  profiles: [
    'id', 'role', 'full_name', 'phone', 'last_seen',
    'is_online', 'latitude', 'longitude'
  ],
  shipper_gps_history: [
    'id', 'shipper_id', 'latitude', 'longitude', 'recorded_at'
  ]
});

function assertTable(table) {
  if (!Object.prototype.hasOwnProperty.call(READ_ONLY_TABLES, table)) {
    throw new Error(`CHOCO AUTO: table not allowed in read-only layer: ${table}`);
  }
}

function assertClient(client) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('CHOCO AUTO: a Supabase client with .from() is required');
  }
}

/** Read rows only. The returned query is intentionally limited to SELECT. */
export async function readRows(client, table, options = {}) {
  assertClient(client);
  assertTable(table);

  const columns = READ_ONLY_TABLES[table].join(',');
  let query = client.from(table).select(columns);

  if (Number.isInteger(options.limit) && options.limit > 0) {
    query = query.limit(Math.min(options.limit, 500));
  }

  if (options.orderBy && READ_ONLY_TABLES[table].includes(options.orderBy)) {
    query = query.order(options.orderBy, {
      ascending: options.ascending !== false
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}

export async function readOrders(client, options = {}) {
  return readRows(client, 'orders', {
    limit: options.limit ?? 200,
    orderBy: options.orderBy ?? 'created_at',
    ascending: options.ascending ?? false
  });
}

export async function readShippers(client, options = {}) {
  return readRows(client, 'profiles', {
    limit: options.limit ?? 100,
    orderBy: options.orderBy ?? 'last_seen',
    ascending: options.ascending ?? false
  });
}

export async function readGpsHistory(client, options = {}) {
  return readRows(client, 'shipper_gps_history', {
    limit: options.limit ?? 500,
    orderBy: options.orderBy ?? 'recorded_at',
    ascending: options.ascending ?? false
  });
}

export const CHOCO_AUTO_READ_ONLY = true;
