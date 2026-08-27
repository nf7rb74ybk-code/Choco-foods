/* CHOCO SHIP - POS completion bridge
   Safe add-on: does not replace Web Push or OneSignal.
*/
'use strict';
(function () {
  const SB = 'https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY = 'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN = localStorage.getItem('choco_access_token') || '';
  const UID = localStorage.getItem('choco_user_id') || '';
  const ROLE = localStorage.getItem('choco_role') || '';

  if (!TOKEN || !UID || ROLE !== 'shipper') return;

  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

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

  async function completeOrder(id, code) {
    if (!code) throw Error('Không tìm thấy mã đơn CSxxxxxx');

    if (!confirm('Xác nhận giao thành công đơn ' + code + '?')) return;

    const button = document.querySelector('[data-complete-order="' + CSS.escape(String(id)) + '"]');
    if (button) { button.disabled = true; button.textContent = '⏳ Đang xác nhận...'; }

    try {
      // Only the current shipper's order can be completed.
      const check = await api('/rest/v1/orders?id=eq.' + encodeURIComponent(id) + '&shipper_id=eq.' + encodeURIComponent(UID) + '&select=id,code,status,shipper_id');
      const rows = await check.json();
      if (!check.ok) throw Error(rows?.message || rows?.hint || JSON.stringify(rows));
      const order = rows[0];
      if (!order) throw Error('Không tìm thấy đơn hoặc đơn không thuộc shipper này.');
      if (String(order.code || '') !== String(code)) throw Error('Mã đơn không khớp.');

      // Mark delivery complete first. Push code is untouched.
      const patch = await api('/rest/v1/orders?id=eq.' + encodeURIComponent(id) + '&shipper_id=eq.' + encodeURIComponent(UID), {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Hoàn thành' })
      });
      if (!patch.ok) throw Error(await patch.text());

      // Atomic/idempotent POS sync via Supabase RPC. Unique order_id/order_code prevent duplicates.
      const rpc = await api('/rest/v1/rpc/complete_order_to_pos', {
        method: 'POST',
        body: JSON.stringify({ p_order_code: code })
      });
      const text = await rpc.text();
      let data = {};
      try { data = JSON.parse(text); } catch (_) {}
      if (!rpc.ok) throw Error(data?.message || data?.error || text || ('RPC HTTP ' + rpc.status));

      alert(data?.already_synced ? '✅ Đơn đã có trong POS, không tạo trùng.' : '✅ Giao thành công và đã đưa đơn vào POS.');
      location.reload();
    } catch (e) {
      if (button) { button.disabled = false; button.textContent = '✅ GIAO THÀNH CÔNG'; }
      alert('❌ Không hoàn tất được đơn:\n' + e.message);
    }
  }

  function addButtons() {
    document.querySelectorAll('.order').forEach(card => {
      if (card.querySelector('[data-complete-order]')) return;
      const first = card.querySelector('b');
      if (!first) return;
      const code = (first.textContent || '').trim();
      if (!/^CS/i.test(code)) return;

      // Find the order id from existing action buttons: accept(id) is present only for pending orders.
      // For active orders, fetch the matching code from Supabase to avoid guessing an ID.
      const wrap = document.createElement('div');
      wrap.style.cssText = 'margin-top:9px';
      const btn = document.createElement('button');
      btn.className = 'action';
      btn.textContent = '✅ GIAO THÀNH CÔNG';
      btn.dataset.completeOrder = code;
      btn.onclick = async function () {
        btn.disabled = true;
        btn.textContent = '⏳ Đang tìm đơn...';
        try {
          const r = await api('/rest/v1/orders?code=eq.' + encodeURIComponent(code) + '&shipper_id=eq.' + encodeURIComponent(UID) + '&select=id,code,status,shipper_id');
          const rows = await r.json();
          if (!r.ok || !rows[0]) throw Error('Không tìm thấy đơn CSxxxxxx của bạn.');
          await completeOrder(rows[0].id, rows[0].code);
        } catch (e) {
          btn.disabled = false;
          btn.textContent = '✅ GIAO THÀNH CÔNG';
          alert('❌ ' + e.message);
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
