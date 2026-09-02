self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

async function showLocalTest() {
  await self.registration.showNotification('🔔 CHOCO SHIP - TEST', {
    body: 'Thông báo nội bộ trên iPhone/PWA đang hoạt động.',
    icon: './icon-512x512.png?v=20260902',
    badge: './icon-512x512.png?v=20260902',
    tag: 'choco-ship-local-test',
    renotify: true,
    silent: false,
    data: { url: './shipper.html' }
  });
}

self.addEventListener('message', event => {
  if (event.data?.type !== 'LOCAL_TEST_NOTIFICATION') return;
  event.waitUntil(showLocalTest());
});

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: 'CHOCO SHIP', body: event.data ? event.data.text() : 'Có thông báo mới' };
  }

  event.waitUntil(self.registration.showNotification(data.title || 'CHOCO SHIP', {
    body: data.body || 'Có đơn hàng mới!',
    icon: './icon-512x512.png?v=20260902',
    badge: './icon-512x512.png?v=20260902',
    data: { url: data.url || './shipper.html', code: data.code || '', order_id: data.order_id || '' },
    tag: data.code ? `order-${data.code}` : 'choco-ship-order',
    renotify: true,
    silent: false,
    timestamp: Date.now()
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './shipper.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if ('focus' in client) {
        client.focus();
        return client.navigate(url);
      }
    }
    return clients.openWindow(url);
  }));
});