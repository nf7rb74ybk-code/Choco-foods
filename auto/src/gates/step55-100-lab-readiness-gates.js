export const LAB_ONLY = true;
export const PRODUCTION_DATA_ALLOWED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const EXECUTION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const AUTOMATIC_ACTION = false;

export const LAB_READINESS_STEPS = [
  [55, 'Snapshot Schema Gate'],
  [56, 'Snapshot Source Gate'],
  [57, 'Snapshot Immutability Gate'],
  [58, 'Snapshot Timestamp Gate'],
  [59, 'Snapshot Checksum Gate'],
  [60, 'Snapshot Record Isolation Gate'],
  [61, 'Order Data Isolation Gate'],
  [62, 'Profile Data Isolation Gate'],
  [63, 'GPS Data Isolation Gate'],
  [64, 'Sensitive Data Minimization Gate'],
  [65, 'Proposal Input Gate'],
  [66, 'Proposal Scope Gate'],
  [67, 'Proposal Safety Gate'],
  [68, 'Recommendation Boundary Gate'],
  [69, 'Anomaly Boundary Gate'],
  [70, 'Report Boundary Gate'],
  [71, 'Alert Boundary Gate'],
  [72, 'Timeline Boundary Gate'],
  [73, 'Queue Boundary Gate'],
  [74, 'Execution Simulation Gate'],
  [75, 'Execution Deny Gate'],
  [76, 'Production Write Deny Gate'],
  [77, 'Production Read Lock Gate'],
  [78, 'Push Lock Gate'],
  [79, 'OneSignal Lock Gate'],
  [80, 'Automatic Action Lock Gate'],
  [81, 'AI Agent Production Lock Gate'],
  [82, 'Admin Approval Boundary Gate'],
  [83, 'Approval Record Integrity Gate'],
  [84, 'Audit Trace Integrity Gate'],
  [85, 'Export Boundary Gate'],
  [86, 'Export Approval Boundary Gate'],
  [87, 'Manifest Integrity Gate'],
  [88, 'Ledger Integrity Gate'],
  [89, 'History Consistency Gate'],
  [90, 'Replay Safety Gate'],
  [91, 'Idempotency Gate'],
  [92, 'Failure Containment Gate'],
  [93, 'Error Reporting Gate'],
  [94, 'System Health Boundary Gate'],
  [95, 'Monitoring Boundary Gate'],
  [96, 'Rollback Boundary Gate'],
  [97, 'Release Boundary Gate'],
  [98, 'Production Promotion Deny Gate'],
  [99, 'Final LAB Safety Gate'],
  [100, 'CHOCO AUTO LAB Completion Gate'],
];

export function evaluateLabReadinessStep(step, context = {}) {
  const known = LAB_READINESS_STEPS.find(([number]) => number === step);
  if (!known) throw new Error(`Unknown LAB readiness step: ${step}`);

  const foundationSafe = context.foundation_safe !== false;
  const controlledLab = context.controlled_lab !== false;
  const snapshotSafe = context.snapshot_safe !== false;
  const safe = foundationSafe && controlledLab && snapshotSafe;

  return {
    step,
    name: known[1],
    lab_only: LAB_ONLY,
    production_data_allowed: PRODUCTION_DATA_ALLOWED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    automatic_action: AUTOMATIC_ACTION,
    ai_agent_production_access_permitted: false,
    safe,
    gate_open: safe,
  };
}

export function labReadinessSafetyCheck(result) {
  return Boolean(
    result?.lab_only === true &&
    result?.production_data_allowed === false &&
    result?.production_write_permitted === false &&
    result?.execution_permitted === false &&
    result?.push_or_onesignal_permitted === false &&
    result?.automatic_action === false &&
    result?.ai_agent_production_access_permitted === false &&
    result?.safe === true &&
    result?.gate_open === true
  );
}
