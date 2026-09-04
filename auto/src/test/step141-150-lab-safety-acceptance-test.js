import { readFileSync, existsSync } from 'node:fs';

const root = '../../';
const handoverPath = new URL(`${root}STEP101_LAB_FREEZE_HANDOVER.md`, import.meta.url);
const packagePath = new URL(`${root}package.json`, import.meta.url);
const test54Path = new URL('./step54-lab-snapshot-integrity-provenance-gate-test.js', import.meta.url);
const test55Path = new URL('./step55-100-lab-readiness-gates-test.js', import.meta.url);
const test111Path = new URL('./step111-120-lab-hardening-test.js', import.meta.url);
const test121Path = new URL('./step121-130-lab-regression-hardening-test.js', import.meta.url);
const test131Path = new URL('./step131-140-lab-continuity-gate-test.js', import.meta.url);
const workflow131Path = new URL('../../../.github/workflows/choco-auto-lab-131-140.yml', import.meta.url);

const read = (url) => existsSync(url) ? readFileSync(url, 'utf8') : '';
const handover = read(handoverPath);
const pkg = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')) : {};
const test54 = read(test54Path);
const test55 = read(test55Path);
const test111 = read(test111Path);
const test121 = read(test121Path);
const test131 = read(test131Path);
const workflow131 = read(workflow131Path);
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
  step54_gate_present: test54.includes('CHOCO_AUTO_STEP_54_LAB_SNAPSHOT_INTEGRITY_PROVENANCE_GATE'),
  step55_100_gate_present: test55.includes('CHOCO_AUTO_STEP_55_TO_100_LAB_READINESS_GATES'),
  step111_120_gate_present: test111.includes('CHOCO_AUTO_STEP_111_TO_120_LAB_HARDENING'),
  step121_130_gate_present: test121.includes('CHOCO_AUTO_STEP_121_TO_130_LAB_REGRESSION_HARDENING'),
  step131_140_gate_present: test131.includes('CHOCO_AUTO_STEP_131_TO_140_LAB_CONTINUITY_GATE'),
  step131_140_workflow_present: workflow131.includes('choco-auto-lab'),
  step141_150_script_registered: typeof scripts['test:step141-150'] === 'string',
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_141_TO_150_LAB_SAFETY_ACCEPTANCE',
  passed: failed.length === 0,
  steps_checked: '141-150',
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
}, null, 2));

if (failed.length) process.exit(1);
