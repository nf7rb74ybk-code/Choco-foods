/* CHOCO SHIP — OneSignal customer push */
(function () {
  'use strict';
  const APP_ID = '66bec449-f15b-4d0e-90fc-3dc470fef20c';
  const BASE = '/Choco-foods/';
  const WORKER = BASE + 'OneSignalSDKWorker.js';

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function loadSdk() {
    if (window.OneSignalDeferred) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    const s = document.createElement('script');
    s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    s.defer = true;
    document.head.appendChild(s);
  }

  function session() {
    try {
      const x = JSON.parse(localStorage.getItem('sb-guwdswqaqnhzqapflvey-auth-token') || 'null');
      return x?.access_token ? x : null;
    } catch (_) { return null; }
  }

  function uid() {
    const s = session();
    if (s?.user?.id) return String(s.user.id);
    try {
      const p = JSON.parse(localStorage.getItem('choco_user') || 'null');
      if (p?.id) return String(p.id);
    } catch (_) {}
    return localStorage.getItem('choco_user_id') || '';
  }

  async function init() {
    loadSdk();
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (fn, value) => { if (!done) { done = true; fn(value); } };
      window.OneSignalDeferred.push(async function (OneSignal) {
        try {
          await OneSignal.init({
            appId: APP_ID,
            serviceWorkerPath: WORKER,
            serviceWorkerParam: { scope: BASE },
            allowLocalhostAsSecureOrigin: false
          });
          finish(resolve, OneSignal);
        } catch (e) { finish(reject, e); }
      });
      setTimeout(() => finish(reject, Error('OneSignal SDK timeout')), 20000);
    });
  }

  async function enable() {
    const status = document.getElementById('onesignalCustomerStatus');
    const debug = document.getElementById('onesignalCustomerDebug');
    const id = uid();
    try {
      if (!id) throw Error('Chưa đăng nhập tài khoản khách');
      if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator.standalone === true || matchMedia('(display-mode:standalone)').matches)) {
        throw Error('iPhone cần mở CHOCO SHIP từ Màn hình chính (PWA)');
      }
      if (status) status.textContent = '⏳ OneSignal đang khởi tạo...';
      const os = await init();
      await os.login(String(id));
      if (os.Notifications?.isPushSupported && !os.Notifications.isPushSupported()) throw Error('Thiết bị không hỗ trợ OneSignal Push');
      if (os.Notifications && os.Notifications.permission !== 'granted') await os.Notifications.requestPermission();
      if (os.User?.PushSubscription?.optIn) await os.User.PushSubscription.optIn();
      let sid = os.User?.PushSubscription?.id || '';
      for (let i = 0; i < 20 && !sid; i++) {
        await new Promise(r => setTimeout(r, 500));
        sid = os.User?.PushSubscription?.id || '';
      }
      if (!sid || os.User?.PushSubscription?.optedIn === false) throw Error('OneSignal chưa tạo subscription Push trên thiết bị này');
      try { await os.User.addTags({ role: 'customer', app: 'choco-ship' }); } catch (_) {}
      if (status) status.innerHTML = '✅ <b>OneSignal ĐÃ BẬT</b>';
      if (debug) debug.innerHTML = 'Native Web Push + OneSignal đang hoạt động<br>OneSignal subscription: ' + esc(sid);
      localStorage.setItem('choco_onesignal_customer', '1');
    } catch (e) {
      if (status) status.textContent = '⚠️ OneSignal: ' + (e?.message || String(e));
      if (debug) debug.innerHTML += '<br>⚠️ OneSignal: ' + esc(e?.message || String(e));
      console.warn('CHOCO SHIP Customer OneSignal', e);
    }
  }

  function mount() {
    if (document.getElementById('onesignalCustomerBox')) return;
    const box = document.createElement('div');
    box.id = 'onesignalCustomerBox';
    box.style.cssText = 'margin:14px 0;padding:14px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.05)';
    box.innerHTML = '<div style="font-weight:700;margin-bottom:8px">🟣 THÔNG BÁO ONESIGNAL</div><div id="onesignalCustomerStatus" style="font-size:13px;color:#555;margin-bottom:9px">🔔 OneSignal: chưa bật</div><button type="button" id="onesignalCustomerEnable" style="width:100%;border:0;background:#5b21b6;color:#fff;padding:12px;border-radius:10px;font-weight:700">🟣 BẬT ONESIGNAL</button><div id="onesignalCustomerDebug" style="font-size:11px;color:#777;margin-top:8px">Native Web Push + OneSignal • Customer</div>';
    const anchor = document.querySelector('.map-box') || document.querySelector('.container') || document.body;
    anchor.parentNode.insertBefore(box, anchor.nextSibling);
    document.getElementById('onesignalCustomerEnable').onclick = enable;
    if (localStorage.getItem('choco_onesignal_customer') === '1') {
      document.getElementById('onesignalCustomerStatus').textContent = '✅ OneSignal đã bật trên thiết bị này';
    }
  }

  window.addEventListener('load', () => { mount(); loadSdk(); });
  window.chocoEnableCustomerOneSignal = enable;
})();
