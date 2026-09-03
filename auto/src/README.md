# CHOCO AUTO — READ-ONLY Data Layer

## Purpose

This layer is the first data boundary for CHOCO AUTO. It reads operational data for analysis only.

## Allowed sources

- `public.orders`
- `public.profiles`
- `public.shipper_gps_history`

The implementation uses an allow-list of columns and only calls Supabase `.select()`.

## Explicitly forbidden

- `insert`
- `update`
- `upsert`
- `delete`
- `rpc` for mutation
- order status changes
- shipper assignment
- payment/fee changes
- Push or OneSignal dispatch

## Credentials

No Supabase URL, publishable key, secret key, service-role key, or token is stored in this directory. The application must inject an already-authorized Supabase client.

## Security model

The client/session used by the eventual application must remain subject to Supabase authentication and RLS. Do not add a service-role key to browser code.

## Current production verification

At Step 12, the production project was inspected without schema changes. The expected source tables exist and `auto_*` tables do not exist yet. No AUTO migration is created in production during this step.
