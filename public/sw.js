const CACHE_NAME = 'studyforge-v1';
const STATIC_CACHE_NAME = 'studyforge-static-v1';
const DYNAMIC_CACHE_NAME = 'studyforge-dynamic-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/study-plans',
  '/api/progress',
  '/api/user'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE_NAME &&
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (request.method === 'GET' && API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(
      handleApiRequest(request)
    );
  }
  // Handle static assets
  else if (request.method === 'GET' && STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      handleStaticRequest(request)
    );
  }
  // Handle navigation requests
  else if (request.mode === 'navigate') {
    event.respondWith(
      handleNavigationRequest(request)
    );
  }
  // Handle other requests
  else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return offline fallback if available
          return getOfflineFallback(request);
        })
    );
  }
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      caches.open(DYNAMIC_CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseClone);
        });
      return networkResponse;
    }
  } catch (error) {
    console.log('Network failed, trying cache:', error);
  }

  // Try cache if network fails
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('Serving from cache');
    return cachedResponse;
  }

  // Return offline indicator for API requests
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline'
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseClone);
        });
      return networkResponse;
    }
  } catch (error) {
    console.log('Failed to fetch static asset:', error);
  }

  return getOfflineFallback(request);
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('Navigation failed, serving offline page:', error);
  }

  // Try to serve cached page
  const cachedResponse = await caches.match('/');
  if (cachedResponse) {
    return cachedResponse;
  }

  // Serve offline page
  const offlineResponse = await caches.match('/offline.html');
  if (offlineResponse) {
    return offlineResponse;
  }

  // Fallback to basic offline message
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - StudyForge</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background: #f5f5f5;
        }
        .offline-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        p { color: #666; margin: 20px 0; }
        .retry-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          margin: 10px;
        }
        .retry-btn:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <h1>You're Offline</h1>
        <p>StudyForge is not available right now because you're offline.</p>
        <p>Some features may still work using cached data.</p>
        <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        <button class="retry-btn" onclick="window.history.back()">Go Back</button>
      </div>
    </body>
    </html>
    `,
    {
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Get offline fallback for different request types
async function getOfflineFallback(request) {
  const url = new URL(request.url);

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
  }

  // Return offline message for other requests
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Content not available offline'
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'study-progress-sync') {
    event.waitUntil(syncStudyProgress());
  } else if (event.tag === 'offline-actions-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync study progress when back online
async function syncStudyProgress() {
  try {
    // Get pending progress updates from IndexedDB
    const pendingUpdates = await getPendingProgressUpdates();

    for (const update of pendingUpdates) {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update)
      });
    }

    // Clear synced updates
    await clearPendingProgressUpdates();
    console.log('Study progress synced successfully');
  } catch (error) {
    console.error('Failed to sync study progress:', error);
  }
}

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();

    for (const action of pendingActions) {
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
    }

    // Clear synced actions
    await clearPendingActions();
    console.log('Offline actions synced successfully');
  } catch (error) {
    console.error('Failed to sync offline actions:', error);
  }
}

// IndexedDB helper functions for offline storage
class OfflineStorage {
  constructor() {
    this.dbName = 'StudyForgeOfflineDB';
    this.version = 1;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('pendingProgress')) {
          const progressStore = db.createObjectStore('pendingProgress', { keyPath: 'id', autoIncrement: true });
          progressStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('pendingActions')) {
          const actionsStore = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
          actionsStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          db.createObjectStore('cachedData', { keyPath: 'url' });
        }
      };
    });
  }

  async storePendingProgress(progressData) {
    const db = await this.openDB();
    const transaction = db.transaction(['pendingProgress'], 'readwrite');
    const store = transaction.objectStore('pendingProgress');

    return new Promise((resolve, reject) => {
      const request = store.add({
        ...progressData,
        timestamp: Date.now(),
        synced: false
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingProgressUpdates() {
    const db = await this.openDB();
    const transaction = db.transaction(['pendingProgress'], 'readonly');
    const store = transaction.objectStore('pendingProgress');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingProgressUpdates() {
    const db = await this.openDB();
    const transaction = db.transaction(['pendingProgress'], 'readwrite');
    const store = transaction.objectStore('pendingProgress');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async storePendingAction(actionData) {
    const db = await this.openDB();
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');

    return new Promise((resolve, reject) => {
      const request = store.add({
        ...actionData,
        timestamp: Date.now(),
        synced: false
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions() {
    const db = await this.openDB();
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingActions() {
    const db = await this.openDB();
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Create global instance
const offlineStorage = new OfflineStorage();
