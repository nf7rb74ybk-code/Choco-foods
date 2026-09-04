import { buildEventTimeline, eventTimelineSafetyCheck } from '../timeline/event-timeline.js';

const order = { id: 101, code: 'LAB-001', status: 'Chờ xác nhận', created_at: '2026-09-04T11:00:00Z' };
const result = buildEventTimeline({
  order,
  findings: [{ id: 'F1', type: 'ORDER_STUCK_30M', severity: 'warning', created_at: '2026-09-04T11:31:00Z' }],
  recommendations: [{ id: 'R1', finding_id: 'F1', priority: 'high', created_at: '2026-09-04T11:32:00Z' }],
  alerts: [{ id: 'A1', finding_id: 'F1', severity: 'warning', created_at: '2026-09-04T11:33:00Z' }],
  reviews: [{ approval_id: 'APPROVAL_R1', status: 'PENDING', reviewer: null, reviewed_at: '2026-09-04T11:34:00Z' }],
});

const expected = ['order', 'anomaly', 'recommendation', 'alert', 'admin_review'];
const checks = {
  mode: result.mode === 'LAB_EVENT_TIMELINE_ONLY',
  read_only: result.read_only === true,
  production_blocked: result.production_write_permitted === false,
  push_blocked: result.push_or_onesignal_permitted === false,
  execution_blocked: result.execution_permitted === false,
  automatic_actions_zero: result.automatic_actions === 0,
  five_events: result.event_count === 5,
  chronological_sequence: result.events.every((x, i) => x.sequence === i + 1),
  expected_flow: result.events.map((x) => x.type).join('|') === expected.join('|'),
  order_linked: result.events[0]?.data?.order_id === 101,
  review_linked: result.events[4]?.data?.approval_id === 'APPROVAL_R1',
  all_non_executable: result.events.every((x) => x.executable === false),
  safety_check: eventTimelineSafetyCheck(result),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_29',
  passed: failed.length === 0,
  checks,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
