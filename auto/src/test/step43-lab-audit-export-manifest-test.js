import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import { createExportManifest, manifestSafetyCheck } from '../audit/lab-audit-export-manifest.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-43',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-043' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});

const manifest = createExportManifest([entry]);
const emptyManifest = createExportManifest([]);
const invalid = createExportManifest([{ execution_mode: 'PRODUCTION', execution_permitted: true }]);

const checks = {
  manifest_mode_correct: manifest.mode === 'LAB_AUDIT_EXPORT_MANIFEST',
  entry_count_correct: manifest.entry_count === 1,
  checksum_algorithm_correct: manifest.checksum_algorithm === 'SHA-256',
  checksum_shape_correct: typeof manifest.checksum === 'string' && manifest.checksum.length === 64,
  empty_manifest_safe: emptyManifest.entry_count === 0,
  unsafe_entry_excluded: invalid.entry_count === 0,
  export_disabled: manifest.export_enabled === false,
  production_access_locked: manifest.production_access_permitted === false,
  production_write_locked: manifest.production_write_permitted === false,
  execution_locked: manifest.execution_permitted === false,
  safety_check_passes: manifestSafetyCheck(manifest) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_43_LAB_AUDIT_EXPORT_MANIFEST',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  export_enabled: false,
  execution_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
