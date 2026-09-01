/* CHOCO SHIP - Shipper V2 status bridge */
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

  const observer = new MutationObserver(addButtons);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(addButtons, 1200);
})();
