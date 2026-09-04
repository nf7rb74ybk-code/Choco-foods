import { validateLabSnapshot, snapshotGateSafetyCheck, SNAPSHOT_GATE_MODE } from '../gates/step53-lab-snapshot-validation-gate.js';

const result = validateLabSnapshot({
  source: 'LAB_FIXTURE',
  orders: [],
  profiles: [],
  shipper_gps_history: [],
});

const checks = {
  mode_correct: result.mode === SNAPSHOT_GATE_MODE,
  lab_only: result.lab_only === true,
  valid_shape: result.valid_shape === true,
  gate_open: result.gate_open === true,
  production_data_blocked: result.production_data_allowed === false,
  production_write_blocked: result.production_write_permitted === false,
  execution_blocked: result.execution_permitted === false,
  push_blocked: result.push_or_onesignal_permitted === false,
  automatic_action_blocked: result.automatic_action === false,
  safety_check_passes: snapshotGateSafetyCheck(result) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_53_LAB_SNAPSHOT_VALIDATION_GATE',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
}, null, 2));
if (failed.length) process.exit(1);
