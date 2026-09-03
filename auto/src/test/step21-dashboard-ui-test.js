import fs from 'node:fs';

const file = './src/dashboard/operations-dashboard.html';
const html = fs.readFileSync(file, 'utf8');

const checks = {
  html_exists: html.length > 500,
  lab_review_only: html.includes('LAB / REVIEW ONLY'),
  production_write_blocked: html.includes('PRODUCTION WRITE: BLOCKED'),
  no_order_mutation_code: !/\.(insert|update|upsert|delete)\s*\(/.test(html),
  no_push_code: !/OneSignal|send-push|pushDelivery/i.test(html),
  no_payment_mutation: !/payment\s*=|update.*payment/i.test(html),
  safety_notice_present: html.includes('Không tự động cập nhật orders'),
};

const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  suite: 'CHOCO_AUTO_STEP_21_UI',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
