// CHOCO AUTO LAB — Level 6.3 read-only continuous controller
// Observe -> detect change -> create LAB task events -> simulate safely.
// No Production mutation, execution, Push, or OneSignal.

import { loadLiveSnapshot } from './live-snapshot.js';
import { buildObservationContext } from '../agent/observation-context-controller.js';
import { detectObserverChanges } from './observer-change-detector.js';
import { changesToEvents, observerEventBridgeSafetyCheck } from './observer-event-bridge.js';
import { createLabOrchestrator } from '../agent/auto-orchestrator.js';

export const LIVE_AUTO_CONTROLLER_MODE = 'LAB_LIVE_AUTO_CONTROLLER_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export function createLiveAutoController({ client, requestedBy = 'CHOCO_AUTO_LIVE_CONTROLLER' } = {}) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('CHOCO AUTO LIVE CONTROLLER: a Supabase client is required');
  }

  const orchestrator = createLabOrchestrator();
  let previousSnapshot = null;
  let ticks = 0;

  async function tick() {
    const snapshot = await loadLiveSnapshot(client);
    const observation = buildObservationContext(snapshot);
    const changes = detectObserverChanges(previousSnapshot, snapshot);
    const events = changesToEvents(changes);
    if (!observerEventBridgeSafetyCheck(events)) throw new Error('CHOCO AUTO LIVE CONTROLLER: event bridge safety failed');

    const accepted = [];
    const processed = [];
    for (const event of events) {
      const result = orchestrator.ingest(event);
      accepted.push(result);
    }
    for (const item of accepted) {
      if (item.accepted) {
        const result = orchestrator.processNext({ observationContext: observation });
        if (result) processed.push(result);
      }
    }

    previousSnapshot = snapshot;
    ticks += 1;

    return Object.freeze({
      mode: LIVE_AUTO_CONTROLLER_MODE,
      tick: ticks,
      snapshot,
      observation,
      changes,
      events,
      accepted: Object.freeze(accepted),
      processed: Object.freeze(processed),
      audit_count: orchestrator.audit().length,
      production_execution_enabled: false,
      production_write_permitted: false,
      database_mutation_permitted: false,
      push_or_onesignal_permitted: false,
      executed: false,
    });
  }

  return Object.freeze({
    tick,
    orchestrator,
    mode: LIVE_AUTO_CONTROLLER_MODE,
    production_execution_enabled: PRODUCTION_EXECUTION_ENABLED,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    database_mutation_permitted: DATABASE_MUTATION_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
  });
}

export function liveAutoControllerSafetyCheck(result) {
  return Boolean(
    result &&
    result.mode === LIVE_AUTO_CONTROLLER_MODE &&
    result.production_execution_enabled === false &&
    result.production_write_permitted === false &&
    result.database_mutation_permitted === false &&
    result.push_or_onesignal_permitted === false &&
    result.executed === false &&
    result.events?.every((event) => event?.target === null)
  );
}
