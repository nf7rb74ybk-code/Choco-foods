self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = {
      title: 'CHOCO SHIP',
      body: event.data ? event.data.text() : 'Có thông báo mới'
    };
  }

  const title = data.title || 'CHOCO SHIP';
  const options = {
    body: data.body || 'Có đơn hàng mới!',
    icon: './icon-512x512.png?v=20260827',
    badge: './icon-512x512.png?v=20260827',
    data: {
      url: data.url || './shipper.html',
      code: data.code || '',
      order_id: data.order_id || ''
    },
    tag: data.code ? `order-${data.code}` : 'choco-ship-order',
    renotify: true,
    silent: false,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './shipper.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          return client.navigate(url);
        }
      }
      return clients.openWindow(url);
    })
  );
});
