// CHOCO AUTO LAB — Step 24 AI Anomaly Recommendation Layer
// Deterministic, explainable recommendation layer for the LAB.
// It consumes existing analysis findings and NEVER executes an action.

export const AI_RECOMMENDATION_MODE = 'LAB_RECOMMENDATION_ONLY';
export const PRODUCTION_WRITE_PERMITTED = false;
export const PUSH_OR_ONESIGNAL_PERMITTED = false;
export const EXECUTION_PERMITTED = false;

const PRIORITY = Object.freeze({
  critical: 1,
  warning: 2,
  info: 3,
});

const RECOMMENDATIONS = Object.freeze({
  NO_ONLINE_SHIPPER: {
    title: 'Kiểm tra năng lực nhận đơn',
    action: 'ADMIN_REVIEW_REQUIRED',
    rationale: 'Có đơn nhưng chưa quan sát thấy shipper online.',
  },
  ORDER_STUCK_30M: {
    title: 'Kiểm tra đơn đang bị tồn',
    action: 'ADMIN_REVIEW_REQUIRED',
    rationale: 'Đơn active đã vượt ngưỡng 30 phút.',
  },
  SHIPPER_GPS_GAP: {
    title: 'Kiểm tra GPS shipper',
    action: 'ADMIN_REVIEW_REQUIRED',
    rationale: 'Shipper online nhưng thiếu tọa độ GPS usable.',
  },
  UNKNOWN_ORDER_STATUS: {
    title: 'Kiểm tra dữ liệu trạng thái đơn',
    action: 'ADMIN_REVIEW_REQUIRED',
    rationale: 'Có đơn thiếu hoặc có trạng thái không nhận diện được.',
  },
});

function assertSafeAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    throw new TypeError('Step 24 requires an analysis result');
  }
  if (analysis.read_only !== true || analysis.production_write_permitted !== false) {
    throw new Error('Unsafe analysis: Step 24 requires read_only=true and production_write_permitted=false');
  }
}

function buildRecommendation(item, index) {
  const template = RECOMMENDATIONS[item.id] ?? {
    title: 'Admin review required',
    action: 'ADMIN_REVIEW_REQUIRED',
    rationale: 'Phát hiện này chưa có playbook tự động.',
  };
  const severity = item.severity ?? 'info';
  return Object.freeze({
    recommendation_id: `AI_REC_${item.id}`,
    finding_id: item.id,
    rank: index + 1,
    priority: PRIORITY[severity] ?? PRIORITY.info,
    severity,
    title: template.title,
    recommendation: template.action,
    rationale: template.rationale,
    evidence: item.evidence ?? {},
    action_permitted: false,
    execution_permitted: false,
  });
}

/**
 * Convert explainable findings into prioritized recommendations.
 * This is intentionally not an external-model call; no credentials/network are used.
 */
export function buildAnomalyRecommendations(analysis) {
  assertSafeAnalysis(analysis);
  const findings = Array.isArray(analysis.findings) ? analysis.findings : [];

  const ordered = findings
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      const pa = PRIORITY[a.item.severity] ?? PRIORITY.info;
      const pb = PRIORITY[b.item.severity] ?? PRIORITY.info;
      return pa - pb || a.originalIndex - b.originalIndex;
    });

  const recommendations = ordered.map(({ item }, index) => buildRecommendation(item, index));

  return Object.freeze({
    mode: AI_RECOMMENDATION_MODE,
    generated_at: analysis.generated_at,
    read_only: true,
    production_write_permitted: false,
    push_or_onesignal_permitted: false,
    execution_permitted: false,
    recommendations,
    summary: Object.freeze({
      recommendation_count: recommendations.length,
      critical_count: recommendations.filter((x) => x.severity === 'critical').length,
      warning_count: recommendations.filter((x) => x.severity === 'warning').length,
      info_count: recommendations.filter((x) => x.severity === 'info').length,
      automatic_actions: 0,
    }),
  });
}

export function anomalyRecommendationSafetyCheck(result) {
  return !!result
    && result.mode === AI_RECOMMENDATION_MODE
    && result.read_only === true
    && result.production_write_permitted === false
    && result.push_or_onesignal_permitted === false
    && result.execution_permitted === false
    && Array.isArray(result.recommendations)
    && result.recommendations.every((x) => x.action_permitted === false && x.execution_permitted === false);
}
