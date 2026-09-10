// CHOCO AUTO LAB — Level 6.3 controller integration test
// Uses an in-memory Supabase-shaped client. No network and no Production writes.

import { createLiveAutoController, liveAutoControllerSafetyCheck } from '../live/live-auto-controller.js';

let currentData = {
  orders: [{ id: 1, status: 'Chờ xác nhận', created_at: '2026-09-10T10:00:00Z' }],
  profiles: [{ id: 's1', role: 'shipper', is_online: true }],
  gps: [{ id: 1 }],
};

const client = {
  from(table) {
    const values = table === 'orders' ? currentData.orders : table === 'profiles' ? currentData.profiles : currentData.gps;
    return {
      select() {
        return Promise.resolve({ data: values, error: null });
      },
    };
  },
};

const controller = createLiveAutoController({ client });
const first = await controller.tick();

currentData = {
  orders: [
    { id: 1, status: 'Đang giao', created_at: '2026-09-10T10:00:00Z' },
    { id: 2, status: 'Chờ xác nhận', created_at: '2026-09-10T10:30:00Z' },
  ],
  profiles: [{ id: 's1', role: 'shipper', is_online: true }],
  gps: [{ id: 1 }, { id: 2 }],
};

const second = await controller.tick();

const checks = {
  first_baseline: first.changes.baseline === true,
  second_detected_change: second.changes.changed === true,
  event_generated: second.events.length > 0,
  task_processed_in_lab: second.processed.length > 0,
  safety_flags_false: liveAutoControllerSafetyCheck(second),
  no_production_execution: second.executed === false,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
if (failed.length) throw new Error(`Level 6.3 controller checks failed: ${failed.map(([name]) => name).join(', ')}`);

console.log('CHOCO_AUTO_LEVEL_6_3_LIVE_AUTO_CONTROLLER_TEST: PASS');
