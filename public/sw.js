// public/sw.js
// Push мэдэгдэл (Nearby Alert) хүлээн авах, харуулах service worker

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'МӨР', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'МӨР — шинэ мэдэгдэл';
  const options = {
    body: data.body || 'Танай дүүрэгт шинэ алдсан/олдсон амьтан бүртгэгдлээ.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/listings' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/listings';
  event.waitUntil(clients.openWindow(url));
});
