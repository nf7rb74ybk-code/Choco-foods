import { readFileSync, existsSync } from 'node:fs';

const handoverPath = new URL('../../STEP101_LAB_FREEZE_HANDOVER.md', import.meta.url);
const packagePath = new URL('../../package.json', import.meta.url);
const test111Path = new URL('./step111-120-lab-hardening-test.js', import.meta.url);
const readmePath = new URL('../README.md', import.meta.url);

const handover = existsSync(handoverPath) ? readFileSync(handoverPath, 'utf8') : '';
const pkg = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')) : {};
const test111 = existsSync(test111Path) ? readFileSync(test111Path, 'utf8') : '';
const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '';
const scripts = pkg.scripts ?? {};

const checks = {
  handover_present: handover.length > 0,
  lab_branch_boundary: handover.includes('choco-auto-lab'),
  lab_fixture_only: handover.includes('LAB fixtures/snapshots only.'),
  production_branch_blocked: handover.includes('Production branch is not modified.'),
  production_supabase_blocked: handover.includes('Production Supabase data is not used or modified.'),
  push_blocked: handover.includes('Push / OneSignal is not enabled or modified.'),
  real_execution_blocked: handover.includes('Real-world execution is not permitted.'),
  automatic_actions_blocked: handover.includes('Automatic actions are not permitted.'),
  step111_120_hardening_present: test111.length > 0,
  step111_120_hardening_suite_present: test111.includes('CHOCO_AUTO_STEP_111_TO_120_LAB_HARDENING'),
  package_json_present: existsSync(packagePath),
  package_name_present: typeof pkg.name === 'string' && pkg.name.length > 0,
  readme_present: readme.length > 0,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_121_TO_130_LAB_REGRESSION_HARDENING',
  passed: failed.length === 0,
  steps_checked: '121-130',
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
}, null, 2));

if (failed.length) process.exit(1);
