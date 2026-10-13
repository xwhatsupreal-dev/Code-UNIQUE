// Service Worker for ONE PUNCH MAN: The Strongest Redeem Codes
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: '⚡ มีโค้ดใหม่ OPM: The Strongest!',
    body: 'โค้ดแจกเพชรและตั๋วสุ่มใหม่เข้ามาแล้ว กดเพื่อดูและคัดลอกทันที!',
    icon: '/icon-192.png',
    data: { url: '/' }
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.icon,
      vibrate: [200, 100, 200],
      data: data.data,
      actions: [
        { action: 'copy', title: 'คัดลอกโค้ด' },
        { action: 'open', title: 'เปิดดูในเว็บ' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
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
