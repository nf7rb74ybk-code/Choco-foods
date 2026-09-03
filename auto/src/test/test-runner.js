// CHOCO AUTO LAB — Step 15: isolated test runner
// Tests analysis/approval behavior using synthetic snapshots only.
// No Supabase client, production data, mutation, RPC, Edge Function, Push, or OneSignal.

import { analyzeSnapshot } from '../engine/analysis.js';
import { createApprovalRequest, reviewApproval } from '../approval/approval-gate.js';

function syntheticSnapshot(overrides = {}) {
  return {
    generated_at: '2026-01-01T00:00:00.000Z',
    read_only: true,
    production_write_permitted: false,
    orders: {
      total: 0,
      by_status: {},
      potentially_stuck_over_30m: [],
      ...overrides.orders,
    },
    shippers: {
      total: 0,
      online: 0,
      with_gps: 0,
      ...overrides.shippers,
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(`TEST_FAILED: ${message}`);
}

export function runAutoTests() {
  const results = [];

  const run = (name, fn) => {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    }
  };

  run('healthy snapshot produces no findings', () => {
    const result = analyzeSnapshot(syntheticSnapshot());
    assert(result.findings.length === 0, 'expected zero findings');
    assert(result.summary.automatic_actions === 0, 'automatic actions must remain zero');
  });

  run('stuck order creates review-only proposal', () => {
    const result = analyzeSnapshot(syntheticSnapshot({
      orders: {
        total: 1,
        potentially_stuck_over_30m: [{ code: 'LAB-ORDER-001' }],
      },
    }));
    assert(result.findings.some((x) => x.id === 'ORDER_STUCK_30M'), 'stuck finding missing');
    assert(result.proposals[0].mode === 'REVIEW_ONLY', 'proposal must be review-only');
    assert(result.proposals[0].action === 'NO_AUTOMATIC_ACTION', 'automatic action must be blocked');
  });

  run('no online shipper is critical but still non-executable', () => {
    const result = analyzeSnapshot(syntheticSnapshot({
      orders: { total: 2 },
      shippers: { total: 2, online: 0, with_gps: 0 },
    }));
    const finding = result.findings.find((x) => x.id === 'NO_ONLINE_SHIPPER');
    assert(finding?.severity === 'critical', 'critical finding missing');
    assert(finding?.action_permitted === false, 'finding must not permit action');
  });

  run('approval gate never grants execution permission', () => {
    const result = analyzeSnapshot(syntheticSnapshot({
      orders: { total: 1 },
      shippers: { total: 1, online: 0, with_gps: 0 },
    }));
    const request = createApprovalRequest(result.proposals[0]);
    const approved = reviewApproval(request, 'APPROVED', 'admin');
    assert(approved.status === 'APPROVED', 'approval status should be recorded');
    assert(approved.execution_permitted === false, 'approval must not permit execution');
  });

  run('unsafe snapshot is rejected', () => {
    let rejected = false;
    try {
      analyzeSnapshot({ ...syntheticSnapshot(), production_write_permitted: true });
    } catch {
      rejected = true;
    }
    assert(rejected, 'unsafe snapshot should be rejected');
  });

  return {
    test_suite: 'CHOCO_AUTO_STEP_15',
    generated_at: new Date().toISOString(),
    production_data_used: false,
    production_write_permitted: false,
    push_or_onesignal_used: false,
    results,
    passed: results.every((x) => x.passed),
    passed_count: results.filter((x) => x.passed).length,
    failed_count: results.filter((x) => !x.passed).length,
  };
}
