// Offline Storage Manager for StudyForge
// Handles caching and offline functionality

interface StudyPlan {
  id: string;
  user_id: string;
  updated_at: string;
  [key: string]: unknown;
}

interface PlanItem {
  id: string;
  study_plan_id: string;
  updated_at: string;
  [key: string]: unknown;
}

interface SyncOperation {
  id: string;
  type: string;
  data: unknown;
  timestamp: string;
  status: string;
  completed_at?: string;
}

interface OfflineAction {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
  status: string;
}

class OfflineStorageManager {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null;

  constructor() {
    this.dbName = 'StudyForgeOfflineDB';
    this.version = 1;
    this.db = null;
  }

  // Initialize IndexedDB
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const target = event.target as IDBOpenDBRequest;
        const db = target.result;

        if (!db) return;

        // Study plans cache
        if (!db.objectStoreNames.contains('cachedStudyPlans')) {
          const plansStore = db.createObjectStore('cachedStudyPlans', { keyPath: 'id' });
          plansStore.createIndex('user_id', 'user_id');
          plansStore.createIndex('updated_at', 'updated_at');
        }

        // Plan items cache
        if (!db.objectStoreNames.contains('cachedPlanItems')) {
          const itemsStore = db.createObjectStore('cachedPlanItems', { keyPath: 'id' });
          itemsStore.createIndex('study_plan_id', 'study_plan_id');
          itemsStore.createIndex('updated_at', 'updated_at');
        }

        // Progress logs cache
        if (!db.objectStoreNames.contains('cachedProgress')) {
          const progressStore = db.createObjectStore('cachedProgress', { keyPath: 'id' });
          progressStore.createIndex('user_id', 'user_id');
          progressStore.createIndex('created_at', 'created_at');
        }

        // Pending sync operations
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('type', 'type');
        }

        // Offline actions queue
        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
          actionsStore.createIndex('timestamp', 'timestamp');
          actionsStore.createIndex('status', 'status');
        }
      };
    });
  }

  // Cache study plans
  async cacheStudyPlans(plans: StudyPlan[]): Promise<void> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['cachedStudyPlans'], 'readwrite');
    const store = transaction.objectStore('cachedStudyPlans');

    plans.forEach((plan: StudyPlan) => {
      store.put({
        ...plan,
        cached_at: new Date().toISOString(),
        sync_status: 'synced'
      });
    });

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get cached study plans
  async getCachedStudyPlans(userId: string): Promise<StudyPlan[]> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['cachedStudyPlans'], 'readonly');
    const store = transaction.objectStore('cachedStudyPlans');
    const index = store.index('user_id');

    return new Promise<StudyPlan[]>((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result as StudyPlan[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Cache plan items
  async cachePlanItems(items: PlanItem[]): Promise<void> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['cachedPlanItems'], 'readwrite');
    const store = transaction.objectStore('cachedPlanItems');

    items.forEach((item: PlanItem) => {
      store.put({
        ...item,
        cached_at: new Date().toISOString(),
        sync_status: 'synced'
      });
    });

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get cached plan items
  async getCachedPlanItems(studyPlanId: string): Promise<PlanItem[]> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['cachedPlanItems'], 'readonly');
    const store = transaction.objectStore('cachedPlanItems');
    const index = store.index('study_plan_id');

    return new Promise<PlanItem[]>((resolve, reject) => {
      const request = index.getAll(studyPlanId);
      request.onsuccess = () => resolve(request.result as PlanItem[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Add pending sync operation
  async addPendingSync(operation: SyncOperation): Promise<IDBValidKey> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');

    return new Promise<IDBValidKey>((resolve, reject) => {
      const request = store.add({
        ...operation,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending sync operations
  async getPendingSync(): Promise<SyncOperation[]> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['pendingSync'], 'readonly');
    const store = transaction.objectStore('pendingSync');
    const index = store.index('status');

    return new Promise<SyncOperation[]>((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result as SyncOperation[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Mark sync as completed
  async markSyncCompleted(id: string): Promise<void> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');

    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result as SyncOperation;
        if (record) {
          record.status = 'completed';
          record.completed_at = new Date().toISOString();
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Add offline action
  async addOfflineAction(action: OfflineAction): Promise<IDBValidKey> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');

    return new Promise<IDBValidKey>((resolve, reject) => {
      const request = store.add({
        ...action,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get offline actions
  async getOfflineActions(): Promise<OfflineAction[]> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    const index = store.index('status');

    return new Promise<OfflineAction[]>((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result as OfflineAction[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear offline storage
  async clearStorage(): Promise<void> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const transaction = db.transaction(
      ['cachedStudyPlans', 'cachedPlanItems', 'cachedProgress', 'pendingSync', 'offlineActions'],
      'readwrite'
    );

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      transaction.objectStore('cachedStudyPlans').clear();
      transaction.objectStore('cachedPlanItems').clear();
      transaction.objectStore('cachedProgress').clear();
      transaction.objectStore('pendingSync').clear();
      transaction.objectStore('offlineActions').clear();
    });
  }

  // Get storage stats
  async getStorageStats(): Promise<{
    cachedStudyPlans: number;
    cachedPlanItems: number;
    cachedProgress: number;
    pendingSync: number;
    offlineActions: number;
  }> {
    const db = await this.init();
    if (!db) throw new Error('Database not initialized');

    const stats = {
      cachedStudyPlans: 0,
      cachedPlanItems: 0,
      cachedProgress: 0,
      pendingSync: 0,
      offlineActions: 0
    };

    const transaction = db.transaction(
      ['cachedStudyPlans', 'cachedPlanItems', 'cachedProgress', 'pendingSync', 'offlineActions'],
      'readonly'
    );

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(stats);
      transaction.onerror = () => reject(transaction.error);

      const plansStore = transaction.objectStore('cachedStudyPlans');
      const itemsStore = transaction.objectStore('cachedPlanItems');
      const progressStore = transaction.objectStore('cachedProgress');
      const syncStore = transaction.objectStore('pendingSync');
      const actionsStore = transaction.objectStore('offlineActions');

      plansStore.count().onsuccess = (e) => {
        const target = e.target as IDBRequest<number>;
        stats.cachedStudyPlans = target.result;
      };
      itemsStore.count().onsuccess = (e) => {
        const target = e.target as IDBRequest<number>;
        stats.cachedPlanItems = target.result;
      };
      progressStore.count().onsuccess = (e) => {
        const target = e.target as IDBRequest<number>;
        stats.cachedProgress = target.result;
      };
      syncStore.count().onsuccess = (e) => {
        const target = e.target as IDBRequest<number>;
        stats.pendingSync = target.result;
      };
      actionsStore.count().onsuccess = (e) => {
        const target = e.target as IDBRequest<number>;
        stats.offlineActions = target.result;
      };
    });
  }
}

// Network status manager
class NetworkManager {
  public isOnline: boolean;
  private listeners: ((status: string) => void)[];

  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  onStatusChange(callback: (status: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(status: string) {
    this.listeners.forEach(callback => callback(status));
  }
}

// Sync manager for offline functionality
class SyncManager {
  private isSyncing: boolean;
  private networkManager: NetworkManager;
  private storageManager: OfflineStorageManager;

  constructor() {
    this.networkManager = new NetworkManager();
    this.storageManager = new OfflineStorageManager();
    this.isSyncing = false;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    this.networkManager.onStatusChange(async (status: string) => {
      if (status === 'online' && !this.isSyncing) {
        await this.syncOfflineData();
      }
    });
  }

  async syncOfflineData() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    console.log('Starting offline data sync...');

    try {
      // Sync pending operations
      const pendingSync = await this.storageManager.getPendingSync();
      for (const operation of pendingSync) {
        try {
          await this.executeSyncOperation(operation);
          await this.storageManager.markSyncCompleted(operation.id);
        } catch (error) {
          console.error('Sync operation failed:', operation, error);
        }
      }

      // Sync offline actions
      const offlineActions = await this.storageManager.getOfflineActions();
      for (const action of offlineActions) {
        try {
          await this.executeOfflineAction(action);
          // Mark action as completed in offline storage
          await this.markActionCompleted(action.id);
        } catch (error) {
          console.error('Offline action failed:', action, error);
        }
      }

      console.log('Offline data sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async executeSyncOperation(operation: SyncOperation) {
    // This would implement the actual sync logic based on operation type
    switch (operation.type) {
      case 'progress_update':
        return fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operation.data)
        });

      case 'plan_update':
        return fetch('/api/study-plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operation.data)
        });

      default:
        throw new Error(`Unknown sync operation type: ${operation.type}`);
    }
  }

  async executeOfflineAction(action: OfflineAction) {
    return fetch(action.url, {
      method: action.method,
      headers: action.headers,
      body: action.body
    });
  }

  async markActionCompleted(actionId: string) {
    // This would be implemented in the offline storage manager
    // For now, we'll just log it
    console.log('Action completed:', actionId);
  }
}

// Type declarations
declare global {
  interface Window {
    StudyForge: {
      offlineStorage: OfflineStorageManager;
      networkManager: NetworkManager;
      syncManager: SyncManager;
      isOnline: () => boolean;
    };
  }
}

// Create global instances
const offlineStorage = new OfflineStorageManager();
const networkManager = new NetworkManager();
const syncManager = new SyncManager();

// Export for use in other modules
window.StudyForge = {
  offlineStorage,
  networkManager,
  syncManager,
  isOnline: () => networkManager.isOnline
};

export { OfflineStorageManager, NetworkManager, SyncManager };
