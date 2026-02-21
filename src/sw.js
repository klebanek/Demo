import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { clientsClaim } from 'workbox-core';

// Force immediate activation and control
self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({url}) => url.origin === 'https://cdnjs.cloudflare.com',
  new CacheFirst({
    cacheName: 'external-resources',
  })
);

const navigationRoute = new NavigationRoute(
    new NetworkFirst({
        cacheName: 'pages',
    })
);
registerRoute(navigationRoute);

setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
        return caches.match('offline.html')
            .then(response => {
                if (response) return response;
                return caches.match('index.html');
            });
    }
    return Response.error();
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Service Worker] Skip waiting requested');
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: 'Workbox-Managed' });
    }
});

self.addEventListener('sync', event => {
    console.log('[Service Worker] Sync event:', event.tag);
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('inovit-haccp-db');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function syncData() {
    console.log('[Service Worker] Syncing data...');
    try {
        const db = await openDB();
        if (db.objectStoreNames.contains('temperatureLog')) {
             const tx = db.transaction(['temperatureLog'], 'readwrite');
             const store = tx.objectStore('temperatureLog');
             const records = await new Promise((resolve, reject) => {
                 const req = store.getAll();
                 req.onsuccess = () => resolve(req.result);
                 req.onerror = () => reject(req.error);
             });

             for (const record of records) {
                 if (!record.synced) {
                     record.synced = true;
                     record.lastSync = new Date().toISOString();
                     store.put(record);
                 }
             }
        }
        console.log('[Service Worker] Data marked as synced');
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
    }
}

self.addEventListener('push', event => {
    const defaultOptions = {
        body: 'Nowe powiadomienie z INOVIT HACCP',
        icon: './icons/icon-192x192.svg',
        badge: './icons/icon-72x72.svg',
        vibrate: [100, 50, 100],
        tag: 'inovit-haccp',
        renotify: true,
    };
    let options = defaultOptions;
    if (event.data) {
        try { options = { ...defaultOptions, ...event.data.json() }; } catch { options.body = event.data.text(); }
    }
    event.waitUntil(self.registration.showNotification('INOVIT HACCP', options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || './';
    if (event.action === 'close') return;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                for (const client of windowClients) {
                    if (client.url.includes('index.html') && 'focus' in client) return client.focus();
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            })
    );
});

console.log('[Service Worker] Workbox loaded');
