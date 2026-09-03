# CHOCO AUTO LAB — Step 19 Decision Center

The Decision Center is the human-review UI/controller boundary for CHOCO AUTO LAB.

## Purpose

- Present findings from the READ-ONLY analysis engine.
- Present review-only proposals.
- Create pending approval requests.
- Allow an explicit admin decision in LAB/simulation.
- Keep production execution disabled.

## Safety contract

- `mode = REVIEW_ONLY`
- `production_write_permitted = false`
- `execution_permitted = false` even after an approval decision.
- No INSERT, UPDATE, UPSERT, DELETE, or RPC.
- No Supabase client is required by this module.
- No Edge Function calls.
- No Push/OneSignal calls.
- No automatic cancellation, assignment, status change, or money/payment change.

Step 19 does not connect to Production. A future Production action layer must be separately designed, tested, permissioned, and approved.
