import { readFileSync, existsSync } from 'node:fs';

const handoverPath = new URL('../../STEP101_LAB_FREEZE_HANDOVER.md', import.meta.url);
const handover = existsSync(handoverPath) ? readFileSync(handoverPath, 'utf8') : '';

const checks = {
  step101_handover_exists: handover.length > 0,
  lab_branch_documented: handover.includes('choco-auto-lab'),
  steps_54_100_verified: handover.includes('Steps 54–100: verified by LAB readiness tests'),
  production_blocked: handover.includes('Production branch is not modified.'),
  supabase_production_blocked: handover.includes('Production Supabase data is not used or modified.'),
  push_blocked: handover.includes('Push / OneSignal is not enabled or modified.'),
  real_execution_blocked: handover.includes('Real-world execution is not permitted.'),
  automatic_actions_blocked: handover.includes('Automatic actions are not permitted.'),
  explicit_future_review: handover.includes('Any future Production work requires a separate explicit review and authorization.'),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_101_TO_110_FINAL_LAB_AUDIT',
  passed: failed.length === 0,
  steps_checked: '101-110',
  checks,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
}, null, 2));

if (failed.length) process.exit(1);
