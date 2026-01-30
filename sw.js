/**
 * INOVIT HACCP - Service Worker v2.0
 * @description PWA service worker with cache-first strategy and update notifications
 */

const CACHE_NAME = 'inovit-haccp-v2.1.0';
const OFFLINE_PAGE = './offline.html';

const urlsToCache = [
    './',
    './index.html',
    './offline.html',
    './css/styles.css',
    './js/config.js',
    './js/utils.js',
    './js/validators.js',
    './js/storage.js',
    './js/notifications.js',
    './js/modal.js',
    './js/navigation.js',
    './js/templates.js',
    './js/crud.js',
    './js/pdf-export.js',
    './js/reminders.js',
    './js/app.js',
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
    console.log('[Service Worker] Installing v2.1...');

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
    console.log('[Service Worker] Activating v2.1...');

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

async function syncData() {
    console.log('[Service Worker] Syncing data...');
    // In production, this would sync local data with a server
    // For now, we just log the sync attempt
    try {
        // Get all clients and notify them
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

// Push Notifications
self.addEventListener('push', event => {
    const defaultOptions = {
        body: 'Nowe powiadomienie z INOVIT HACCP',
        icon: './icons/icon-192x192.svg',
        badge: './icons/icon-72x72.svg',
        vibrate: [100, 50, 100],
        tag: 'inovit-haccp',
        renotify: true,
        data: {
            dateOfArrival: Date.now(),
            url: './'
        },
        actions: [
            {
                action: 'open',
                title: 'Otwórz',
                icon: './icons/icon-96x96.svg'
            },
            {
                action: 'close',
                title: 'Zamknij'
            }
        ]
    };

    let options = defaultOptions;

    if (event.data) {
        try {
            const data = event.data.json();
            options = { ...defaultOptions, ...data };
        } catch {
            options.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification('INOVIT HACCP', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || './';

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes('index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'check-reminders') {
        event.waitUntil(checkReminders());
    }
});

async function checkReminders() {
    console.log('[Service Worker] Checking reminders...');
    // This would check for upcoming deadlines and show notifications
    // Implementation depends on server-side support
}

console.log('[Service Worker] Loaded successfully');
