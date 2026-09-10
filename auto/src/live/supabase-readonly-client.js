// CHOCO AUTO LAB — read-only Supabase REST adapter
// Uses only HTTP GET against allow-listed operational tables.
// No service-role key is accepted or stored. No mutation methods are exposed.

export const READONLY_CLIENT_MODE = 'SUPABASE_REST_SELECT_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const TABLE_SELECTS = Object.freeze({
  orders: 'id,code,status,created_at,time',
  profiles: 'id,role,is_online,last_seen',
  shipper_gps_history: 'id',
});

function normalizeUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function createSupabaseReadonlyClient({ url, anonKey, fetchImpl = globalThis.fetch } = {}) {
  const baseUrl = normalizeUrl(url);
  if (!baseUrl || !/^https:\/\//i.test(baseUrl)) throw new Error('CHOCO AUTO READONLY: SUPABASE_URL must be HTTPS');
  if (!anonKey || typeof anonKey !== 'string') throw new Error('CHOCO AUTO READONLY: SUPABASE_ANON_KEY is required');
  if (typeof fetchImpl !== 'function') throw new Error('CHOCO AUTO READONLY: fetch is required');

  return Object.freeze({
    from(table) {
      if (!Object.hasOwn(TABLE_SELECTS, table)) throw new Error(`CHOCO AUTO READONLY: table not allow-listed: ${table}`);
      return Object.freeze({
        select(columns = '*') {
          if (columns !== '*') throw new Error('CHOCO AUTO READONLY: only observer-defined SELECT is supported');
          const select = TABLE_SELECTS[table];
          const endpoint = `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(select)}`;
          return fetchImpl(endpoint, {
            method: 'GET',
            headers: Object.freeze({
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              Accept: 'application/json',
            }),
          }).then(async (response) => {
            if (!response.ok) {
              const body = await response.text().catch(() => '');
              return { data: null, error: new Error(`HTTP ${response.status}: ${body || response.statusText}`) };
            }
            const data = await response.json();
            return { data: Array.isArray(data) ? data : [], error: null };
          });
        },
      });
    },
  });
}

export function readonlyClientSafetyCheck(client) {
  return Boolean(
    client &&
    typeof client.from === 'function' &&
    READONLY_CLIENT_MODE === 'SUPABASE_REST_SELECT_ONLY' &&
    PRODUCTION_WRITE_PERMITTED === false &&
    DATABASE_MUTATION_PERMITTED === false &&
    PUSH_OR_ONESIGNAL_PERMITTED === false
  );
}
