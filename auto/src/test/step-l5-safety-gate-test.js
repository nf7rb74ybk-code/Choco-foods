// CHOCO AUTO LEVEL 5 — Step 2 test
// Verifies the independent safety gate blocks unsafe plans before simulation.

import { buildPlan, createTask } from '../agent/task-planner.js';
import {
  assertSafePlan,
  evaluatePlanSafety,
  safetyGateAllowsSimulation,
} from '../agent/safety-gate.js';

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const task = createTask({
  type: 'REMIND_STUCK_ORDER',
  target: 'order-test-002',
  context: { age_minutes: 60, status: 'Đang lấy hàng' },
});

const safePlan = buildPlan(task);
const safeResult = evaluatePlanSafety(safePlan);

assert(safeResult.allowed === true, 'valid LAB plan passes safety gate');
assert(safeResult.reason === 'PLAN_SAFE_FOR_LAB_SIMULATION', 'safe reason is explicit');
assert(safeResult.production_write_permitted === false, 'production write stays disabled');
assert(safeResult.push_or_onesignal_permitted === false, 'Push/OneSignal stays disabled');
assert(safeResult.database_mutation_permitted === false, 'database mutation stays disabled');
assert(safetyGateAllowsSimulation(safePlan) === true, 'safe plan may enter LAB simulation');
assert(assertSafePlan(safePlan).allowed === true, 'assertSafePlan accepts safe plan');

const unsafePlan = {
  ...safePlan,
  executable: true,
};
const unsafeResult = evaluatePlanSafety(unsafePlan);
assert(unsafeResult.allowed === false, 'executable plan is blocked');
assert(safetyGateAllowsSimulation(unsafePlan) === false, 'blocked plan cannot enter simulation');

const productionWritePlan = {
  ...safePlan,
  production_write: true,
};
assert(evaluatePlanSafety(productionWritePlan).allowed === false, 'production-write plan is blocked');

const pushPlan = {
  ...safePlan,
  push_sent: true,
};
assert(evaluatePlanSafety(pushPlan).allowed === false, 'Push plan is blocked');

const mutationPlan = {
  ...safePlan,
  database_mutation: true,
};
assert(evaluatePlanSafety(mutationPlan).allowed === false, 'database mutation plan is blocked');

const unknownActionPlan = {
  ...safePlan,
  steps: [...safePlan.steps, { order: 99, action: 'DELETE_PRODUCTION_DATA', mode: 'SIMULATION_ONLY' }],
};
assert(evaluatePlanSafety(unknownActionPlan).allowed === false, 'unknown destructive action is blocked');

const missingReadPlan = {
  ...safePlan,
  steps: safePlan.steps.filter((step) => step.action !== 'READ_SNAPSHOT'),
};
assert(evaluatePlanSafety(missingReadPlan).allowed === false, 'plan without initial read snapshot is blocked');

let threw = false;
try {
  assertSafePlan(unsafePlan);
} catch (error) {
  threw = true;
}
assert(threw, 'assertSafePlan throws for blocked plan');

console.log('PASS: CHOCO AUTO LEVEL 5 STEP 2 — INDEPENDENT SAFETY GATE');
console.log(`SAFE_PLAN=${safePlan.plan_id}`);
console.log('SAFE_PLAN_ALLOWED=true');
console.log('UNSAFE_PLAN_BLOCKED=true');
console.log('PRODUCTION_WRITE=false');
console.log('PUSH_SENT=false');
console.log('DATABASE_MUTATION=false');
