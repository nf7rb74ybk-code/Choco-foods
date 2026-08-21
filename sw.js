self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        self.clients.claim()
    );
});

self.addEventListener("push", event => {

    let data = {};

    try {
        data = event.data
            ? event.data.json()
            : {};
    } catch (e) {
        data = {
            title: "🚚 CHOCO SHIP",
            body: event.data
                ? event.data.text()
                : "Bạn có đơn hàng mới!"
        };
    }

    const title =
        data.title ||
        "🚚 CHOCO SHIP - ĐƠN MỚI";

    const options = {

        body:
            data.body ||
            "🔔 Bạn có đơn hàng mới!",

        icon:
            data.icon ||
            "./icon-192.png",

        badge:
            data.badge ||
            "./icon-192.png",

        vibrate: [
            300,
            100,
            300
        ],

        requireInteraction: true,

        data: {
            url:
                data.url ||
                "./shipper.html"
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});


self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const url =
            event.notification.data &&
            event.notification.data.url
                ? event.notification.data.url
                : "./shipper.html";

        event.waitUntil(

            self.clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(clients => {

                    for (
                        const client of clients
                    ) {

                        if ("focus" in client) {

                            client.navigate(url);

                            return client.focus();
                        }
                    }

                    if (
                        self.clients.openWindow
                    ) {

                        return self.clients.openWindow(url);

                    }

                })

        );

    }
);