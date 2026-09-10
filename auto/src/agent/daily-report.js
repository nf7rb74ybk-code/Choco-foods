// CHOCO AUTO LAB — daily operations summary
// Pure transformation of already-observed data. No database writes.

export const REPORT_MODE = 'LAB_DAILY_REPORT_ONLY';

export function buildDailyOperationsReport({ snapshot = {}, observation = {}, changes = null, events = [], processed = [], auditCount = 0 } = {}) {
  const orders = observation.orders ?? {};
  const shippers = observation.shippers ?? {};
  const statusCounts = orders.status_counts ?? {};
  const report = {
    mode: REPORT_MODE,
    generated_at: new Date().toISOString(),
    orders: {
      total: Number(orders.total ?? snapshot.orders_total ?? 0),
      stuck: Number(orders.stuck ?? snapshot.stuck_orders_count ?? 0),
      status_counts: { ...statusCounts },
    },
    shippers: {
      online: Number(shippers.online ?? 0),
      offline: Number(shippers.offline ?? 0),
      total: Number(shippers.total ?? 0),
    },
    automation: {
      events_detected: Array.isArray(events) ? events.length : 0,
      tasks_processed: Array.isArray(processed) ? processed.length : 0,
      audit_entries: Number(auditCount ?? 0),
      simulated_only: true,
    },
    changes: changes ?? null,
    safety: {
      production_execution_enabled: false,
      production_write_permitted: false,
      database_mutation_permitted: false,
      push_or_onesignal_permitted: false,
    },
  };
  return Object.freeze(report);
}

export function dailyReportSafetyCheck(report) {
  return Boolean(
    report &&
    report.mode === REPORT_MODE &&
    report.safety?.production_execution_enabled === false &&
    report.safety?.production_write_permitted === false &&
    report.safety?.database_mutation_permitted === false &&
    report.safety?.push_or_onesignal_permitted === false &&
    report.automation?.simulated_only === true
  );
}
