// CHOCO AUTO LAB — continuous real-data observer/controller entry point
//
// This command reads the configured Supabase project, detects changes, routes
// them through the LAB orchestrator, and simulates the resulting task only.
// It never writes to Supabase and never sends Push/OneSignal notifications.
//
// Usage:
//   SUPABASE_URL='https://your-project.supabase.co' \
//   SUPABASE_ANON_KEY='your-anon-or-publishable-key' \
//   CHOCO_AUTO_INTERVAL_MS=60000 \
//   node --experimental-default-type=module auto/src/cli/choco-auto-lab-watch.js

import { createSupabaseReadonlyClient } from '../live/supabase-readonly-client.js';
import { createLiveAutoController, liveAutoControllerSafetyCheck } from '../live/live-auto-controller.js';

const intervalMs = Number(process.env.CHOCO_AUTO_INTERVAL_MS ?? 60_000);
if (!Number.isFinite(intervalMs) || intervalMs < 1_000) {
  throw new Error('CHOCO AUTO LAB WATCH: CHOCO_AUTO_INTERVAL_MS must be at least 1000ms');
}

const client = createSupabaseReadonlyClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
});
const controller = createLiveAutoController({
  client,
  requestedBy: 'CHOCO_AUTO_LAB_WATCH',
});

let stopped = false;
let running = false;
let timer = null;

const stop = () => {
  if (stopped) return;
  stopped = true;
  if (timer) clearInterval(timer);
  timer = null;
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

const tick = async () => {
  if (stopped || running) return;
  running = true;
  try {
    const result = await controller.tick();
    if (!liveAutoControllerSafetyCheck(result)) {
      throw new Error('CHOCO AUTO LAB WATCH: safety check failed');
    }
    console.log(JSON.stringify({
      mode: result.mode,
      tick: result.tick,
      observed_at: result.snapshot.observed_at,
      order_total: result.observation.orders.total,
      stuck_orders: result.observation.orders.stuck,
      online_shippers: result.observation.shippers.online,
      gps_history_rows_observed: result.snapshot.gps_history_rows_observed,
      changes: result.changes,
      events: result.events,
      processed: result.processed.map((item) => ({
        status: item.status,
        reason: item.reason ?? null,
        task: item.task?.type ?? null,
        simulated: item.simulation?.simulated ?? false,
        executed: item.simulation?.executed ?? false,
      })),
      audit_count: result.audit_count,
      production_execution_enabled: result.production_execution_enabled,
      production_write_permitted: result.production_write_permitted,
      database_mutation_permitted: result.database_mutation_permitted,
      push_or_onesignal_permitted: result.push_or_onesignal_permitted,
      executed: result.executed,
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      mode: 'LAB_LIVE_AUTO_CONTROLLER_ONLY',
      error: error instanceof Error ? error.message : String(error),
      production_execution_enabled: false,
      production_write_permitted: false,
      database_mutation_permitted: false,
      push_or_onesignal_permitted: false,
      executed: false,
    }, null, 2));
  } finally {
    running = false;
  }
};

await tick();
timer = setInterval(tick, intervalMs);
