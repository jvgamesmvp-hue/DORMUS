self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { body: event.data ? event.data.text() : '' };
  }

  var title = payload.title || (payload.notification && payload.notification.title) || 'DORMUS';
  var options = {
    body: payload.body || payload.message || (payload.notification && payload.notification.body) || 'Você tem uma nova notificação.',
    icon: payload.icon || './icons/dormus-classic-192.png',
    badge: payload.badge || './icons/dormus-classic-192.png',
    tag: payload.tag || 'dormus-notification',
    data: { url: payload.url || './' },
    renotify: Boolean(payload.renotify)
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var destination = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (var index = 0; index < windowClients.length; index += 1) {
        var client = windowClients[index];
        if (client.url.startsWith(self.registration.scope)) {
          if (client.navigate) client.navigate(destination);
          return client.focus();
        }
      }
      return self.clients.openWindow(destination);
    })
  );
});