# CHOCO AUTO — Simulation Engine

Step 17 adds an in-memory simulation of the LAB pipeline:

`READ-ONLY SNAPSHOT → ANALYSIS → REVIEW-ONLY PROPOSAL → ADMIN APPROVAL → BLOCKED EXECUTION`

## Safety boundary

This module is simulation-only. It does not:

- write to `public.orders` or any production table;
- call Supabase mutations or RPC;
- call Edge Functions;
- send Push or OneSignal notifications;
- assign shippers;
- cancel or change order status;
- change money, payment, totals, or fees.

Even when a simulated approval is `APPROVED`, `execution_permitted` remains `false`.

## Verification helper

`runSimulationAssertions()` builds a safe synthetic snapshot and checks that:

1. analysis creates findings;
2. review-only proposals are created;
3. approval requests are created;
4. simulated admin approval is recorded;
5. production execution remains blocked;
6. execution count remains zero.

No production credentials are stored in this directory.
