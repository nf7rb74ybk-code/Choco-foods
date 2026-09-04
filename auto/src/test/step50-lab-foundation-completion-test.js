import { evaluateFoundationCompletion, foundationCompletionSafetyCheck, FOUNDATION_MODE } from '../foundation/lab-foundation-completion-gate.js';

const completedSteps = Array.from({ length: 50 }, (_, i) => i + 1);
const result = evaluateFoundationCompletion({
  completedSteps,
  safety: {
    production_access_permitted: false,
    production_write_permitted: false,
    execution_permitted: false,
    automatic_action: false,
  },
});

const checks = {
  mode_correct: result.mode === FOUNDATION_MODE,
  foundation_complete: result.complete === true,
  all_50_steps_completed: result.completed_steps === 50,
  required_steps_correct: result.required_steps === 50,
  no_missing_steps: result.missing_steps.length === 0,
  production_access_locked: result.production_access_permitted === false,
  production_write_locked: result.production_write_permitted === false,
  execution_locked: result.execution_permitted === false,
  automatic_action_locked: result.automatic_action === false,
  safety_check_passes: foundationCompletionSafetyCheck(result) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_50_LAB_FOUNDATION_COMPLETION',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
