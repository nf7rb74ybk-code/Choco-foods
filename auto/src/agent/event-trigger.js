// CHOCO AUTO LEVEL 5 — Step 12: Event Trigger / Scheduler
// LAB/TEST ONLY. This module only converts events into queueable tasks.
export const EVENT_TRIGGER_MODE = 'LAB_EVENT_TRIGGER_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const EVENTS = Object.freeze({
  ORDER_STUCK: 'REMIND_STUCK_ORDER',
  NEW_ORDER: 'SEND_ALERT',
  SHIPPER_OFFLINE: 'GENERATE_REPORT',
  ORDER_DELAYED: 'REMIND_STUCK_ORDER',
  SYSTEM_ERROR: 'SEND_ALERT',
  DAILY_REPORT: 'GENERATE_REPORT',
});

export function eventToTask(event) {
  if (!event || typeof event.type !== 'string' || !EVENTS[event.type]) return null;
  return Object.freeze({
    type: EVENTS[event.type],
    target: event.target ?? null,
    context: { event_type: event.type, ...(event.context ?? {}) },
    requestedBy: 'CHOCO_AUTO_EVENT_TRIGGER',
    dedupe_key: event.dedupe_key ?? `${event.type}:${event.target?.id ?? event.target ?? 'none'}`,
  });
}

export function eventTriggerSafetyCheck() {
  return EVENT_TRIGGER_MODE === 'LAB_EVENT_TRIGGER_ONLY' && PRODUCTION_WRITE_PERMITTED === false && PUSH_OR_ONESIGNAL_PERMITTED === false;
}
