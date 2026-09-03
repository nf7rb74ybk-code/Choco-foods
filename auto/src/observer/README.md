# CHOCO AUTO — Observation Layer

Step 13 provides a production observation snapshot in LAB mode.

## Allowed
- SELECT from `orders`
- SELECT from `profiles` for shippers
- SELECT from `shipper_gps_history`
- Calculate counts/status summaries in memory
- Detect potentially stuck orders for analysis only

## Forbidden
- INSERT / UPDATE / UPSERT / DELETE
- Changing order status, money, payment, or shipper assignment
- Calling Push/OneSignal or existing dispatch functions
- Calling production Edge Functions for side effects
- Creating or modifying production tables, triggers, or functions

The snapshot is an observation result, not an action queue. Any future action must go through a separate proposal + admin approval layer.
