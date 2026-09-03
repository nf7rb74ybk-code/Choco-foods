# CHOCO AUTO — Step 20 Operations Dashboard

LAB_REVIEW_ONLY dashboard for operational visibility.

## Purpose
- Show system status, order/shippers summary, findings, proposals and approval counts.
- Provide one read-only view for Admin review.

## Safety
- `production_write_permitted` is always `false`.
- `push_or_onesignal_permitted` is always `false`.
- This module performs no Supabase writes, RPC, Edge Function calls, order mutation, shipper assignment, cancellation, payment change, or Push/OneSignal dispatch.
- Approval remains a review decision only; execution is outside Step 20.
