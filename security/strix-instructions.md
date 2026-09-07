# CHOCO — Strix Security Rules of Engagement

## Scope

This assessment is authorized for the CHOCO application repository only.

Primary target for Phase 1: the checked-out repository (`./`).

Do not attack third-party services, unrelated domains, or real customer/shipper accounts.
Do not perform destructive actions, data deletion, real payments, bulk messaging, or production state changes.

## Priority areas

1. Authentication and session handling
2. Authorization and role separation: customer, shipper, POS, admin
3. IDOR / broken object-level authorization
4. Supabase REST/RLS assumptions visible in source
5. Supabase Edge Function authorization and input validation
6. Order state transitions and business logic
7. Price, shipping fee, total, distance, and quantity tampering
8. Push notification authorization and recipient manipulation
9. XSS, injection, SSRF, command injection, and unsafe URL handling
10. Secrets and credential exposure
11. GitHub Actions/workflow security and supply-chain risks

## Important CHOCO objects

Pay special attention to identifiers and fields such as:

- user_id
- shipper_id
- order_id / id
- restaurant_id
- profile identifiers
- shipping_fee
- food_total
- total
- distance_km
- status
- push subscription identifiers

## Validation standard

Do not report a theoretical issue as confirmed solely from client-side code. Where possible, validate exploitability with a safe proof of concept that does not modify or destroy real data.

For authorization findings, clearly distinguish:

- client-side UI restriction
- API authorization
- Supabase RLS enforcement
- Edge Function/server-side enforcement

## Production safety

Phase 1 is repository-only. Do not target the live CHOCO production site in this workflow.

If a finding would require live authenticated testing, report it as requiring a staging test and stop short of using real credentials or real customer data.

## Output

Prioritize findings as CRITICAL, HIGH, MEDIUM, LOW, or INFO.
For each confirmed vulnerability include:

- affected file/function/endpoint when identifiable
- vulnerability class
- why it is exploitable
- minimal safe proof of concept
- impact on CHOCO
- recommended remediation
- confidence level
