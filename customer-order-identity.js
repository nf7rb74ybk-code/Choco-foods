(() => {
  'use strict';
  if (window.__chocoCustomerIdentityInstalled) return;
  window.__chocoCustomerIdentityInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();
      if (method === 'POST' && /\/rest\/v1\/orders(?:\?|$)/i.test(url)) {
        const uid = localStorage.getItem('choco_user_id') || '';
        if (uid && init.body) {
          let payload;
          if (typeof init.body === 'string') { try { payload = JSON.parse(init.body); } catch (_) { payload = null; } }
          if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.customer_id == null) {
            payload.customer_id = uid; init = { ...init, body: JSON.stringify(payload) };
            const headers = new Headers(init.headers || {}); if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json'); init.headers = headers;
          }
        }
      }
    } catch (e) { console.warn('[CHOCO SHIP] customer identity hook:', e); }
    return originalFetch(input, init);
  };

  const loadScripts = () => {
    if (!document.querySelector('script[data-choco-account-nav]')) {
      const s=document.createElement('script'); s.src='./customer-account-nav.js?v=20260904-1'; s.async=true; s.dataset.chocoAccountNav='1'; document.head.appendChild(s);
    }
    if (!document.querySelector('script[data-choco-customer-push]')) {
      const s=document.createElement('script'); s.src='./customer-push.js?v=20260904-1'; s.async=true; s.dataset.chocoCustomerPush='1'; document.head.appendChild(s);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadScripts); else loadScripts();
})();
