# CHOCO AUTO — runnable safety-first runtime

## Current operating mode

CHOCO AUTO is currently runnable in two safe modes:

1. **LAB simulation** — plans, approvals, queueing and execution simulation with Production writes disabled.
2. **Live read-only observer/controller** — reads operational data through SELECT-only requests, detects changes, routes them through the LAB orchestrator, and simulates the resulting task without touching Production.

Production mutation, automatic order changes, Push/OneSignal and real execution remain fail-closed.

## Run the real read-only observer once

From the repository root with Node 22+:

```bash
SUPABASE_URL='https://YOUR_PROJECT.supabase.co' \
SUPABASE_ANON_KEY='YOUR_PUBLISHABLE_OR_ANON_KEY' \
node --experimental-default-type=module auto/src/cli/choco-auto-readonly.js
```

The key must be an **anon/publishable** key protected by Supabase RLS. Do not use a service-role key in this command.

The observer reads only these allow-listed tables:

- `orders`
- `profiles`
- `shipper_gps_history`

The REST adapter only sends HTTP `GET` requests.

## Run the continuous LAB watch

To keep observing live data continuously while still keeping every action in LAB simulation:

```bash
SUPABASE_URL='https://YOUR_PROJECT.supabase.co' \
SUPABASE_ANON_KEY='YOUR_PUBLISHABLE_OR_ANON_KEY' \
CHOCO_AUTO_INTERVAL_MS=60000 \
node --experimental-default-type=module auto/src/cli/choco-auto-lab-watch.js
```

The watch performs this loop:

`SELECT snapshot → normalize observation → detect change → create event → queue → safety gate → LAB simulation → audit`

Press `Ctrl+C` to stop it. It never assigns a real shipper, changes an order, sends Push/OneSignal, or writes to Supabase.

## Automated LAB pipeline

GitHub Actions validates:

- JavaScript syntax across `auto/src`
- Level 5 final LAB integrity
- Level 5 stress behavior
- Level 6 SELECT-only observer
- Level 6 runtime integration
- continuous observer loop
- Level 6.2 change detection
- Level 6.3 change → event → LAB task controller
- Level 6.4 reliability/retry recovery
- Level 6 event-routing E2E
- SELECT-only REST adapter

## Safety contract

Every runtime path must keep these values false:

- `production_execution_enabled`
- `production_write_permitted`
- `database_mutation_permitted`
- `push_or_onesignal_permitted`
- `executed`

The live observer may detect a condition and create a LAB task, but it does not change the real order, assign a real shipper, send a real notification, or write to Production.
