// CHOCO AUTO LAB — READ-ONLY observer
// Step 13: Production observation snapshot.
// This module intentionally exposes SELECT-only operations.
// It does not insert, update, upsert, delete, invoke Edge Functions, or send Push.

const ORDER_FIELDS = 'id,code,status,created_at,latitude,longitude,shipper_id,distance_km,total,shipping_fee';
const SHIPPER_FIELDS = 'id,role,full_name,phone,last_seen,is_online,latitude,longitude';
const GPS_FIELDS = 'id,shipper_id,latitude,longitude,recorded_at';

export async function readSnapshot(supabase) {
  if (!supabase?.from) throw new Error('A Supabase client is required');

  const [orders, profiles, gps] = await Promise.all([
    supabase.from('orders').select(ORDER_FIELDS),
    supabase.from('profiles').select(SHIPPER_FIELDS).eq('role', 'shipper'),
    supabase.from('shipper_gps_history').select(GPS_FIELDS).order('recorded_at', { ascending: false }).limit(500),
  ]);

  if (orders.error) throw orders.error;
  if (profiles.error) throw profiles.error;
  if (gps.error) throw gps.error;

  return buildSnapshot(orders.data ?? [], profiles.data ?? [], gps.data ?? []);
}

export function buildSnapshot(orders, shippers, gpsHistory, now = new Date()) {
  const nowMs = new Date(now).getTime();
  const statusCounts = {};
  for (const order of orders) {
    const status = order.status ?? 'UNKNOWN';
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const onlineShippers = shippers.filter((s) => s.is_online === true);
  const shippersWithGps = shippers.filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude));

  const stuckOrders = orders.filter((o) => {
    if (!o.created_at) return false;
    const ageMinutes = (nowMs - new Date(o.created_at).getTime()) / 60000;
    return ageMinutes >= 30 && !['Đã giao', 'Hoàn thành'].includes(o.status);
  });

  return {
    generated_at: new Date(nowMs).toISOString(),
    read_only: true,
    production_write_permitted: false,
    orders: {
      total: orders.length,
      by_status: statusCounts,
      potentially_stuck_over_30m: stuckOrders.map((o) => ({ id: o.id, code: o.code, status: o.status, created_at: o.created_at })),
    },
    shippers: {
      total: shippers.length,
      online: onlineShippers.length,
      with_gps: shippersWithGps.length,
    },
    gps_history_rows_observed: gpsHistory.length,
  };
}
