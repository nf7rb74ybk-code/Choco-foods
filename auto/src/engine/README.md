# CHOCO AUTO — Analysis Engine (Step 14)

The analysis engine is a **read-only decision-support layer**.

## Input

It consumes the observation snapshot produced by Step 13.

Required safety flags:

- `read_only === true`
- `production_write_permitted === false`

## Current findings

The engine can flag:

1. Active orders observed for at least 30 minutes.
2. Online shippers without currently usable GPS coordinates.
3. Orders observed while no shipper is online.
4. Unknown or missing order statuses.

## Output

Each finding contains:

- severity
- type
- evidence
- `ADMIN_REVIEW_REQUIRED`
- `action_permitted: false`

The engine also creates review-only proposals with `NO_AUTOMATIC_ACTION`.

## Explicitly forbidden

This module does **not**:

- insert/update/upsert/delete database rows
- call Supabase RPC
- call Edge Functions
- send Push/OneSignal notifications
- assign shippers
- cancel orders
- change order status
- change payment or money values

Step 14 therefore remains LAB/TEST analysis only.
