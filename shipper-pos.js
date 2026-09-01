/* CHOCO SHIP - Shipper V2 status bridge + GPS */
'use strict';
(function () {
  const SB = 'https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY = 'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN = localStorage.getItem('choco_access_token') || '';
  const UID = localStorage.getItem('choco_user_id') || '';
  const ROLE = localStorage.getItem('choco_role') || '';
  if (!TOKEN || !UID || ROLE !== 'shipper') return;

  async function api(path, options = {}) {
    return fetch(SB + path, {
      ...options,
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + TOKEN,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  }

  function esc(x) {
    return String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  const flow = {
    'Đã nhận': { next: 'Đang lấy hàng', label: '📦 BẮT ĐẦU LẤY HÀNG' },
    'Đang lấy hàng': { next: 'Đang giao', label: '🛵 BẮT ĐẦU GIAO' },
    'Đang giao': { next: 'Hoàn thành', label: '✅ GIAO THÀNH CÔNG' }
  };

  async function changeStatus(id, code, expected, next, button) {
    if (!confirm('Xác nhận đơn ' + code + ': ' + expected + ' → ' + next + '?')) return;
    button.disabled = true;
    button.textContent = '⏳ Đang cập nhật...';
    try {
      const r = await api('/rest/v1/orders?id=eq.' + encodeURIComponent(id) + '&shipper_id=eq.' + encodeURIComponent(UID) + '&status=eq.' + encodeURIComponent(expected), {
        method: 'PATCH',
        body: JSON.stringify({ status: next })
      });
      if (!r.ok) throw Error(await r.text());
      location.reload();
    } catch (e) {
      button.disabled = false;
      button.textContent = flow[expected]?.label || 'CẬP NHẬT';
      alert('❌ ' + (e.message || e));
    }
  }

  function addButtons() {
    document.querySelectorAll('.order').forEach(card => {
      if (card.querySelector('[data-v2-status]')) return;
      const first = card.querySelector('b');
      if (!first) return;
      const code = (first.textContent || '').trim();
      if (!/^CS/i.test(code)) return;
      const statusText = card.querySelector('p')?.textContent || '';
      const status = Object.keys(flow).find(s => statusText.includes(s));
      if (!status) return;

      const wrap = document.createElement('div');
      wrap.style.cssText = 'margin-top:9px';
      const btn = document.createElement('button');
      btn.className = 'action';
      btn.dataset.v2Status = '1';
      btn.textContent = flow[status].label;
      btn.onclick = async () => {
        try {
          const r = await api('/rest/v1/orders?code=eq.' + encodeURIComponent(code) + '&shipper_id=eq.' + encodeURIComponent(UID) + '&select=id,code,status,shipper_id');
          const rows = await r.json();
          if (!r.ok || !rows[0]) throw Error('Không tìm thấy đơn của bạn.');
          await changeStatus(rows[0].id, rows[0].code, status, flow[status].next, btn);
        } catch (e) {
          alert('❌ ' + (e.message || e));
        }
      };
      wrap.appendChild(btn);
      card.appendChild(wrap);
    });
  }

  // GPS V2: update own live position and append history while the Shipper page is open.
  let watchId = null;
  let lastHistoryAt = 0;
  let lastLat = null;
  let lastLng = null;

  function ensureGpsUI() {
    if (document.getElementById('shipperV2Gps')) return;
    const box = document.createElement('div');
    box.id = 'shipperV2Gps';
    box.className = 'box';
    box.innerHTML = '<b>📍 GPS SHIPPER V2</b><div id="shipperV2GpsStatus" class="small" style="margin:7px 0">Chưa bật GPS.</div><button id="shipperV2GpsBtn" class="action">📍 BẬT GPS SHIPPER</button>';
    const main = document.querySelector('main') || document.body;
    main.insertBefore(box, main.firstChild);
    document.getElementById('shipperV2GpsBtn').onclick = startGps;
  }

  function gpsStatus(text, ok) {
    const el = document.getElementById('shipperV2GpsStatus');
    const btn = document.getElementById('shipperV2GpsBtn');
    if (el) { el.textContent = text; el.style.color = ok ? '#166534' : '#991b1b'; }
    if (btn) btn.textContent = ok ? '✅ GPS ĐANG HOẠT ĐỘNG' : '📍 BẬT GPS SHIPPER';
  }

  async function saveGps(lat, lng) {
    try {
      const r = await api('/rest/v1/profiles?id=eq.' + encodeURIComponent(UID), {
        method: 'PATCH',
        body: JSON.stringify({ latitude: lat, longitude: lng, is_online: true, last_seen: new Date().toISOString() })
      });
      if (!r.ok) throw Error(await r.text());

      if (Date.now() - lastHistoryAt >= 25000) {
        const h = await api('/rest/v1/shipper_gps_history', {
          method: 'POST',
          body: JSON.stringify({ shipper_id: UID, latitude: lat, longitude: lng })
        });
        if (!h.ok) console.warn('GPS history:', await h.text());
        else lastHistoryAt = Date.now();
      }
    } catch (e) {
      console.warn('GPS save:', e);
      gpsStatus('⚠️ GPS lấy được nhưng chưa lưu được lên máy chủ.', false);
    }
  }

  function onGps(position) {
    lastLat = Number(position.coords.latitude);
    lastLng = Number(position.coords.longitude);
    gpsStatus('🟢 GPS hoạt động • ' + lastLat.toFixed(6) + ', ' + lastLng.toFixed(6), true);
    saveGps(lastLat, lastLng);
  }

  function onGpsError(err) {
    const msg = err.code === 1 ? '❌ Bạn chưa cho phép quyền vị trí.' : err.code === 2 ? '❌ Không xác định được vị trí.' : '❌ GPS hết thời gian chờ.';
    gpsStatus(msg, false);
  }

  function startGps() {
    if (!navigator.geolocation) return gpsStatus('❌ Thiết bị không hỗ trợ GPS.', false);
    if (watchId !== null) return gpsStatus('🟢 GPS hoạt động.', true);
    const btn = document.getElementById('shipperV2GpsBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ ĐANG LẤY GPS...'; }
    navigator.geolocation.getCurrentPosition(onGps, onGpsError, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    watchId = navigator.geolocation.watchPosition(onGps, onGpsError, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  }

  const observer = new MutationObserver(addButtons);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(addButtons, 1200);
  setTimeout(ensureGpsUI, 500);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && lastLat !== null) saveGps(lastLat, lastLng);
  });

  window.addEventListener('pagehide', () => {
    if (watchId !== null) { try { navigator.geolocation.clearWatch(watchId); } catch {} }
    fetch(SB + '/rest/v1/profiles?id=eq.' + encodeURIComponent(UID), {
      method: 'PATCH', keepalive: true,
      headers: { apikey: KEY, Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
    }).catch(() => {});
  });
})();
