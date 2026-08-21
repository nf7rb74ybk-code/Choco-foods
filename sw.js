self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {

    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = {
            title: "🚚 CHOCO SHIP",
            body: event.data
                ? event.data.text()
                : "Bạn có đơn hàng mới!"
        };
    }

    event.waitUntil(
        self.registration.showNotification(
            data.title || "🚚 CHOCO SHIP",
            {
                body: data.body || "Bạn có đơn hàng mới!",
                icon: "./icon-192.png",
                badge: "./icon-192.png",
                vibrate: [300,100,300],
                requireInteraction: true,
                data: {
                    url: "./shipper.html"
                }
            }
        )
    );
});

self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(list => {

            for (const client of list) {

                if ("focus" in client) {
                    client.navigate("./shipper.html");
                    return client.focus();
                }

            }

            if (self.clients.openWindow) {
                return self.clients.openWindow("./shipper.html");
            }

        })
    );
});