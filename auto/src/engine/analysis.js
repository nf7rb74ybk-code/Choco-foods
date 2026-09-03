// CHOCO AUTO LAB — analysis engine
// Step 14: READ-ONLY analysis / proposal layer.
// This module never writes to Supabase, never calls RPC/Edge Functions,
// and never sends Push. It converts an observation snapshot into findings
// that an admin can review before any future action is considered.

const SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
});

function finding(id, severity, type, message, evidence = {}) {
  return Object.freeze({
    id,
    severity,
    type,
    message,
    evidence,
    recommendation: 'ADMIN_REVIEW_REQUIRED',
    action_permitted: false,
  });
}

/**
 * Analyze the Step 13 observation snapshot.
 *
 * Input is the object returned by buildSnapshot/readSnapshot.
 * Output contains findings and review-only proposals.
 * No production mutation is possible from this module.
 */
export function analyzeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('A CHOCO AUTO observation snapshot is required');
  }

  const findings = [];
  const orders = snapshot.orders ?? {};
  const shippers = snapshot.shippers ?? {};
  const byStatus = orders.by_status ?? {};
  const stuck = orders.potentially_stuck_over_30m ?? [];

  if (snapshot.read_only !== true || snapshot.production_write_permitted !== false) {
    throw new Error('Unsafe snapshot: CHOCO AUTO requires read_only=true and production_write_permitted=false');
  }

  if (stuck.length > 0) {
    findings.push(finding(
      'ORDER_STUCK_30M',
      SEVERITY.WARNING,
      'stuck_orders',
      `${stuck.length} order(s) have remained active for at least 30 minutes.`,
      { count: stuck.length, orders: stuck },
    ));
  }

  if (shippers.online > 0 && shippers.with_gps < shippers.online) {
    findings.push(finding(
      'SHIPPER_GPS_GAP',
      SEVERITY.WARNING,
      'shipper_gps',
      'Some online shippers do not currently have usable GPS coordinates.',
      { online: shippers.online, with_gps: shippers.with_gps },
    ));
  }

  if (orders.total > 0 && shippers.online === 0) {
    findings.push(finding(
      'NO_ONLINE_SHIPPER',
      SEVERITY.CRITICAL,
      'capacity',
      'There are orders but no online shipper is currently observed.',
      { orders: orders.total, online_shippers: shippers.online },
    ));
  }

  const unknownStatusCount = Number(byStatus.UNKNOWN ?? 0);
  if (unknownStatusCount > 0) {
    findings.push(finding(
      'UNKNOWN_ORDER_STATUS',
      SEVERITY.WARNING,
      'data_quality',
      `${unknownStatusCount} order(s) have an unknown/missing status.`,
      { count: unknownStatusCount },
    ));
  }

  const proposals = findings.map((item) => ({
    proposal_id: `PROPOSAL_${item.id}`,
    finding_id: item.id,
    mode: 'REVIEW_ONLY',
    action: 'NO_AUTOMATIC_ACTION',
    reason: item.message,
  }));

  return {
    generated_at: snapshot.generated_at ?? new Date().toISOString(),
    read_only: true,
    production_write_permitted: false,
    findings,
    proposals,
    summary: {
      finding_count: findings.length,
      warning_count: findings.filter((x) => x.severity === SEVERITY.WARNING).length,
      critical_count: findings.filter((x) => x.severity === SEVERITY.CRITICAL).length,
      automatic_actions: 0,
    },
  };
}
