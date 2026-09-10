// CHOCO AUTO LEVEL 5 — Step 10: Task / State Identity & Lifecycle
// LAB/TEST ONLY. In-memory state only. Never writes Supabase/Production.
export const STATE_CONTROLLER_MODE = 'LAB_STATE_CONTROLLER_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

function requireRecord(record) {
  if (!record || typeof record !== 'object') throw new Error('CHOCO AUTO STATE: record object is required');
}

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createStateStore() {
  const records = new Map();
  const set = (id, value) => {
    if (!id) throw new Error('CHOCO AUTO STATE: state id is required');
    requireRecord(value);
    const stored = Object.freeze({ ...value, state_id: String(id) });
    records.set(String(id), stored);
    return stored;
  };
  return Object.freeze({
    set,
    get: (id) => records.get(String(id)) ?? null,
    remove: (id) => records.delete(String(id)),
    clear: () => records.clear(),
    snapshot: () => Object.freeze(Array.from(records.values())),
  });
}

export function createTaskIdentity(task = {}) {
  return Object.freeze({
    task_id: task.task_id ?? uniqueId('TASK'),
    lifecycle_status: task.lifecycle_status ?? 'CREATED',
    created_at: task.created_at ?? new Date().toISOString(),
  });
}

export function createTaskState({ task, plan, approval, simulations = [], lifecycleStatus = null } = {}) {
  if (!task || !plan || !approval) throw new Error('CHOCO AUTO STATE: task, plan and approval are required');
  const identity = createTaskIdentity(task);
  return Object.freeze({
    state_id: `LAB-STATE-${plan.plan_id ?? uniqueId('PLAN')}`,
    mode: STATE_CONTROLLER_MODE,
    task_id: identity.task_id,
    plan_id: plan.plan_id ?? null,
    approval_id: approval.approval_id ?? null,
    lifecycle_status: lifecycleStatus ?? (approval.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : simulations.length ? 'SIMULATED' : 'PLANNED'),
    approval_status: approval.status ?? null,
    simulation_count: Array.isArray(simulations) ? simulations.length : 0,
    created_at: identity.created_at,
    updated_at: new Date().toISOString(),
    production_write: false,
    database_mutation: false,
    push_sent: false,
    executed: false,
  });
}

export function stateSafetyCheck(state) {
  return Boolean(state && state.mode === STATE_CONTROLLER_MODE && state.state_id && state.task_id && state.plan_id && state.approval_id && state.production_write === false && state.database_mutation === false && state.push_sent === false && state.executed === false);
}
