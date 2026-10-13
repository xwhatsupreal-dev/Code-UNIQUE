// Service Worker for ONE PUNCH MAN: The Strongest Redeem Codes
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'OPM The Strongest - โค้ดใหม่',
    body: 'อัปเดตโค้ดของขวัญเซิร์ฟเวอร์ SEA ใหม่ แตะเพื่อดูโค้ด',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/badge-96.png',
      tag: 'opm-code-updates',
      renotify: false,
      data: data.data || { url: '/' },
      actions: [
        { action: 'open', title: 'เปิดดูโค้ด' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
