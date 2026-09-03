// CHOCO AUTO LAB — Step 19 Decision Center
// Review-only presentation/controller layer.
// It consumes in-memory analysis/simulation results and never writes to Production.

import { APPROVAL_STATUS, createApprovalRequest, reviewApproval } from '../approval/approval-gate.js';
import { analyzeSnapshot } from '../engine/analysis.js';

export const DECISION_CENTER_MODE = 'REVIEW_ONLY';
export const PRODUCTION_EXECUTION_PERMITTED = false;

function assertSafeAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    throw new TypeError('Decision Center requires an analysis result');
  }
  if (analysis.read_only !== true || analysis.production_write_permitted !== false) {
    throw new Error('Unsafe analysis: Decision Center requires read_only=true and production_write_permitted=false');
  }
}

export function buildDecisionCenter(analysis) {
  assertSafeAnalysis(analysis);

  const findings = analysis.findings ?? [];
  const proposals = analysis.proposals ?? [];

  return Object.freeze({
    mode: DECISION_CENTER_MODE,
    generated_at: analysis.generated_at,
    summary: {
      finding_count: analysis.summary?.finding_count ?? findings.length,
      warning_count: analysis.summary?.warning_count ?? 0,
      critical_count: analysis.summary?.critical_count ?? 0,
      automatic_actions: 0,
    },
    findings: findings.map((item) => ({
      id: item.id,
      severity: item.severity,
      type: item.type,
      message: item.message,
      evidence: item.evidence,
      recommendation: 'ADMIN_REVIEW_REQUIRED',
      action_permitted: false,
    })),
    proposals: proposals.map((proposal) => ({
      ...proposal,
      mode: 'REVIEW_ONLY',
      action: 'NO_AUTOMATIC_ACTION',
      execution_permitted: false,
    })),
    production_write_permitted: false,
    push_or_onesignal_used: false,
  });
}

export function createDecisionRequests(analysis) {
  assertSafeAnalysis(analysis);
  return (analysis.proposals ?? []).map((proposal) => createApprovalRequest(proposal));
}

export function reviewDecision(request, decision, reviewer = 'admin') {
  const reviewed = reviewApproval(request, decision, reviewer);
  return Object.freeze({
    ...reviewed,
    execution_permitted: false,
  });
}

export function buildDecisionCenterFromSnapshot(snapshot) {
  const analysis = analyzeSnapshot(snapshot);
  return {
    center: buildDecisionCenter(analysis),
    analysis,
    approval_requests: createDecisionRequests(analysis),
  };
}

export { APPROVAL_STATUS };
