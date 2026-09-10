// CHOCO AUTO LEVEL 5 — Step 5: Agent -> Planner -> Safety Gate -> Approval -> Simulation -> State
// LAB/TEST ONLY. This pipeline never executes Production actions.

import { createTask, buildPlan } from './task-planner.js';
import { assertSafePlan } from './safety-gate.js';
import { createApprovalRequest, approvalAllowsSimulation, approvalSafetyCheck } from './approval-controller.js';
import { createTaskState, stateSafetyCheck } from './state-controller.js';
import { simulateAction, executionSafetyCheck } from '../execution/lab-execution-simulator.js';

export const AGENT_PIPELINE_MODE = 'LAB_AGENT_PIPELINE_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PUSH_OR_ONESIGNAL_ENABLED = false;

export function runAgentPipeline({ type, target = null, context = {}, requestedBy = 'CHOCO_AI' } = {}) {
  const task = createTask({ type, target, context, requestedBy });
  const plan = buildPlan(task);
  const safety = assertSafePlan(plan);
  const approval = createApprovalRequest(plan, requestedBy);

  if (!approvalSafetyCheck(approval)) {
    throw new Error('CHOCO AUTO PIPELINE: approval safety check failed');
  }

  const simulationSteps = approvalAllowsSimulation(approval)
    ? plan.steps.filter((step) =>
        ['ASSIGN_SHIPPER', 'SEND_ALERT', 'REMIND_STUCK_ORDER', 'GENERATE_REPORT'].includes(step.action)
      )
    : [];

  const simulations = simulationSteps.map((step) => {
    const result = simulateAction({
      action: step.action,
      target: task.target,
      payload: task.context,
    });

    if (!executionSafetyCheck(result)) {
      throw new Error(`CHOCO AUTO PIPELINE: execution safety check failed for ${step.action}`);
    }

    return result;
  });

  const state = createTaskState({ task, plan, approval, simulations });

  if (!stateSafetyCheck(state)) {
    throw new Error('CHOCO AUTO PIPELINE: state safety check failed');
  }

  return Object.freeze({
    mode: AGENT_PIPELINE_MODE,
    production_execution_enabled: PRODUCTION_EXECUTION_ENABLED,
    push_or_onesignal_enabled: PUSH_OR_ONESIGNAL_ENABLED,
    task,
    plan,
    safety,
    approval,
    approval_required: plan.requires_approval === true,
    approval_status: approval.status,
    simulations: Object.freeze(simulations),
    state,
    production_write: false,
    database_mutation: false,
    push_sent: false,
    executed: false,
  });
}
