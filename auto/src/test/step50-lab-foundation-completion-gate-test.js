import { evaluateFoundationCompletion, foundationCompletionSafetyCheck, FOUNDATION_MODE, FOUNDATION_STEPS } from '../foundation/lab-foundation-completion-gate.js';

const completedSteps = Array.from({ length: FOUNDATION_STEPS }, (_, i) => i + 1);
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
  all_50_steps_present: result.completed_steps === 50,
  required_steps_correct: result.required_steps === 50,
  no_missing_steps: Array.isArray(result.missing_steps) && result.missing_steps.length === 0,
  foundation_complete: result.complete === true,
  production_access_locked: result.production_access_permitted === false,
  production_write_locked: result.production_write_permitted === false,
  execution_locked: result.execution_permitted === false,
  automatic_action_locked: result.automatic_action === false,
  safety_check_passes: foundationCompletionSafetyCheck(result) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_50_LAB_FOUNDATION_COMPLETION_GATE',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  next_phase: 'CONTROLLED_TESTING_ONLY',
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
