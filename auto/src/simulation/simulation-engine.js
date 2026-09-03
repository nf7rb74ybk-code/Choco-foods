import { analyzeSnapshot } from '../engine/analysis.js';
import {
  APPROVAL_STATUS,
  createApprovalRequest,
  reviewApproval,
} from '../approval/approval-gate.js';

export const SIMULATION_ONLY = true;

function assertSimulationSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new TypeError('snapshot must be an object');
  }
  if (snapshot.read_only !== true) {
    throw new Error('Simulation requires read_only=true');
  }
  if (snapshot.production_write_permitted !== false) {
    throw new Error('Simulation requires production_write_permitted=false');
  }
}

export function simulateAutoFlow(snapshot, decision = APPROVAL_STATUS.APPROVED) {
  assertSimulationSnapshot(snapshot);
  const analysis = analyzeSnapshot(snapshot);
  const proposals = analysis.proposals ?? [];
  const approvalRequests = proposals.map((proposal) => createApprovalRequest(proposal));
  const reviewedApprovals = approvalRequests.map((request) =>
    reviewApproval(request, decision, 'simulation-admin'),
  );

  return {
    simulation_only: SIMULATION_ONLY,
    production_write_permitted: false,
    analysis,
    proposals,
    approval_requests: approvalRequests,
    reviewed_approvals: reviewedApprovals,
    execution_count: reviewedApprovals.filter(
      (approval) => approval.execution_permitted === true,
    ).length,
    execution_permitted: false,
  };
}

export function buildSimulationSnapshot() {
  return {
    read_only: true,
    production_write_permitted: false,
    generated_at: new Date().toISOString(),
    orders: {
      total: 3,
      potentially_stuck_over_30m: [
        { id: 101, code: 'SIM-101', status: 'Chờ xác nhận', age_minutes: 42 },
      ],
      by_status: {
        'Chờ xác nhận': 2,
        'Đã giao': 1,
        UNKNOWN: 0,
      },
    },
    shippers: {
      total: 2,
      online: 1,
      with_gps: 1,
    },
    gps_history_rows: 4,
  };
}

export function runSimulationAssertions() {
  const result = simulateAutoFlow(buildSimulationSnapshot(), APPROVAL_STATUS.APPROVED);
  const checks = {
    simulation_only: result.simulation_only === true,
    findings_created: result.analysis.finding_count >= 1,
    proposal_created: result.proposals.length >= 1,
    approval_created: result.approval_requests.length === result.proposals.length,
    approved_in_simulation: result.reviewed_approvals.every(
      (approval) => approval.status === APPROVAL_STATUS.APPROVED,
    ),
    production_execution_blocked: result.execution_permitted === false,
    no_execution_granted: result.execution_count === 0,
  };

  return {
    passed: Object.values(checks).every(Boolean),
    checks,
    result,
  };
}
