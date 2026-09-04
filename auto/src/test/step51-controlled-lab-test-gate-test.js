import { evaluateControlledLabGate, controlledLabGateSafetyCheck, GATE_MODE } from '../gates/step51-controlled-lab-test-gate.js';

const result = evaluateControlledLabGate({
  foundationComplete: true,
  safety: {
    production_read_permitted: false,
    production_write_permitted: false,
    execution_permitted: false,
    push_or_onesignal_permitted: false,
    ai_agent_production_access_permitted: false,
    automatic_action: false,
  },
});

const checks = {
  mode_correct: result.mode === GATE_MODE,
  lab_only: result.lab_only === true,
  foundation_complete: result.foundation_complete === true,
  gate_open: result.gate_open === true,
  production_read_locked: result.production_read_permitted === false,
  production_write_locked: result.production_write_permitted === false,
  execution_locked: result.execution_permitted === false,
  push_locked: result.push_or_onesignal_permitted === false,
  ai_agent_production_locked: result.ai_agent_production_access_permitted === false,
  automatic_action_locked: result.automatic_action === false,
  safety_check_passes: controlledLabGateSafetyCheck(result) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_51_CONTROLLED_LAB_TEST_GATE',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_read_permitted: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  ai_agent_production_access_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
