// CHOCO AUTO LEVEL 5 — Adaptive Agent Pipeline
// LAB/TEST ONLY. This pipeline never executes Production actions.
import { createTask, buildPlan } from './task-planner.js';
import { assertSafePlan } from './safety-gate.js';
import { createApprovalRequest, approvalAllowsSimulation, approvalSafetyCheck } from './approval-controller.js';
import { createTaskState, stateSafetyCheck } from './state-controller.js';
import { buildObservationContext, observationContextSafetyCheck } from './observation-context-controller.js';
import { buildReasoningDecision, decisionSafetyCheck } from './reasoning-decision-engine.js';
import { rankDecisions, adaptivePrioritySafetyCheck } from './adaptive-priority-engine.js';
import { simulateAction, executionSafetyCheck } from '../execution/lab-execution-simulator.js';

export const AGENT_PIPELINE_MODE = 'LAB_AGENT_PIPELINE_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PUSH_OR_ONESIGNAL_ENABLED = false;

export function runAgentPipeline({ type, target = null, context = {}, requestedBy = 'CHOCO_AI', observationContext = null } = {}) {
  let observation = null;
  let decision = null;
  let effectiveType = type;
  let effectiveTarget = target;
  let effectiveContext = context;
  let priorityDecision = null;

  if (observationContext) {
    observation = buildObservationContext(observationContext);
    if (!observationContextSafetyCheck(observation)) throw new Error('CHOCO AUTO PIPELINE: observation safety check failed');
    decision = buildReasoningDecision(observation);
    if (!decisionSafetyCheck(decision)) throw new Error('CHOCO AUTO PIPELINE: decision safety check failed');
    const ranked = rankDecisions([decision], observation);
    if (!adaptivePrioritySafetyCheck(ranked)) throw new Error('CHOCO AUTO PIPELINE: adaptive priority safety check failed');
    priorityDecision = ranked[0];
    effectiveType = priorityDecision.recommended_action;
    effectiveTarget = priorityDecision.target;
    effectiveContext = { ...context, observation, decision: priorityDecision, priority_score: priorityDecision.priority_score };
  }

  if (!effectiveType) throw new Error('CHOCO AUTO PIPELINE: task type is required');
  const task = createTask({ type: effectiveType, target: effectiveTarget, context: effectiveContext, requestedBy });
  const taskWithPriority = priorityDecision
    ? Object.freeze({ ...task, priority_score: priorityDecision.priority_score })
    : task;
  const plan = buildPlan(taskWithPriority);
  const safety = assertSafePlan(plan);
  const approval = createApprovalRequest(plan, requestedBy);
  if (!approvalSafetyCheck(approval)) throw new Error('CHOCO AUTO PIPELINE: approval safety check failed');

  const targetRequired = effectiveType === 'ASSIGN_SHIPPER' || effectiveType === 'REMIND_STUCK_ORDER' || effectiveType === 'SEND_ALERT';
  const waitingForTarget = targetRequired && !effectiveTarget;
  const simulationSteps = !waitingForTarget && approvalAllowsSimulation(approval)
    ? plan.steps.filter((step) => ['ASSIGN_SHIPPER', 'SEND_ALERT', 'REMIND_STUCK_ORDER', 'GENERATE_REPORT'].includes(step.action))
    : [];

  const simulations = simulationSteps.map((step) => {
    const result = simulateAction({ action: step.action, target: taskWithPriority.target, payload: taskWithPriority.context });
    if (!executionSafetyCheck(result)) throw new Error(`CHOCO AUTO PIPELINE: execution safety check failed for ${step.action}`);
    return result;
  });

  const state = createTaskState({ task: taskWithPriority, plan, approval, simulations, lifecycleStatus: waitingForTarget ? 'WAITING_FOR_TARGET' : undefined });
  if (!stateSafetyCheck(state)) throw new Error('CHOCO AUTO PIPELINE: state safety check failed');

  return Object.freeze({
    mode: AGENT_PIPELINE_MODE,
    production_execution_enabled: false,
    push_or_onesignal_enabled: false,
    observation,
    decision,
    priority_decision: priorityDecision,
    priority_score: priorityDecision?.priority_score ?? null,
    task: taskWithPriority,
    plan,
    safety,
    approval,
    approval_required: plan.requires_approval === true,
    approval_status: approval.status,
    waiting_for_target: waitingForTarget,
    simulations: Object.freeze(simulations),
    state,
    production_write: false,
    database_mutation: false,
    push_sent: false,
    executed: false,
  });
}
