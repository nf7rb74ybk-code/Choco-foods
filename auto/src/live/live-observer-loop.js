// CHOCO AUTO LAB — Level 6 continuous read-only observer loop
// Polls an already-authorized client and emits snapshots/decisions only.
// No writes, mutations, assignments, or Push/OneSignal calls are performed.

import { runLiveObserver } from './run-live-observer.js';

export const LIVE_OBSERVER_LOOP_MODE = 'LIVE_READ_ONLY_LOOP';
export const PRODUCTION_EXECUTION_ENABLED = false;
export const PRODUCTION_WRITE_PERMITTED = false;
export const DATABASE_MUTATION_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

export async function runLiveObserverOnce(options = {}) {
  return runLiveObserver(options);
}

export function startLiveObserverLoop({
  client,
  intervalMs = 60_000,
  requestedBy = 'CHOCO_AI_LIVE_OBSERVER_LOOP',
  onResult = () => {},
  onError = () => {},
} = {}) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('CHOCO AUTO OBSERVER LOOP: a Supabase client is required');
  }
  if (!Number.isFinite(intervalMs) || intervalMs < 1_000) {
    throw new Error('CHOCO AUTO OBSERVER LOOP: intervalMs must be at least 1000ms');
  }
  if (typeof onResult !== 'function' || typeof onError !== 'function') {
    throw new Error('CHOCO AUTO OBSERVER LOOP: callbacks must be functions');
  }

  let stopped = false;
  let timer = null;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const result = await runLiveObserver({ client, requestedBy });
      if (!stopped) onResult(result);
    } catch (error) {
      if (!stopped) onError(error);
    } finally {
      running = false;
    }
  };

  timer = setInterval(tick, intervalMs);
  void tick();

  return Object.freeze({
    mode: LIVE_OBSERVER_LOOP_MODE,
    stop() {
      if (stopped) return;
      stopped = true;
      if (timer) clearInterval(timer);
      timer = null;
    },
    isStopped() {
      return stopped;
    },
  });
}

export function liveObserverLoopSafetyCheck(loop) {
  return Boolean(
    loop &&
    loop.mode === LIVE_OBSERVER_LOOP_MODE &&
    PRODUCTION_EXECUTION_ENABLED === false &&
    PRODUCTION_WRITE_PERMITTED === false &&
    DATABASE_MUTATION_PERMITTED === false &&
    PUSH_OR_ONESIGNAL_PERMITTED === false &&
    typeof loop.stop === 'function'
  );
}
