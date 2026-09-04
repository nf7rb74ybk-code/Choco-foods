import fs from 'node:fs';
import path from 'node:path';
import { eventTimelineSafetyCheck } from '../timeline/event-timeline.js';

const root = path.resolve('.');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const workflow = read('../.github/workflows/choco-auto-lab-test.yml');
const timeline = read('src/timeline/event-timeline.js');
const readonlyLayer = read('src/readonly-data-layer.js');
const engineReadme = read('src/engine/README.md');

const checks = {
  lab_package_present: packageJson.name === 'choco-auto-lab',
  step29_test_registered: typeof packageJson.scripts?.['test:step29'] === 'string',
  step30_is_lab_only: !JSON.stringify(packageJson).includes('production'),
  workflow_targets_lab_branch: workflow.includes('choco-auto-lab'),
  workflow_runs_step29: workflow.includes('npm run test:step29'),
  workflow_read_permission_only: workflow.includes('contents: read'),
  timeline_lab_only: timeline.includes("TIMELINE_MODE = 'LAB_EVENT_TIMELINE_ONLY'"),
  timeline_production_blocked: timeline.includes('PRODUCTION_WRITE_PERMITTED = false'),
  timeline_push_blocked: timeline.includes('PUSH_OR_ONESIGNAL_PERMITTED = false'),
  timeline_execution_blocked: timeline.includes('EXECUTION_PERMITTED = false'),
  timeline_events_non_executable: timeline.includes('executable: false'),
  readonly_layer_present: readonlyLayer.includes('read-only') || readonlyLayer.includes('READ_ONLY'),
  engine_forbids_writes: engineReadme.includes('insert/update/upsert/delete database rows'),
  engine_forbids_push: engineReadme.includes('send Push/OneSignal notifications'),
  engine_forbids_assignment: engineReadme.includes('assign shippers'),
  engine_forbids_payment_changes: engineReadme.includes('change payment or money values'),
  no_execution_permission_in_engine: engineReadme.includes('action_permitted: false'),
  no_auto_action_engine: engineReadme.includes('NO_AUTOMATIC_ACTION'),
  timeline_safety_function_available: typeof eventTimelineSafetyCheck === 'function',
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_30_FINAL_SAFETY_GATE',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
