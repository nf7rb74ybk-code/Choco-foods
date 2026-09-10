// CHOCO AUTO LEVEL 5 — Step 5: State Controller
// LAB/TEST ONLY. In-memory state only. Never writes Supabase/Production.

export const STATE_CONTROLLER_MODE = 'LAB_STATE_CONTROLLER_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

function requireRecord(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('CHOCO AUTO STATE: record object is required');
  }
}

export function createStateStore() {
  const records = new Map();

  function set(id, value) {
    if (!id) throw new Error('CHOCO AUTO STATE: state id is required');
    requireRecord(value);
    const stored = Object.freeze({ ...value, state_id: String(id) });
    records.set(String(id), stored);
    return stored;
  }

  function get(id) {
    return records.get(String(id)) ?? null;
  }

  function remove(id) {
    return records.delete(String(id));
  }

  function clear() {
    records.clear();
  }

  function snapshot() {
    return Object.freeze(Array.from(records.values()));
  }

  return Object.freeze({ set, get, remove, clear, snapshot });
}

export function createTaskState({ task, plan, approval, simulations = [] } = {}) {
  if (!task || !plan || !approval) {
    throw new Error('CHOCO AUTO STATE: task, plan and approval are required');
  }

  return Object.freeze({
    state_id: `LAB-STATE-${plan.plan_id ?? Date.now()}`,
    mode: STATE_CONTROLLER_MODE,
    task_id: task.type ?? null,
    plan_id: plan.plan_id ?? null,
    approval_id: approval.approval_id ?? null,
    approval_status: approval.status ?? null,
    simulation_count: Array.isArray(simulations) ? simulations.length : 0,
    production_write: false,
    database_mutation: false,
    push_sent: false,
    executed: false,
    updated_at: new Date().toISOString(),
  });
}

export function stateSafetyCheck(state) {
  return Boolean(
    state &&
    state.mode === STATE_CONTROLLER_MODE &&
    state.state_id &&
    state.plan_id &&
    state.approval_id &&
    state.production_write === false &&
    state.database_mutation === false &&
    state.push_sent === false &&
    state.executed === false
  );
}
