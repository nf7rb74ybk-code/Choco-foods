# CHOCO AUTO LAB

## Purpose
Isolated LAB for CHOCO AUTO automation experiments.

## Safety contract
- LAB / TEST only.
- READ-ONLY against CHOCO SHIP production data during the initial phase.
- No automatic cancellation of production orders.
- No changes to production money/payment values.
- No direct production order updates.
- No automatic shipper assignment.
- No production Push/OneSignal sends.
- Do not modify existing Push/OneSignal integrations.
- Production SQL functions/triggers are not reused or modified.

## Architecture
Production data -> READ-ONLY observation -> AUTO LAB analysis -> action proposal -> Admin approval -> future safe execution.

## Current phase
Step 11: repository skeleton only. No Supabase production schema changes are part of this step.

## Base
This branch was created from main commit `4cd7a9208ebe2830b3debf7ce2928c0fc14e1276`.
