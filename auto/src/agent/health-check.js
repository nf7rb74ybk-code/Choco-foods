// CHOCO AUTO LAB — deterministic health check
// Read-only metadata only. Never mutates Production.

export const HEALTH_CHECK_MODE = 'LAB_HEALTH_CHECK_ONLY';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export function runHealthCheck({ snapshot = null, observation = null, controllerResult = null } = {}) {
  const checks = [
    { name: 'snapshot_present', ok: Boolean(snapshot) },
    { name: 'observation_present', ok: Boolean(observation) },
    { name: 'controller_present', ok: Boolean(controllerResult) },
    { name: 'read_only_mode', ok: snapshot?.read_only === true },
    { name: 'no_production_execution', ok: controllerResult?.production_execution_enabled === false },
    { name: 'no_database_mutation', ok: controllerResult?.database_mutation_permitted === false },
    { name: 'no_push', ok: controllerResult?.push_or_onesignal_permitted === false },
  ];
  const failed = checks.filter((check) => !check.ok).map((check) => check.name);
  return Object.freeze({
    mode: HEALTH_CHECK_MODE,
    healthy: failed.length === 0,
    checks,
    failed,
    production_execution_enabled: false,
    production_write_permitted: false,
    database_mutation_permitted: false,
    push_or_onesignal_permitted: false,
  });
}

export function healthCheckSafetyCheck(result) {
  return Boolean(
    result &&
    result.mode === HEALTH_CHECK_MODE &&
    result.production_execution_enabled === false &&
    result.production_write_permitted === false &&
    result.database_mutation_permitted === false &&
    result.push_or_onesignal_permitted === false
  );
}
