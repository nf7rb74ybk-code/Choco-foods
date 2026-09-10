// CHOCO AUTO LAB — event -> task -> reasoning E2E routing test
// No network, no Production writes, no Push/OneSignal.

import { createLabOrchestrator } from '../agent/auto-orchestrator.js';
import { buildReasoningDecision, decisionSafetyCheck } from '../agent/reasoning-decision-engine.js';

const observation = Object.freeze({
  mode: 'LAB_OBSERVATION_CONTEXT_ONLY',
  read_only: true,
  orders: Object.freeze({ total: 2, potentially_stuck_over_30m: 0 }),
  shippers: Object.freeze({ online: 1 }),
});

const orchestrator = createLabOrchestrator();

const events = [
  { type: 'NEW_ORDER', target: null, context: { order_count: 1 }, dedupe_key: 'e2e-new-order-1' },
  { type: 'SHIPPER_OFFLINE', target: null, context: {}, dedupe_key: 'e2e-shipper-offline-1' },
];

const accepted = events.map((event) => orchestrator.ingest(event));
if (accepted.some((item) => item.accepted !== true)) {
  throw new Error('E2E event routing: expected all LAB events to be accepted');
}

const first = orchestrator.processNext({ observationContext: { ...observation, event_type: 'NEW_ORDER' } });
const second = orchestrator.processNext({ observationContext: { ...observation, event_type: 'SHIPPER_OFFLINE' } });

if (!first || !second) throw new Error('E2E event routing: expected two processed tasks');

const firstDecision = buildReasoningDecision({ ...observation, event_type: 'NEW_ORDER' });
const secondDecision = buildReasoningDecision({ ...observation, event_type: 'SHIPPER_OFFLINE' });

const checks = {
  new_order_routes_to_alert: firstDecision.recommended_action === 'SEND_ALERT',
  offline_routes_to_report: secondDecision.recommended_action === 'GENERATE_REPORT',
  decisions_are_safe: decisionSafetyCheck(firstDecision) && decisionSafetyCheck(secondDecision),
  no_execution: first.result.executed === false && second.result.executed === false,
  no_production_write: first.result.production_write === false && second.result.production_write === false,
  no_database_mutation: first.result.database_mutation === false && second.result.database_mutation === false,
  no_push: first.result.push_sent === false && second.result.push_sent === false,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
if (failed.length) throw new Error(`Level 6 event routing checks failed: ${failed.map(([name]) => name).join(', ')}`);

console.log('CHOCO_AUTO_LEVEL_6_EVENT_ROUTING_E2E_TEST: PASS');
