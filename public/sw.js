/**
 * INOVIT HACCP - Service Worker
 * @version 2.3.1
 * @description Offline-first capabilities with cache-first strategy and update notifications
 */

const CACHE_NAME = 'inovit-haccp-v2.3.1';
const OFFLINE_PAGE = './offline.html';

const urlsToCache = [
    './',
    './index.html',
    './offline.html',
    './src/css/styles.css',
    './src/js/config.js',
    './src/js/utils.js',
    './src/js/validators.js',
    './src/js/storage.js',
    './src/js/notifications.js',
    './src/js/modal.js',
    './src/js/navigation.js',
    './src/js/templates.js',
    './src/js/crud.js',
    './src/js/pdf-export.js',
    './src/js/reminders.js',
    './src/js/dashboard-kpi.js',
    './src/js/global-search.js',
    './src/js/audit-log.js',
    './src/js/csv-export.js',
    './src/js/dark-mode.js',
    './src/js/app.js',
    './manifest.json',
    './icons/icon-72x72.svg',
    './icons/icon-96x96.svg',
    './icons/icon-128x128.svg',
    './icons/icon-144x144.svg',
    './icons/icon-152x152.svg',
    './icons/icon-192x192.svg',
    './icons/icon-384x384.svg',
    './icons/icon-512x512.svg'
];

// External resources to cache
const externalResources = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install Service Worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing v2.3.1...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                // Cache local resources
                return cache.addAll(urlsToCache)
                    .then(() => {
                        // Cache external resources (non-blocking)
                        return Promise.allSettled(
                            externalResources.map(url =>
                                fetch(url, { mode: 'cors' })
                                    .then(response => {
                                        if (response.ok) {
                                            return cache.put(url, response);
                                        }
                                    })
                                    .catch(() => console.warn('[SW] Failed to cache:', url))
                            )
                        );
                    });
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('[Service Worker] Install failed:', error);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating v2.3.1...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch Strategy: Cache First, then Network with Offline Fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // Return cached response if found
                if (cachedResponse) {
                    // Fetch update in background (stale-while-revalidate for HTML)
                    if (request.headers.get('accept')?.includes('text/html')) {
                        fetchAndCache(request);
                    }
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(request)
                    .then(response => {
                        // Check if valid response
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Don't cache if type is opaque (cross-origin without CORS)
                        if (response.type === 'opaque') {
                            return response;
                        }

                        // Clone and cache the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.warn('[Service Worker] Fetch failed:', error);

                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match(OFFLINE_PAGE)
                                .then(offlineResponse => {
                                    if (offlineResponse) {
                                        return offlineResponse;
                                    }
                                    // Fallback to index.html
                                    return caches.match('./index.html');
                                });
                        }

                        // Return a simple error response for other requests
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Helper function to fetch and update cache
function fetchAndCache(request) {
    fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, response));
            }
        })
        .catch(() => {
            // Silently fail - we already have cached version
        });
}

// Handle skip waiting message from client
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Service Worker] Skip waiting requested');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Background Sync for data
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
        // Example: Mark all records in 'temperatureLog' as synced
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

        // Notify clients
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

// Push Notifications (simplified for brevity, kept from original)
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

// Notification click handler
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

console.log('[Service Worker] Loaded successfully');
