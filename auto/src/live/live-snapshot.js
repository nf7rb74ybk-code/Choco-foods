// CHOCO AUTO LAB — Step 23 Live Read-Only Snapshot
// Orchestrates the existing SELECT-only observer into a safe runtime snapshot.
// This module never writes Production, assigns shippers, changes payments, or sends Push.

import { readSnapshot } from '../observer/snapshot.js';

export const LIVE_SNAPSHOT_MODE = 'LIVE_READ_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;

function assertClient(client) {
  if (!client || typeof client.from !== 'function') {
    throw new Error('CHOCO AUTO: a Supabase client is required');
  }
}

/**
 * Read the current operational snapshot through the existing SELECT-only observer.
 * The caller supplies an already-authorized client; no credentials are stored here.
 */
export async function loadLiveSnapshot(client) {
  assertClient(client);
  const snapshot = await readSnapshot(client);

  return Object.freeze({
    ...snapshot,
    mode: LIVE_SNAPSHOT_MODE,
    read_only: true,
    production_write_permitted: PRODUCTION_WRITE_PERMITTED,
    push_or_onesignal_permitted: PUSH_OR_ONESIGNAL_PERMITTED,
  });
}

export function liveSnapshotSafetyCheck(snapshot) {
  return !!snapshot
    && snapshot.mode === LIVE_SNAPSHOT_MODE
    && snapshot.read_only === true
    && snapshot.production_write_permitted === false
    && snapshot.push_or_onesignal_permitted === false;
}
