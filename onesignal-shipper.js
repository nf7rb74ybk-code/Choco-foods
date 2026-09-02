/* CHOCO SHIP — OneSignal fallback for production shipper */
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
    const status = document.getElementById('onesignalStatus');
    const debug = document.getElementById('debug');
    const uid = localStorage.getItem('choco_user_id') || '';
    try {
      if (!uid) throw Error('Không xác định được tài khoản Shipper');
      if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator.standalone === true || matchMedia('(display-mode:standalone)').matches)) {
        throw Error('iPhone cần mở CHOCO SHIP từ Màn hình chính (PWA)');
      }
      if (status) status.textContent = '⏳ OneSignal đang khởi tạo...';
      const os = await init();
      await os.login(String(uid));
      if (os.Notifications?.isPushSupported && !os.Notifications.isPushSupported()) throw Error('Thiết bị không hỗ trợ OneSignal Push');
      if (os.Notifications && os.Notifications.permission !== 'granted') await os.Notifications.requestPermission();
      if (os.User?.PushSubscription?.optIn) await os.User.PushSubscription.optIn();
      let id = os.User?.PushSubscription?.id || '';
      for (let i = 0; i < 20 && !id; i++) {
        await new Promise(r => setTimeout(r, 500));
        id = os.User?.PushSubscription?.id || '';
      }
      if (!id || os.User?.PushSubscription?.optedIn === false) throw Error('OneSignal chưa tạo subscription Push trên thiết bị này');
      try { await os.User.addTags({ role: 'shipper', app: 'choco-ship' }); } catch (_) {}
      if (status) status.innerHTML = '✅ <b>OneSignal ĐÃ BẬT</b>';
      if (debug) debug.innerHTML = 'Native Web Push + OneSignal đang hoạt động<br>OneSignal subscription: ' + esc(id);
      localStorage.setItem('choco_onesignal_shipper', '1');
    } catch (e) {
      if (status) status.textContent = '⚠️ OneSignal: ' + (e?.message || String(e));
      if (debug) debug.innerHTML += '<br>⚠️ OneSignal: ' + esc(e?.message || String(e));
      console.warn('CHOCO SHIP OneSignal', e);
    }
  }

  function mount() {
    const box = document.querySelector('.notice');
    if (!box || document.getElementById('onesignalStatus')) return;
    const p = document.createElement('p');
    p.id = 'onesignalStatus';
    p.textContent = '🔔 OneSignal: chưa bật';
    const b = document.createElement('button');
    b.className = 'test';
    b.textContent = '🔔 BẬT ONESIGNAL';
    b.onclick = enable;
    box.appendChild(p);
    box.appendChild(b);
  }

  window.addEventListener('load', () => { mount(); loadSdk(); });
  window.chocoEnableOneSignal = enable;
})();
