import { readFileSync, existsSync } from 'node:fs';

const root = '../../';
const handoverPath = new URL(`${root}STEP101_LAB_FREEZE_HANDOVER.md`, import.meta.url);
const packagePath = new URL(`${root}package.json`, import.meta.url);
const previousGatePath = new URL('./step141-150-lab-safety-acceptance-test.js', import.meta.url);

const read = (url) => existsSync(url) ? readFileSync(url, 'utf8') : '';
const handover = read(handoverPath);
const previousGate = read(previousGatePath);
const pkg = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')) : {};
const scripts = pkg.scripts ?? {};

const checks = {
  handover_present: handover.length > 0,
  lab_branch_boundary: handover.includes('choco-auto-lab'),
  production_branch_blocked: handover.includes('Production branch is not modified.'),
  production_supabase_blocked: handover.includes('Production Supabase data is not used or modified.'),
  push_blocked: handover.includes('Push / OneSignal is not enabled or modified.'),
  real_execution_blocked: handover.includes('Real-world execution is not permitted.'),
  automatic_actions_blocked: handover.includes('Automatic actions are not permitted.'),
  fixture_only: handover.includes('LAB fixtures/snapshots only.'),
  previous_safety_gate_present: previousGate.includes('CHOCO_AUTO_STEP_141_TO_150_LAB_SAFETY_ACCEPTANCE'),
  previous_gate_is_lab_only: previousGate.includes('lab_only: true'),
  previous_gate_blocks_production: previousGate.includes('production_write_permitted: false'),
  package_name_present: pkg.name === 'choco-auto-lab',
  step151_160_script_registered: typeof scripts['test:step151-160'] === 'string',
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_151_TO_160_LAB_RELEASE_READINESS',
  passed: failed.length === 0,
  steps_checked: '151-160',
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
}, null, 2));

if (failed.length) process.exit(1);
