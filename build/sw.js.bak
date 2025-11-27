self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());

self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'EATFORCE', body: 'Time to dominate.' };
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'eatforce-alert'
  });
});