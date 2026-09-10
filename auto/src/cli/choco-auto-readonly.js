// CHOCO AUTO LAB — real read-only command-line entry point
// Usage:
//   SUPABASE_URL='https://your-project.supabase.co' SUPABASE_ANON_KEY='your-anon-or-publishable-key' \
//   node --experimental-default-type=module auto/src/cli/choco-auto-readonly.js
//
// This command can observe real operational data but cannot mutate it.

import { createSupabaseReadonlyClient } from '../live/supabase-readonly-client.js';
import { runLiveObserver } from '../live/run-live-observer.js';
import { liveObserverRuntimeSafetyCheck } from '../live/run-live-observer.js';

const client = createSupabaseReadonlyClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
});

const result = await runLiveObserver({ client, requestedBy: 'CHOCO_AUTO_READONLY_CLI' });
if (!liveObserverRuntimeSafetyCheck(result)) {
  throw new Error('CHOCO AUTO READONLY CLI: safety check failed');
}

console.log(JSON.stringify({
  mode: result.mode,
  observed_at: result.snapshot.observed_at,
  orders: result.snapshot.orders,
  shippers: result.snapshot.shippers,
  gps_history_rows_observed: result.snapshot.gps_history_rows_observed,
  decision: result.decision,
  priority_score: result.priority_score,
  waiting_for_target: result.waiting_for_target,
  production_execution_enabled: result.production_execution_enabled,
  production_write_permitted: result.production_write_permitted,
  database_mutation_permitted: result.database_mutation_permitted,
  push_or_onesignal_permitted: result.push_or_onesignal_permitted,
  executed: result.executed,
}, null, 2));
