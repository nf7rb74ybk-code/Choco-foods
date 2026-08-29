/* CHOCO SHIP - Native app compatibility bridge.
 * Kept intentionally small: no payment/device permissions and no direct database writes.
 * Provides safe helpers for the Shipper UI without affecting the Web/PWA app.
 */
(() => {
  'use strict';

  const POS = {
    version: '1.0.0',
    isNative() {
      return !!window.Capacitor?.isNativePlatform?.();
    },
    platform() {
      return window.Capacitor?.getPlatform?.() || 'web';
    },
    async init() {
      return { ok: true, native: this.isNative(), platform: this.platform(), version: this.version };
    },
    notify(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('choco-pos-message', {
        detail: { message: String(message || ''), type }
      }));
    }
  };

  window.CHOCO_SHIPPER_POS = POS;
  window.CHOCO_SHIPPER_POS_READY = true;
})();
