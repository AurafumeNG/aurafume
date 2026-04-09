// Custom service worker additions — compiled and merged into sw.js by @ducanh2912/next-pwa
// @ts-nocheck — compiled by webpack with service-worker lib, not the main TS config

/* eslint-disable no-restricted-globals */

interface PushPayload {
  title: string;
  body:  string;
  icon?: string;
  data?: { url?: string };
}

// ── Push event — show notification ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:  payload.body,
      icon:  payload.icon ?? '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data:  payload.data,
      vibrate: [200, 100, 200],
    }),
  );
});

// ── Notification click — open / focus the relevant page ───────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url ?? '/account/orders';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab on the target URL if one is open
        for (const client of clientList) {
          if (client.url.endsWith(targetUrl) && 'focus' in client) {
            return (client as WindowClient).focus();
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
