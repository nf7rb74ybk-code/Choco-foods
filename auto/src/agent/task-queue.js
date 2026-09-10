// CHOCO AUTO LEVEL 5 — Steps 11-13: Task Queue + Adaptive Priority Manager
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

function isAvailable(item) {
  return item.status !== 'PROCESSING' && item.status !== 'DONE' && item.status !== 'BLOCKED';
}

function compareQueueItems(a, b) {
  return a.priority_rank - b.priority_rank
    || (b.adaptive_priority_score ?? 0) - (a.adaptive_priority_score ?? 0)
    || a.queued_at.localeCompare(b.queued_at);
}

export function createTaskQueue() {
  const items = [];
  const keys = new Set();

  function enqueue(task, priority = null) {
    if (!task || typeof task !== 'object') throw new Error('CHOCO AUTO QUEUE: task is required');
    const action = task.type ?? task.action;
    const dedupeKey = task.dedupe_key ?? `${action}:${task.target?.id ?? task.target ?? 'none'}`;
    if (keys.has(dedupeKey)) return Object.freeze({ added: false, reason: 'DUPLICATE', dedupe_key: dedupeKey });

    const resolvedPriority = priorityFor(action, priority);
    const adaptiveScore = Number(task.priority_score);
    const item = Object.freeze({
      queue_id: `QUEUE-${Date.now()}-${items.length + 1}`,
      task,
      priority: resolvedPriority,
      priority_rank: PRIORITY[resolvedPriority],
      adaptive_priority_score: Number.isFinite(adaptiveScore) ? Math.max(0, Math.min(100, adaptiveScore)) : 0,
      dedupe_key: dedupeKey,
      queued_at: new Date().toISOString(),
      status: 'QUEUED',
    });
    items.push(item);
    keys.add(dedupeKey);
    return Object.freeze({ added: true, item });
  }

  // Performance: one O(n) scan; adaptive score breaks ties inside the same priority tier.
  function next() {
    let best = null;
    let bestIndex = -1;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!isAvailable(item)) continue;
      if (best === null || compareQueueItems(item, best) < 0) {
        best = item;
        bestIndex = index;
      }
    }
    if (bestIndex < 0) return null;
    const updated = Object.freeze({ ...best, status: 'PROCESSING' });
    items[bestIndex] = updated;
    return updated;
  }

  function complete(queueId, status = 'DONE') {
    const index = items.findIndex((item) => item.queue_id === queueId);
    if (index < 0) return false;
    items[index] = Object.freeze({ ...items[index], status, completed_at: new Date().toISOString() });
    return true;
  }

  function snapshot() { return Object.freeze(items.slice()); }

  function stats() {
    const result = { total: items.length, queued: 0, processing: 0, done: 0, blocked: 0 };
    for (const item of items) {
      if (item.status === 'PROCESSING') result.processing += 1;
      else if (item.status === 'DONE') result.done += 1;
      else if (item.status === 'BLOCKED') result.blocked += 1;
      else result.queued += 1;
    }
    return Object.freeze(result);
  }

  return Object.freeze({ enqueue, next, complete, snapshot, stats, size: () => items.length });
}

export function taskQueueSafetyCheck(queue) {
  return Boolean(queue && TASK_QUEUE_MODE === 'LAB_TASK_QUEUE_ONLY' && PRODUCTION_WRITE_PERMITTED === false && PUSH_OR_ONESIGNAL_PERMITTED === false);
}
