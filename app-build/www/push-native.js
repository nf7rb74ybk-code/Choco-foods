// CHOCO SHIP - Native Push bridge
// Loaded safely in Capacitor. Web/PWA can ignore it when Capacitor is unavailable.
(function () {
  const NativePush = {
    supported() {
      return !!window.Capacitor && !!window.Capacitor.Plugins?.PushNotifications;
    },
    async init() {
      if (!this.supported()) return { ok: false, reason: 'Capacitor PushNotifications unavailable' };
      const Push = window.Capacitor.Plugins.PushNotifications;
      const perm = await Push.checkPermissions();
      let receive = perm.receive;
      if (receive !== 'granted') {
        const requested = await Push.requestPermissions();
        receive = requested.receive;
      }
      if (receive !== 'granted') return { ok: false, permission: receive };
      await Push.register();
      Push.addListener('registration', token => {
        console.log('[CHOCO NATIVE PUSH] token:', token.value);
        window.dispatchEvent(new CustomEvent('choco-native-push-token', { detail: token.value }));
      });
      Push.addListener('registrationError', err => console.error('[CHOCO NATIVE PUSH] registration error', err));
      Push.addListener('pushNotificationReceived', notification => {
        console.log('[CHOCO NATIVE PUSH] received:', notification);
        window.dispatchEvent(new CustomEvent('choco-native-push-received', { detail: notification }));
      });
      Push.addListener('pushNotificationActionPerformed', action => {
        console.log('[CHOCO NATIVE PUSH] action:', action);
        window.dispatchEvent(new CustomEvent('choco-native-push-action', { detail: action }));
      });
      return { ok: true, permission: receive };
    }
  };
  window.CHOCO_NATIVE_PUSH = NativePush;
})();
