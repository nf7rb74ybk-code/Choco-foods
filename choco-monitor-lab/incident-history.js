/* CHOCO MONITOR LAB — Step 10: Incident History
 * LAB / READ-ONLY. Browser-local history only; no Supabase writes.
 */
(() => {
  const KEY = 'choco_monitor_lab_incident_history_v1';
  const MAX_EVENTS = 100;

  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const now = () => new Date().toISOString();

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_EVENTS))); } catch {}
  }
  function getCurrentIncidents() {
    // Incident Engine v2 exposes its rendered state through the DOM when available.
    // We intentionally do not call any production endpoint and do not alter its engine.
    const root = document.getElementById('incidentEngine');
    if (!root) return [];
    const text = root.innerText || '';
    if (!text || /chưa phát hiện|đang chờ/i.test(text)) return [];
    const blocks = [...root.querySelectorAll('[data-incident-key]')];
    if (blocks.length) return blocks.map(b => ({
      key: b.dataset.incidentKey,
      severity: b.dataset.severity || 'INFO',
      source: b.dataset.source || 'incident-engine',
      title: b.dataset.title || b.innerText.slice(0, 160)
    }));
    return [{ key: 'incident-engine:current', severity: 'INFO', source: 'incident-engine', title: text.slice(0, 180) }];
  }

  function snapshot() {
    const current = getCurrentIncidents();
    const history = load();
    const t = now();
    const seen = new Set(current.map(x => x.key));

    current.forEach(x => {
      let e = history.find(v => v.key === x.key && v.state === 'ACTIVE');
      if (!e) {
        e = { id: `${x.key}:${Date.now()}`, key:x.key, severity:x.severity, source:x.source, title:x.title, state:'ACTIVE', firstSeen:t, lastSeen:t };
        history.push(e);
      } else {
        e.lastSeen = t;
        e.severity = x.severity;
        e.title = x.title;
      }
    });

    history.filter(e => e.state === 'ACTIVE' && !seen.has(e.key)).forEach(e => {
      e.state = 'CLEARED';
      e.clearedAt = t;
      e.lastSeen = t;
    });

    save(history);
    render(history);
  }

  function fmt(t) {
    if (!t) return '—';
    return new Date(t).toLocaleString('vi-VN', { hour12:false });
  }
  function duration(e) {
    const a = new Date(e.firstSeen).getTime();
    const b = new Date(e.clearedAt || e.lastSeen || now()).getTime();
    const m = Math.max(0, Math.floor((b-a)/60000));
    if (m < 60) return `${m} phút`;
    return `${Math.floor(m/60)}h ${m%60}m`;
  }

  function render(history) {
    const root = document.getElementById('incidentHistory');
    if (!root) return;
    const active = history.filter(x=>x.state==='ACTIVE').length;
    const cleared = history.filter(x=>x.state==='CLEARED').length;
    const rows = [...history].reverse().slice(0, 30);
    root.innerHTML = `
      <div class="metrics">
        <div class="metric"><b>${history.length}</b><span>sự kiện đã lưu</span></div>
        <div class="metric"><b>${active}</b><span>đang ACTIVE</span></div>
        <div class="metric"><b>${cleared}</b><span>đã CLEARED</span></div>
        <div class="metric"><b>LOCAL</b><span>lịch sử LAB</span></div>
      </div>
      <div style="overflow:auto;margin-top:12px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr><th style="text-align:left;padding:8px">Severity</th><th style="text-align:left;padding:8px">Source</th><th style="text-align:left;padding:8px">Incident</th><th style="text-align:left;padding:8px">State</th><th style="text-align:left;padding:8px">First seen</th><th style="text-align:left;padding:8px">Last/Cleared</th><th style="text-align:left;padding:8px">Duration</th></tr></thead>
          <tbody>${rows.map(e=>`<tr>
            <td style="padding:8px">${esc(e.severity)}</td><td style="padding:8px">${esc(e.source)}</td>
            <td style="padding:8px">${esc(e.title)}</td><td style="padding:8px">${esc(e.state)}</td>
            <td style="padding:8px">${esc(fmt(e.firstSeen))}</td><td style="padding:8px">${esc(fmt(e.clearedAt || e.lastSeen))}</td><td style="padding:8px">${esc(duration(e))}</td>
          </tr>`).join('') || '<tr><td colspan="7" style="padding:12px">Chưa có lịch sử sự cố.</td></tr>'}</tbody>
        </table>
      </div>
      <p class="muted" style="margin-top:10px">Lịch sử được lưu bằng localStorage trên trình duyệt này. Không ghi Supabase/production.</p>`;
  }

  function init() {
    const root = document.getElementById('incidentHistory');
    if (!root) return;
    render(load());
    // Incident Engine renders after monitor checks, so sample shortly after page load and after refresh clicks.
    setTimeout(snapshot, 1500);
    const refresh = document.getElementById('refresh');
    if (refresh) refresh.addEventListener('click', () => setTimeout(snapshot, 1200));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
