import fs from 'node:fs';

const file = './src/alerts/alert-center.html';
const html = fs.readFileSync(file, 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1] ?? '';

const checks = {
  html_exists: html.length > 1000,
  step28_label: html.includes('Step 28'),
  lab_review_only: html.includes('LAB / REVIEW ONLY'),
  production_write_blocked: html.includes('PRODUCTION WRITE: BLOCKED'),
  critical_visible: html.includes('Critical'),
  warning_visible: html.includes('Warning'),
  review_visible: html.includes('Cần review'),
  report_link_visible: html.includes('Daily Report'),
  health_link_visible: html.includes('System Health'),
  synthetic_state_present: script.includes('Synthetic LAB state only'),
  no_network_code: !/fetch\s*\(|XMLHttpRequest|WebSocket/i.test(script),
  no_order_mutation_code: !/\.(insert|update|upsert|delete)\s*\(/.test(script),
  no_push_code: !/\bOneSignal\s*\.|send-push|pushDelivery/i.test(script),
  no_payment_mutation: !/payment\s*=|update.*payment/i.test(script),
  execution_blocked: script.includes('execution_permitted:false'),
  automatic_actions_zero: script.includes('automatic_actions:0'),
  safety_notice_present: html.includes('Không cập nhật orders') && html.includes('không gửi Push/OneSignal'),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const output = {
  suite: 'CHOCO_AUTO_STEP_28_UI',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(output, null, 2));
if (failed.length) process.exit(1);
