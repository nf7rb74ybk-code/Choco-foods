// CHOCO AUTO LAB — Level 6 read-only runtime entry point
// The caller supplies an already-authorized Supabase client.
// This entry point only SELECTs operational data and produces a non-executable decision report.

import { loadLiveSnapshot } from './live-snapshot.js';
import { buildObservationContext } from '../agent/observation-context-controller.js';
import { runAgentPipeline } from '../agent/agent-pipeline.js';

export const LIVE_OBSERVER_RUNTIME_MODE = 'LIVE_READ_ONLY_RUNTIME';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export async function runLiveObserver({ client, requestedBy = 'CHOCO_AI_LIVE_OBSERVER' } = {}) {
  const snapshot = await loadLiveSnapshot(client);
  const observation = buildObservationContext(snapshot);
  const pipeline = runAgentPipeline({
    context: { source: 'LIVE_READ_ONLY_OBSERVER' },
    requestedBy,
    observationContext: observation,
  });

  return Object.freeze({
    mode: LIVE_OBSERVER_RUNTIME_MODE,
    snapshot,
    observation,
    decision: pipeline.decision,
    priority_decision: pipeline.priority_decision,
    priority_score: pipeline.priority_score,
    plan: pipeline.plan,
    approval: pipeline.approval,
    waiting_for_target: pipeline.waiting_for_target,
    simulations: pipeline.simulations,
    safety: pipeline.safety,
    production_execution_enabled: false,
    production_write_permitted: false,
    database_mutation_permitted: false,
    push_or_onesignal_permitted: false,
    executed: false,
  });
}

export function liveObserverRuntimeSafetyCheck(result) {
  return Boolean(
    result &&
    result.mode === LIVE_OBSERVER_RUNTIME_MODE &&
    result.snapshot?.mode === 'LIVE_READ_ONLY' &&
    result.snapshot?.read_only === true &&
    result.production_execution_enabled === false &&
    result.production_write_permitted === false &&
    result.database_mutation_permitted === false &&
    result.push_or_onesignal_permitted === false &&
    result.executed === false &&
    result.simulations?.every((simulation) => simulation?.executed === false && simulation?.production === false)
  );
}
