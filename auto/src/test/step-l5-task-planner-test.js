// CHOCO AUTO LEVEL 5 — Step 1 test
// Verifies planning only. No Production writes, DB mutations, or Push.

import {
  buildPlan,
  createTask,
  getSupportedTaskTypes,
  plannerSafetyCheck,
} from '../agent/task-planner.js';

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const supported = getSupportedTaskTypes();
assert(supported.includes('ASSIGN_SHIPPER'), 'ASSIGN_SHIPPER task is supported');
assert(supported.includes('SEND_ALERT'), 'SEND_ALERT task is supported');
assert(supported.includes('REMIND_STUCK_ORDER'), 'REMIND_STUCK_ORDER task is supported');
assert(supported.includes('GENERATE_REPORT'), 'GENERATE_REPORT task is supported');

const task = createTask({
  type: 'REMIND_STUCK_ORDER',
  target: 'order-test-001',
  context: { age_minutes: 45, status: 'Đang lấy hàng' },
});

assert(task.planner_mode === 'LAB_PLANNER_ONLY', 'task stays in LAB planner mode');
assert(task.production_write_permitted === false, 'task cannot write Production');
assert(task.push_or_onesignal_permitted === false, 'task cannot send Push/OneSignal');

const plan = buildPlan(task);
assert(plannerSafetyCheck(plan), 'planner safety gate passes');
assert(plan.executable === false, 'plan is not executable');
assert(plan.production_write === false, 'plan cannot write Production');
assert(plan.push_sent === false, 'plan cannot send Push');
assert(plan.database_mutation === false, 'plan cannot mutate database');
assert(plan.steps[0].action === 'READ_SNAPSHOT', 'plan starts with read-only snapshot');
assert(plan.steps.at(-1).action === 'AUDIT_PLAN', 'plan ends with audit');
assert(plan.steps.some((step) => step.action === 'REMIND_STUCK_ORDER'), 'requested action is planned');

console.log('PASS: CHOCO AUTO LEVEL 5 STEP 1 — TASK + PLANNER CORE');
console.log(`PLAN=${plan.plan_id}`);
console.log(`STEPS=${plan.steps.length}`);
console.log('PRODUCTION_WRITE=false');
console.log('PUSH_SENT=false');
console.log('DATABASE_MUTATION=false');
