self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {

    let data = {};

    try {
        data = event.data
            ? event.data.json()
            : {};
    } catch (error) {

        data = {
            title: "🚚 CHOCO SHIP",
            body: event.data
                ? event.data.text()
                : "🔔 Có đơn hàng mới!"
        };
    }

    const title =
        data.title ||
        "🚚 CHOCO SHIP";

    const body =
        data.body ||
        "🔔 Có đơn hàng mới!";

    const notificationData =
        data.data ||
        {};

    event.waitUntil(

        self.registration.showNotification(
            title,
            {
                body: body,

                icon:
                    "./icon-192.png",

                badge:
                    "./icon-192.png",

                vibrate:
                    [300, 100, 300],

                requireInteraction:
                    true,

                tag:
                    notificationData.orderId
                        ? "order-" +
                        notificationData.orderId
                        : "choco-ship-order",

                renotify:
                    true,

                data: {
                    url:
                        notificationData.url ||
                        "https://nf7rb74ybk-code.github.io/Choco-foods/shipper.html",

                    orderId:
                        notificationData.orderId ||
                        null
                }
            }
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
                : "https://nf7rb74ybk-code.github.io/Choco-foods/shipper.html";

        event.waitUntil(

            self.clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then(clients => {

                for (
                    const client
                    of clients
                ) {

                    if (
                        "focus"
                        in client
                    ) {

                        return client
                            .focus()
                            .then(() => {

                                if (
                                    "navigate"
                                    in client
                                ) {

                                    return client.navigate(
                                        url
                                    );

                                }

                            });

                    }

                }

                if (
                    self.clients.openWindow
                ) {

                    return self.clients.openWindow(
                        url
                    );

                }

            })

        );
    }
);