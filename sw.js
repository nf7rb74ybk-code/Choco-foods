self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// OneSignal manages push events for this site.
// Do not register a second custom `push` handler here because it can
// conflict with OneSignal's service worker and cause duplicate/missing
// notifications.

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const url =
    event.notification?.data?.url ||
    "https://nf7rb74ybk-code.github.io/Choco-foods/shipper.html";

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clients => {
      for (const client of clients) {
        if ("focus" in client) {
          return client.focus().then(() => {
            if ("navigate" in client && client.url !== url) {
              return client.navigate(url);
            }
          });
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
