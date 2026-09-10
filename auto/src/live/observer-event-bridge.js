// CHOCO AUTO LAB — Level 6.3 read-only change -> event bridge
// Converts observer changes into LAB queue events only. No database writes or external actions.

export const OBSERVER_EVENT_BRIDGE_MODE = 'LAB_OBSERVER_EVENT_BRIDGE_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

function event(type, context, suffix) {
  return Object.freeze({
    type,
    target: null,
    context: Object.freeze({ ...context }),
    dedupe_key: `observer:${type}:${suffix}`,
  });
}

/**
 * Translate only actionable observer changes into queueable events.
 * The bridge never performs the action represented by an event.
 */
export function changesToEvents(changeResult) {
  if (!changeResult || changeResult.mode !== 'LIVE_READ_ONLY_CHANGE_DETECTOR') {
    throw new Error('CHOCO AUTO EVENT BRIDGE: a valid change detector result is required');
  }

  const events = [];
  for (const change of changeResult.changes || []) {
    if (change.type === 'STUCK_ORDERS' && Number(change.current) > Number(change.previous)) {
      events.push(event('ORDER_STUCK', { previous: change.previous, current: change.current }, `stuck:${change.previous}->${change.current}`));
    }
    if (change.type === 'ONLINE_SHIPPERS' && Number(change.current) < Number(change.previous)) {
      events.push(event('SHIPPER_OFFLINE', { previous: change.previous, current: change.current }, `offline:${change.previous}->${change.current}`));
    }
    if (change.type === 'ORDERS_TOTAL' && Number(change.current) > Number(change.previous)) {
      events.push(event('NEW_ORDER', { previous: change.previous, current: change.current }, `orders:${change.previous}->${change.current}`));
    }
  }

  return Object.freeze(events);
}

export function observerEventBridgeSafetyCheck(events) {
  return Boolean(
    Array.isArray(events) &&
    OBSERVER_EVENT_BRIDGE_MODE === 'LAB_OBSERVER_EVENT_BRIDGE_ONLY' &&
    PRODUCTION_EXECUTION_ENABLED === false &&
    PRODUCTION_WRITE_PERMITTED === false &&
    DATABASE_MUTATION_PERMITTED === false &&
    PUSH_OR_ONESIGNAL_PERMITTED === false &&
    events.every((item) => item && item.target === null && typeof item.type === 'string')
  );
}
