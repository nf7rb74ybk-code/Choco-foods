import {
  createLabReadOnlySnapshot,
  readOnlyAdapterSafetyCheck,
  ADAPTER_MODE,
} from '../adapters/lab-read-only-data-adapter.js';

const snapshot = createLabReadOnlySnapshot({
  source: 'LAB_FIXTURE',
  records: [
    { id: 'LAB-ORDER-052', status: 'Chờ xác nhận' },
    { id: 'LAB-SHIPPER-052', online: true },
  ],
});

const checks = {
  mode_correct: snapshot.mode === ADAPTER_MODE,
  lab_only: snapshot.lab_only === true,
  source_is_lab_fixture: snapshot.source === 'LAB_FIXTURE',
  records_read: snapshot.records.length === 2,
  production_read_locked: snapshot.production_read_permitted === false,
  production_write_locked: snapshot.production_write_permitted === false,
  execution_locked: snapshot.execution_permitted === false,
  push_locked: snapshot.push_or_onesignal_permitted === false,
  automatic_action_locked: snapshot.automatic_action === false,
  safety_check_passes: readOnlyAdapterSafetyCheck(snapshot) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_52_LAB_READ_ONLY_DATA_ADAPTER',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  production_read_permitted: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
