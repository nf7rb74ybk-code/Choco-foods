// CHOCO AUTO LAB — Step 19 tests
// Pure in-memory tests. No Production, Supabase, Push, or OneSignal.

import {
  APPROVAL_STATUS,
  buildDecisionCenterFromSnapshot,
  reviewDecision,
} from '../decision-center/decision-center.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function runStep19Tests() {
  const snapshot = {
    read_only: true,
    production_write_permitted: false,
    generated_at: '2026-09-03T00:00:00.000Z',
    orders: {
      total: 2,
      potentially_stuck_over_30m: [
        { id: 1, code: 'SIM-001', status: 'Chờ xác nhận', age_minutes: 45 },
      ],
      by_status: { 'Chờ xác nhận': 2, UNKNOWN: 0 },
    },
    shippers: { total: 1, online: 1, with_gps: 1 },
    gps_history_rows: 2,
  };

  const flow = buildDecisionCenterFromSnapshot(snapshot);
  const center = flow.center;
  const request = flow.approval_requests[0];
  const approved = reviewDecision(request, APPROVAL_STATUS.APPROVED, 'simulation-admin');

  const checks = {
    review_only: center.mode === 'REVIEW_ONLY',
    finding_visible: center.findings.length >= 1,
    proposal_visible: center.proposals.length >= 1,
    approval_request_pending: request?.status === APPROVAL_STATUS.PENDING,
    approval_recorded: approved.status === APPROVAL_STATUS.APPROVED,
    execution_still_blocked: approved.execution_permitted === false,
    production_write_blocked: center.production_write_permitted === false,
    push_blocked: center.push_or_onesignal_used === false,
  };

  assert(Object.values(checks).every(Boolean), 'Step 19 Decision Center safety test failed');

  return {
    suite: 'CHOCO_AUTO_STEP_19',
    passed: true,
    checks,
    production_data_used: false,
    production_write_permitted: false,
    push_or_onesignal_used: false,
    execution_count: 0,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runStep19Tests(), null, 2));
}
