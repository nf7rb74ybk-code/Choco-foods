// CHOCO AUTO LAB — read-only REST adapter test
// Verifies allow-listing and GET-only behavior without network access.

import { createSupabaseReadonlyClient, readonlyClientSafetyCheck } from '../live/supabase-readonly-client.js';

const requests = [];
const fakeFetch = async (url, options) => {
  requests.push({ url, method: options.method, hasApikey: Boolean(options.headers.apikey) });
  return {
    ok: true,
    async json() { return [{ id: 1, status: 'Chờ xác nhận' }]; },
    async text() { return ''; },
  };
};

const client = createSupabaseReadonlyClient({
  url: 'https://example.supabase.co',
  anonKey: 'publishable-test-key',
  fetchImpl: fakeFetch,
});

const response = await client.from('orders').select('*');
const blocked = (() => {
  try {
    client.from('users');
    return false;
  } catch {
    return true;
  }
})();

const checks = {
  safety: readonlyClientSafetyCheck(client),
  data_array: Array.isArray(response.data),
  one_get_request: requests.length === 1 && requests[0].method === 'GET',
  no_mutation_method: !Object.hasOwn(client, 'insert') && !Object.hasOwn(client, 'update') && !Object.hasOwn(client, 'delete'),
  table_allowlist: blocked,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
if (failed.length) throw new Error(`Read-only REST checks failed: ${failed.map(([name]) => name).join(', ')}`);

console.log('CHOCO_AUTO_LEVEL_6_READONLY_REST_CLIENT_TEST: PASS');
