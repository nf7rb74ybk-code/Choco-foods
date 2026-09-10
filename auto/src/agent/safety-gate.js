// CHOCO AUTO LEVEL 5 — Step 2: Independent Planner Safety Gate
// LAB/TEST ONLY. This gate blocks unsafe plans before they reach the simulator.

export const SAFETY_GATE_MODE = 'LAB_SAFETY_GATE_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const ALLOWED_ACTIONS = new Set([
  'READ_SNAPSHOT',
  'VALIDATE_TARGET',
  'ASSIGN_SHIPPER',
  'SEND_ALERT',
  'REMIND_STUCK_ORDER',
  'GENERATE_REPORT',
  'VERIFY_SIMULATION',
  'AUDIT_PLAN',
]);

const REQUIRED_ACTIONS = Object.freeze([
  'READ_SNAPSHOT',
  'VALIDATE_TARGET',
  'VERIFY_SIMULATION',
  'AUDIT_PLAN',
]);

function fail(checks, reason) {
  checks.push({ name: reason, passed: false });
}

export function evaluatePlanSafety(plan) {
  const checks = [];

  if (!plan || typeof plan !== 'object') {
    return {
      allowed: false,
      mode: SAFETY_GATE_MODE,
      reason: 'PLAN_REQUIRED',
      checks: [{ name: 'plan_object', passed: false }],
    };
  }

  checks.push({ name: 'planner_mode', passed: plan.planner_mode === 'LAB_PLANNER_ONLY' });
  checks.push({ name: 'non_executable', passed: plan.executable === false });
  checks.push({ name: 'no_production_write', passed: plan.production_write === false });
  checks.push({ name: 'no_push', passed: plan.push_sent === false });
  checks.push({ name: 'no_database_mutation', passed: plan.database_mutation === false });
  checks.push({ name: 'steps_array', passed: Array.isArray(plan.steps) });

  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  const actions = steps.map((step) => step?.action);
  const unknownAction = actions.find((action) => !ALLOWED_ACTIONS.has(action));

  checks.push({ name: 'actions_allowlisted', passed: unknownAction === undefined, detail: unknownAction ?? null });

  for (const requiredAction of REQUIRED_ACTIONS) {
    checks.push({
      name: `required_${requiredAction.toLowerCase()}`,
      passed: actions.includes(requiredAction),
    });
  }

  const simulationStepsSafe = steps
    .filter((step) => ['ASSIGN_SHIPPER', 'SEND_ALERT', 'REMIND_STUCK_ORDER', 'GENERATE_REPORT'].includes(step?.action))
    .every((step) => step?.mode === 'SIMULATION_ONLY');
  checks.push({ name: 'simulation_actions_only', passed: simulationStepsSafe });

  const hardBlock =
    plan.planner_mode !== 'LAB_PLANNER_ONLY' ||
    plan.executable !== false ||
    plan.production_write !== false ||
    plan.push_sent !== false ||
    plan.database_mutation !== false ||
    !Array.isArray(plan.steps) ||
    unknownAction !== undefined ||
    !REQUIRED_ACTIONS.every((action) => actions.includes(action)) ||
    !simulationStepsSafe;

  if (hardBlock) {
    fail(checks, 'hard_safety_block');
  } else {
    checks.push({ name: 'hard_safety_block', passed: true });
  }

  const allowed = !hardBlock;

  return Object.freeze({
    allowed,
    mode: SAFETY_GATE_MODE,
    reason: allowed ? 'PLAN_SAFE_FOR_LAB_SIMULATION' : 'PLAN_BLOCKED_BY_SAFETY_GATE',
    risk: plan.risk ?? 'UNKNOWN',
    requires_approval: plan.requires_approval === true,
    plan_id: plan.plan_id ?? null,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    database_mutation_permitted: false,
    checks: Object.freeze(checks),
  });
}

export function assertSafePlan(plan) {
  const result = evaluatePlanSafety(plan);
  if (!result.allowed) {
    throw new Error(`CHOCO AUTO SAFETY GATE BLOCKED: ${result.reason}`);
  }
  return result;
}

export function safetyGateAllowsSimulation(plan) {
  return evaluatePlanSafety(plan).allowed === true;
}
