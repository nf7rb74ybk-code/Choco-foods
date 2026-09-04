import {
  LAB_READINESS_STEPS,
  evaluateLabReadinessStep,
  labReadinessSafetyCheck,
} from '../gates/step55-100-lab-readiness-gates.js';

const results = LAB_READINESS_STEPS.map(([step]) =>
  evaluateLabReadinessStep(step, {
    foundation_safe: true,
    controlled_lab: true,
    snapshot_safe: true,
  }),
);

const checks = Object.fromEntries(results.map((result) => [
  `step_${result.step}_safe`, labReadinessSafetyCheck(result),
]));

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_55_TO_100_LAB_READINESS_GATES',
  passed: failed.length === 0,
  steps_checked: results.length,
  first_step: results[0]?.step,
  last_step: results.at(-1)?.step,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
