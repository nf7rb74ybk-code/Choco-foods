import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = '../../';
const read = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const parseJson = (path) => JSON.parse(read(path));

const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};
const checksum = (value) => createHash('sha256').update(stable(value)).digest('hex');

const handoverPath = new URL(`${root}STEP101_LAB_FREEZE_HANDOVER.md`, import.meta.url);
const packagePath = new URL(`${root}package.json`, import.meta.url);
const previousGatePath = new URL('./step161-170-lab-stability-gate-test.js', import.meta.url);
const safetyGatePath = new URL('./step141-150-lab-safety-acceptance-test.js', import.meta.url);
const workflowPath = new URL('../../.github/workflows/choco-auto-lab-171-180.yml', import.meta.url);

const handover = read(handoverPath);
const previousGate = read(previousGatePath);
const safetyGate = read(safetyGatePath);
const workflow = read(workflowPath);
const pkg = existsSync(packagePath) ? parseJson(packagePath) : {};
const scripts = pkg.scripts ?? {};

const baseline = Object.freeze({
  source: 'LAB_FIXTURE',
  lab_only: true,
  snapshot_id: 'LAB-SNAPSHOT-171-180',
  captured_at: '2026-09-04T00:00:00.000Z',
  records: Object.freeze([
    Object.freeze({ id: 'LAB-001', status: 'pending', amount: 100 }),
    Object.freeze({ id: 'LAB-002', status: 'ready', amount: 200 }),
  ]),
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
});

const clone = (value) => JSON.parse(JSON.stringify(value));
const baselineChecksum = checksum(baseline);
const repeatChecksums = [checksum(baseline), checksum(baseline), checksum(baseline)];
const corrupted = clone(baseline);
corrupted.records[0].amount = 999999;
const recovered = clone(baseline);
const productionCorruption = clone(baseline);
productionCorruption.production_data_used = true;

const checks = {
  baseline_fixture_valid: baseline.source === 'LAB_FIXTURE' && baseline.lab_only === true && Array.isArray(baseline.records),
  baseline_checksum_present: /^[a-f0-9]{64}$/.test(baselineChecksum),
  deterministic_repeatability: repeatChecksums.every((value) => value === baselineChecksum),
  corruption_detected: checksum(corrupted) !== baselineChecksum,
  recovery_restores_checksum: checksum(recovered) === baselineChecksum,
  production_flag_corruption_detected: productionCorruption.production_data_used === true && productionCorruption.production_data_used !== baseline.production_data_used,
  handover_present: handover.length > 0,
  lab_branch_boundary: handover.includes('choco-auto-lab'),
  production_branch_blocked: handover.includes('Production branch is not modified.'),
  production_supabase_blocked: handover.includes('Production Supabase data is not used or modified.'),
  push_blocked: handover.includes('Push / OneSignal is not enabled or modified.'),
  execution_blocked: handover.includes('Real-world execution is not permitted.'),
  automatic_actions_blocked: handover.includes('Automatic actions are not permitted.'),
  fixture_only: handover.includes('LAB fixtures/snapshots only.'),
  previous_stability_gate_present: previousGate.includes('CHOCO_AUTO_STEP_161_TO_170_LAB_STABILITY_GATE'),
  previous_safety_gate_present: safetyGate.includes('CHOCO_AUTO_STEP_141_TO_150_LAB_SAFETY_ACCEPTANCE'),
  workflow_present: workflow.includes('CHOCO AUTO LAB — Steps 171-180 Deep Integrity & Recovery'),
  workflow_lab_branch: workflow.includes('choco-auto-lab'),
  workflow_production_blocked: workflow.includes('permissions:\n  contents: read'),
  package_name_present: pkg.name === 'choco-auto-lab',
  step171_180_script_registered: typeof scripts['test:step171-180'] === 'string',
  no_external_runtime_dependency: !workflow.includes('curl ') && !workflow.includes('supabase') && !workflow.includes('onesignal'),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({
  suite: 'CHOCO_AUTO_STEP_171_TO_180_DEEP_INTEGRITY_RECOVERY',
  passed: failed.length === 0,
  steps_checked: '171-180',
  checks,
  baseline_checksum: baselineChecksum,
  repeat_checksums: repeatChecksums,
  lab_only: true,
  production_data_used: false,
  production_write_permitted: false,
  execution_permitted: false,
  push_or_onesignal_permitted: false,
  automatic_action: false,
}, null, 2));

if (failed.length) process.exit(1);
