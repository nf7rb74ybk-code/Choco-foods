# CHOCO AUTO LAB — Step 15 Test Runner

The test runner uses synthetic in-memory snapshots only.

Safety guarantees:
- No Supabase client is imported or used.
- No production rows are read or written.
- No INSERT, UPDATE, UPSERT, DELETE, RPC, or Edge Function calls.
- No Push or OneSignal calls.
- Approval is tested only as a state transition; `execution_permitted` must remain `false`.
- Unsafe snapshots with `production_write_permitted=true` must be rejected.

The suite validates the Step 14 analysis engine and Step 16 approval gate without touching Production.