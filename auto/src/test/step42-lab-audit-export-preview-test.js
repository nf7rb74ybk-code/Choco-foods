import { createAuditHistoryEntry } from '../audit/lab-audit-history.js';
import { validateExportPreview, previewSafetyCheck } from '../audit/lab-audit-export-preview.js';

const entry = createAuditHistoryEntry({
  queueId: 'LAB-QUEUE-42',
  proposal: { action: 'ASSIGN_SHIPPER', target: 'LAB-ORDER-042' },
  processingResult: { result: 'LAB_REVIEW_READY', processed: true },
});

const preview = validateExportPreview([entry]);
const emptyPreview = validateExportPreview([]);

const checks = {
  preview_ready: preview.preview_ready === true,
  entry_count_correct: preview.entry_count === 1,
  empty_preview_safe: emptyPreview.preview_ready === true && emptyPreview.entry_count === 0,
  export_disabled: preview.export_enabled === false,
  production_access_locked: preview.production_access_permitted === false,
  production_write_locked: preview.production_write_permitted === false,
  execution_locked: preview.execution_permitted === false,
  safety_check_passes: previewSafetyCheck(preview) === true,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  suite: 'CHOCO_AUTO_STEP_42_LAB_AUDIT_EXPORT_PREVIEW',
  passed: failed.length === 0,
  checks,
  lab_only: true,
  production_data_used: false,
  export_enabled: false,
  execution_permitted: false,
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
