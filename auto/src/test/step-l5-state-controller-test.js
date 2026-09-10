// CHOCO AUTO LEVEL 5 — Step 5 test
// Verifies in-memory state tracking and safety invariants.

import { buildPlan, createTask } from '../agent/task-planner.js';
import { createApprovalRequest } from '../agent/approval-controller.js';
import { createStateStore, createTaskState, stateSafetyCheck } from '../agent/state-controller.js';

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const task = createTask({ type: 'ASSIGN_SHIPPER', target: 'order-test-004' });
const plan = buildPlan(task);
const approval = createApprovalRequest(plan);
const state = createTaskState({ task, plan, approval });

assert(state.mode === 'LAB_STATE_CONTROLLER_ONLY', 'state stays in LAB mode');
assert(state.approval_status === 'PENDING_APPROVAL', 'approval state is tracked');
assert(state.production_write === false, 'state cannot enable production write');
assert(state.database_mutation === false, 'state cannot mutate database');
assert(state.push_sent === false, 'state cannot send push');
assert(state.executed === false, 'state cannot mark production execution');
assert(stateSafetyCheck(state) === true, 'state passes safety check');

const store = createStateStore();
const saved = store.set(state.state_id, state);
assert(store.get(state.state_id)?.state_id === saved.state_id, 'state can be retrieved');
assert(store.snapshot().length === 1, 'store snapshot contains one state');
assert(store.remove(state.state_id) === true, 'state can be removed from lab store');
assert(store.get(state.state_id) === null, 'removed state is absent');

console.log('PASS: CHOCO AUTO LEVEL 5 STEP 5 — STATE CONTROLLER');
console.log('STATE=IN_MEMORY_LAB_ONLY');
console.log('DATABASE_MUTATION=false');
console.log('PUSH_SENT=false');
console.log('PRODUCTION_EXECUTION=false');
