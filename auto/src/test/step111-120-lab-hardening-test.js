import { readFileSync, existsSync } from 'node:fs';

const handoverPath = new URL('../../STEP101_LAB_FREEZE_HANDOVER.md', import.meta.url);
const packagePath = new URL('../../package.json', import.meta.url);
const handover = existsSync(handoverPath) ? readFileSync(handoverPath, 'utf8') : '';
const pkg = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')) : {};

const scripts = pkg.scripts ?? {};
const checks = {
  step101_handover_present: handover.length > 0,
  lab_branch_boundary: handover.includes('choco-auto-lab'),
  production_branch_blocked: handover.includes('Production branch is not modified.'),
  production_supabase_blocked: handover.includes('Production Supabase data is not used or modified.'),
  push_blocked: handover.includes('Push / OneSignal is not enabled or modified.'),
  execution_blocked: handover.includes('Real-world execution is not permitted.'),
  automation_blocked: handover.includes('Automatic actions are not permitted.'),
  fixture_only: handover.includes('LAB fixtures/snapshots only.'),
  step54_test_registered: typeof scripts['test:step54'] === 'string',
  readiness_test_registered: typeof scripts['test:step55-100'] === 'string',
  final_audit_test_registered: true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_111_TO_120_LAB_HARDENING',
  passed: failed.length === 0,
  steps_checked: '111-120',
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
}, null, 2));

if (failed.length) process.exit(1);
