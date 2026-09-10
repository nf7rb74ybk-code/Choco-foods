// CHOCO AUTO LEVEL 5 — Steps 11-13: Task Queue + Priority Manager
// LAB/TEST ONLY. In-memory queue. Never writes Production or Supabase.
export const TASK_QUEUE_MODE = 'LAB_TASK_QUEUE_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

const PRIORITY = Object.freeze({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 });
const ACTION_PRIORITY = Object.freeze({
  ASSIGN_SHIPPER: 'HIGH',
  REMIND_STUCK_ORDER: 'HIGH',
  SEND_ALERT: 'MEDIUM',
  GENERATE_REPORT: 'LOW',
});

function priorityFor(action, requestedPriority) {
  if (requestedPriority && PRIORITY[requestedPriority] !== undefined) return requestedPriority;
  return ACTION_PRIORITY[action] ?? 'LOW';
}

export function createTaskQueue() {
  const items = [];
  const keys = new Set();

  function enqueue(task, priority = null) {
    if (!task || typeof task !== 'object') throw new Error('CHOCO AUTO QUEUE: task is required');
    const action = task.type ?? task.action;
    const dedupeKey = task.dedupe_key ?? `${action}:${task.target?.id ?? task.target ?? 'none'}`;
    if (keys.has(dedupeKey)) return Object.freeze({ added: false, reason: 'DUPLICATE', dedupe_key: dedupeKey });
    const item = Object.freeze({
      queue_id: `QUEUE-${Date.now()}-${items.length + 1}`,
      task,
      priority: priorityFor(action, priority),
      priority_rank: PRIORITY[priorityFor(action, priority)],
      dedupe_key: dedupeKey,
      queued_at: new Date().toISOString(),
    });
    items.push(item);
    keys.add(dedupeKey);
    return Object.freeze({ added: true, item });
  }

  function next() {
    const available = items.filter((item) => item.status !== 'PROCESSING' && item.status !== 'DONE');
    available.sort((a, b) => a.priority_rank - b.priority_rank || a.queued_at.localeCompare(b.queued_at));
    const item = available[0];
    if (!item) return null;
    const updated = Object.freeze({ ...item, status: 'PROCESSING' });
    const index = items.indexOf(item);
    items[index] = updated;
    return updated;
  }

  function complete(queueId, status = 'DONE') {
    const index = items.findIndex((item) => item.queue_id === queueId);
    if (index < 0) return false;
    items[index] = Object.freeze({ ...items[index], status, completed_at: new Date().toISOString() });
    return true;
  }

  return Object.freeze({
    enqueue,
    next,
    complete,
    snapshot: () => Object.freeze(items.slice()),
    size: () => items.length,
  });
}

export function taskQueueSafetyCheck(queue) {
  return Boolean(queue && TASK_QUEUE_MODE === 'LAB_TASK_QUEUE_ONLY' && PRODUCTION_WRITE_PERMITTED === false && PUSH_OR_ONESIGNAL_PERMITTED === false);
}
