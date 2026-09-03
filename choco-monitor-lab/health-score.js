(() => {
  'use strict';

  const esc = (v) => String(v ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const el = id => document.getElementById(id);

  function nums(id) {
    const root = el(id);
    if (!root) return [];
    return [...root.querySelectorAll('.metric b')].map(x => {
      const m = x.textContent.trim().replace(',', '.').match(/-?\d+(?:\.\d+)?/);
      return m ? Number(m[0]) : null;
    });
  }

  function percentText(id) {
    const root = el(id);
    if (!root) return null;
    const m = root.textContent.match(/(\d+(?:\.\d+)?)\s*%/);
    return m ? Number(m[1]) : null;
  }

  function incidentRows() {
    const root = el('incidentEngine');
    if (!root) return [];
    return [...root.querySelectorAll('*')].map(x => x.textContent.trim()).filter(Boolean)
      .filter(t => /CRITICAL|WARN/.test(t));
  }

  function calculate() {
    let score = 100;
    const reasons = [];
    const breakdown = { Orders: 0, Push: 0, Shipper: 0, Edge: 0, Incidents: 0 };
    const deduct = (cat, points, reason) => {
      const p = Math.max(0, Math.round(points));
      if (!p) return;
      score -= p; breakdown[cat] += p; reasons.push({ points: p, reason });
    };

    const o = nums('orderSummary');
    if (o.length >= 4) {
      deduct('Orders', Math.min(30, o[1] * 20), `${o[1]} đơn quá 180 phút`);
      deduct('Orders', Math.min(20, o[2] * 10), `${o[2]} đơn chưa có shipper >30 phút`);
      deduct('Orders', Math.min(10, o[3] * 5), `${o[3]} trường hợp dữ liệu đơn bất thường`);
    }

    const p = nums('pushSummary');
    if (p.length >= 4) {
      const rate = percentText('pushDetail');
      if (rate !== null) {
        if (rate > 50) deduct('Push', 30, `Tỷ lệ Push lỗi 24h ${rate}% > 50%`);
        else if (rate > 20) deduct('Push', 15, `Tỷ lệ Push lỗi 24h ${rate}% > 20%`);
      }
      deduct('Push', Math.min(5, p[3] * 2), `${p[3]} subscription lỗi`);
    }

    const s = nums('shipperSummary');
    if (s.length >= 4) {
      deduct('Shipper', Math.min(20, s[3] * 10), `${s[3]} GPS stale`);
      const detail = el('shipperDetail')?.textContent || '';
      const missing = (detail.match(/missing|thiếu GPS/gi) || []).length;
      if (missing) deduct('Shipper', 5, 'Phát hiện dấu hiệu thiếu GPS');
    }

    const edgeText = el('edgeDetail')?.textContent || '';
    if (/error|failed|inactive|lỗi/i.test(edgeText)) deduct('Edge', 5, 'Edge Function có dấu hiệu bất thường');

    const inc = incidentRows();
    const critical = inc.filter(t => /CRITICAL/.test(t)).length;
    const warn = inc.filter(t => /WARN/.test(t)).length;
    deduct('Incidents', Math.min(40, critical * 20), `${critical} incident CRITICAL`);
    deduct('Incidents', Math.min(21, warn * 7), `${warn} incident WARN`);

    score = Math.max(0, Math.min(100, score));
    const status = score >= 85 ? 'HEALTHY' : score >= 60 ? 'WARNING' : 'CRITICAL';
    reasons.sort((a,b) => b.points - a.points);
    return { score, status, breakdown, reasons: reasons.slice(0, 8), at: new Date().toISOString() };
  }

  function render(data) {
    const root = el('healthScore');
    if (!root) return;
    const statusLabel = { HEALTHY: '🟢 HEALTHY', WARNING: '🟡 WARNING', CRITICAL: '🔴 CRITICAL' }[data.status];
    root.innerHTML = `
      <div class="metrics">
        <div class="metric"><b>${data.score}/100</b><span>Health Score</span></div>
        <div class="metric"><b>${statusLabel}</b><span>trạng thái</span></div>
        <div class="metric"><b>${data.reasons.length}</b><span>lý do bị trừ điểm</span></div>
      </div>
      <h3>Điểm trừ theo nhóm</h3>
      <div class="muted">${Object.entries(data.breakdown).map(([k,v]) => `<div><strong>${esc(k)}</strong>: -${v} điểm</div>`).join('')}</div>
      <h3>Lý do chính</h3>
      ${data.reasons.length ? `<ol>${data.reasons.map(r => `<li><strong>-${r.points}</strong> — ${esc(r.reason)}</li>`).join('')}</ol>` : '<div class="empty">Chưa có lý do bị trừ điểm.</div>'}
      <p class="muted">Cập nhật: ${new Date(data.at).toLocaleString('vi-VN')} • Đây là điểm vận hành heuristic, không phải bằng chứng hệ thống hoàn toàn chính xác.</p>`;
  }

  function run() {
    try { render(calculate()); }
    catch (e) {
      const root = el('healthScore');
      if (root) root.innerHTML = `<div class="empty">Không thể tính Health Score: ${esc(e.message)}</div>`;
    }
  }

  window.addEventListener('load', () => setTimeout(run, 1200));
  document.getElementById('refresh')?.addEventListener('click', () => setTimeout(run, 1200));
})();
