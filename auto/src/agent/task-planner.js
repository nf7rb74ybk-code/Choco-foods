// CHOCO AUTO LEVEL 5 — Step 1: Agent Task + Planner Core
// LAB/TEST ONLY. This module creates deterministic execution plans but never executes them.

export const PLANNER_MODE = 'LAB_PLANNER_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const TASKS = Object.freeze({
  ASSIGN_SHIPPER: Object.freeze({
    risk: 'HIGH',
    actions: ['ASSIGN_SHIPPER'],
    requires_approval: true,
  }),
  SEND_ALERT: Object.freeze({
    risk: 'MEDIUM',
    actions: ['SEND_ALERT'],
    requires_approval: true,
  }),
  REMIND_STUCK_ORDER: Object.freeze({
    risk: 'MEDIUM',
    actions: ['REMIND_STUCK_ORDER'],
    requires_approval: true,
  }),
  GENERATE_REPORT: Object.freeze({
    risk: 'LOW',
    actions: ['GENERATE_REPORT'],
    requires_approval: false,
  }),
});

function assertTask(task) {
  if (!task || typeof task !== 'object') {
    throw new Error('CHOCO AUTO: task object is required');
  }
  if (typeof task.type !== 'string' || !TASKS[task.type]) {
    throw new Error(`CHOCO AUTO: unsupported task type: ${task.type ?? 'unknown'}`);
  }
}

export function createTask({ type, target = null, context = {}, requestedBy = 'CHOCO_AI' } = {}) {
  const task = { type, target, context, requestedBy };
  assertTask(task);

  return Object.freeze({
    ...task,
    planner_mode: PLANNER_MODE,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
  });
}

export function buildPlan(task) {
  assertTask(task);
  const definition = TASKS[task.type];

  const steps = [
    { order: 1, action: 'READ_SNAPSHOT', mode: 'READ_ONLY' },
    { order: 2, action: 'VALIDATE_TARGET', mode: 'LAB_ONLY' },
    ...definition.actions.map((action, index) => ({
      order: index + 3,
      action,
      mode: 'SIMULATION_ONLY',
    })),
    { order: definition.actions.length + 3, action: 'VERIFY_SIMULATION', mode: 'LAB_ONLY' },
    { order: definition.actions.length + 4, action: 'AUDIT_PLAN', mode: 'LAB_ONLY' },
  ];

  return Object.freeze({
    plan_id: `LAB-${task.type}-${Date.now()}`,
    planner_mode: PLANNER_MODE,
    task,
    risk: definition.risk,
    requires_approval: definition.requires_approval,
    executable: false,
    production_write: false,
    push_sent: false,
    database_mutation: false,
    steps: Object.freeze(steps),
  });
}

export function plannerSafetyCheck(plan) {
  return Boolean(
    plan &&
    plan.planner_mode === PLANNER_MODE &&
    plan.executable === false &&
    plan.production_write === false &&
    plan.push_sent === false &&
    plan.database_mutation === false &&
    Array.isArray(plan.steps) &&
    plan.steps.length >= 4
  );
}

export function getSupportedTaskTypes() {
  return Object.freeze(Object.keys(TASKS));
}
