// CHOCO AUTO LAB — Step 29
// Event Timeline — LAB / READ-ONLY / REVIEW ONLY.
// Builds an in-memory chronological trace. No DB writes, RPC, Edge Functions,
// Push, OneSignal, payment changes, assignment, cancellation, or execution.

export const TIMELINE_MODE = 'LAB_EVENT_TIMELINE_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

const ORDER = ['order', 'anomaly', 'recommendation', 'alert', 'admin_review'];

export function buildEventTimeline({ order, findings = [], recommendations = [], alerts = [], reviews = [] } = {}) {
  if (!order || typeof order !== 'object') throw new Error('Timeline order is required');

  const events = [];
  const add = (type, at, data = {}) => events.push({
    id: `TL_${events.length + 1}`,
    type,
    at: at ?? order.created_at ?? 'LAB_TIME',
    data,
    executable: false,
  });

  add('order', order.created_at, { order_id: order.id, code: order.code, status: order.status });
  findings.forEach((x) => add('anomaly', x.created_at, { finding_id: x.id ?? x.finding_id, severity: x.severity, type: x.type }));
  recommendations.forEach((x) => add('recommendation', x.created_at, { recommendation_id: x.id ?? x.recommendation_id, finding_id: x.finding_id, priority: x.priority }));
  alerts.forEach((x) => add('alert', x.created_at, { alert_id: x.id ?? x.alert_id, severity: x.severity, finding_id: x.finding_id }));
  reviews.forEach((x) => add('admin_review', x.reviewed_at ?? x.created_at, { approval_id: x.approval_id, status: x.status, reviewer: x.reviewer ?? null }));

  const rank = new Map(ORDER.map((x, i) => [x, i]));
  events.sort((a, b) => {
    const ta = Date.parse(a.at);
    const tb = Date.parse(b.at);
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
    return rank.get(a.type) - rank.get(b.type);
  });
  events.forEach((x, i) => { x.sequence = i + 1; });

  return Object.freeze({
    mode: TIMELINE_MODE,
    read_only: true,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
    execution_permitted: EXECUTION_PERMITTED,
    automatic_actions: 0,
    order: { id: order.id, code: order.code },
    stages: ORDER,
    events,
    event_count: events.length,
  });
}

export function eventTimelineSafetyCheck(timeline) {
  return !!timeline
    && timeline.mode === TIMELINE_MODE
    && timeline.read_only === true
    && timeline.production_write_permitted === false
    && timeline.push_or_onesignal_permitted === false
    && timeline.execution_permitted === false
    && timeline.automatic_actions === 0
    && Array.isArray(timeline.events)
    && timeline.events.every((x) => x.executable === false);
}
