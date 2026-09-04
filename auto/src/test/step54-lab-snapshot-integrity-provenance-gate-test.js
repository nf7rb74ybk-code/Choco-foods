import {
  validateSnapshotProvenance,
  snapshotProvenanceSafetyCheck,
  PROVENANCE_GATE_MODE,
} from '../gates/step54-lab-snapshot-integrity-provenance-gate.js';

const result = validateSnapshotProvenance({
  source: 'LAB_FIXTURE',
  lab_only: true,
  snapshot_id: 'LAB-SNAPSHOT-054',
  captured_at: '2026-09-04T00:00:00.000Z',
  checksum: 'LAB-CHECKSUM-054',
});

const checks = {
  mode_correct: result.mode === PROVENANCE_GATE_MODE,
  lab_only: result.lab_only === true,
  valid_provenance: result.valid_provenance === true,
  gate_open: result.gate_open === true,
  production_data_blocked: result.production_data_allowed === false,
  production_write_blocked: result.production_write_permitted === false,
  execution_blocked: result.execution_permitted === false,
  push_blocked: result.push_or_onesignal_permitted === false,
  automatic_action_blocked: result.automatic_action === false,
  safety_check_passes: snapshotProvenanceSafetyCheck(result) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_54_LAB_SNAPSHOT_INTEGRITY_PROVENANCE_GATE',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
}, null, 2));
if (failed.length) process.exit(1);
