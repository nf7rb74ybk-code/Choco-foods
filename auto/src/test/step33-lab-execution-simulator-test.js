import {
  simulateAction,
  executionSafetyCheck,
  productionExecutionSafetyCheck,
} from '../execution/lab-execution-simulator.js';

const assignment = simulateAction({
  action: 'ASSIGN_SHIPPER',
  target: 'LAB-ORDER-001',
  payload: { shipper_id: 'LAB-SHIPPER-001' },
});

const alert = simulateAction({
  action: 'SEND_ALERT',
  target: 'LAB-ORDER-001',
  payload: { message: 'LAB TEST ALERT' },
});

const unknown = simulateAction({ action: 'DELETE_ORDER', target: 'LAB-ORDER-001' });

const checks = {
  assignment_is_simulation: assignment.result === 'SIMULATED_ONLY',
  assignment_not_executed: assignment.executed === false,
  assignment_no_production_write: assignment.production_write === false,
  assignment_no_database_mutation: assignment.database_mutation === false,
  alert_is_simulation: alert.result === 'SIMULATED_ONLY',
  alert_not_sent: alert.push_sent === false,
  unknown_action_blocked: unknown.result === 'BLOCKED_UNKNOWN_ACTION',
  unknown_action_not_executed: unknown.executed === false,
  safety_check_assignment: executionSafetyCheck(assignment) === true,
  safety_check_alert: executionSafetyCheck(alert) === true,
  production_execution_disabled: productionExecutionSafetyCheck() === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_33_LAB_EXECUTION_SIMULATOR',
  passed: failed.length === 0,
  checks,
  simulation_only: true,
  production_data_used: false,
  production_write_permitted: false,
  push_or_onesignal_used: false,
  execution_permitted: false,
  auto_execution_enabled: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
