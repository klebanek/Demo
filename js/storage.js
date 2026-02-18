/**
 * INOVIT HACCP - Advanced Local Storage Manager
 * Supports localStorage, IndexedDB, and automatic sync
 */

class StorageManager {
    constructor() {
        this.dbName = 'inovit-haccp-db';
        this.dbVersion = 2;
        this.db = null;
        this.storageKey = 'inovit-haccp-data';
        this.initPromise = this.init();
        this.memoryCache = null;
    }

    /**
     * Initialize storage system
     */
    async init() {
        try {
            await this.initIndexedDB();
            console.log('[Storage] IndexedDB initialized');
        } catch (error) {
            console.warn('[Storage] IndexedDB not available, using localStorage only', error);
        }
    }

    /**
     * Wait for storage to be ready
     */
    async ready() {
        await this.initPromise;
    }

    /**
     * Initialize IndexedDB
     */
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const stores = [
                    'facility', 'procedures', 'hazards', 'temperatureLog',
                    'trainings', 'audits', 'tests', 'deliveries',
                    'correctiveActions', 'flowChart', 'reminders'
                ];

                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });

                        // Add indexes for specific stores
                        if (storeName === 'temperatureLog') {
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('device', 'device', { unique: false });
                        }
                        if (storeName === 'deliveries') {
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('supplier', 'supplier', { unique: false });
                        }
                        if (storeName === 'reminders') {
                            store.createIndex('dueDate', 'dueDate', { unique: false });
                            store.createIndex('status', 'status', { unique: false });
                        }
                    }
                });
            };
        });
    }

    /**
     * Save data to both localStorage and IndexedDB
     */
    async save(storeName, data) {
        try {
            await this.ready();

            // Save to localStorage first (always works)
            this.saveToLocalStorage(storeName, data);

            // Save to IndexedDB if available
            if (this.db) {
                await this.saveToIndexedDB(storeName, data);
            }

            console.log(`[Storage] Saved ${storeName}:`, Array.isArray(data) ? `${data.length} items` : 'object');
            return { success: true, message: 'Dane zapisane pomyślnie' };
        } catch (error) {
            console.error('[Storage] Save error:', error);
            return { success: false, message: 'Błąd podczas zapisywania', error };
        }
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage(storeName, data) {
        const allData = this.getAllFromLocalStorage();
        allData[storeName] = data;
        allData.lastModified = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(allData));
    }

    /**
     * Save to IndexedDB
     */
    saveToIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                // Clear existing data first to ensure clean state
                store.clear();

                // Ensure data is an array
                const items = Array.isArray(data) ? data : [data];

                // Add each item with proper id
                items.forEach((item, index) => {
                    const itemToSave = {
                        ...item,
                        id: item.id || index + 1,
                        timestamp: new Date().toISOString()
                    };
                    store.put(itemToSave);
                });

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Load data from storage
     */
    async load(storeName) {
        try {
            await this.ready();

            // Try localStorage first (most reliable)
            const localData = this.loadFromLocalStorage(storeName);

            if (localData !== null && localData !== undefined) {
                console.log(`[Storage] Loaded ${storeName} from localStorage`);
                return localData;
            }

            // Fallback to IndexedDB
            if (this.db) {
                const idbData = await this.loadFromIndexedDB(storeName);
                if (idbData && idbData.length > 0) {
                    console.log(`[Storage] Loaded ${storeName} from IndexedDB`);
                    // Sync back to localStorage
                    this.saveToLocalStorage(storeName, idbData);
                    return idbData;
                }
            }

            console.log(`[Storage] No data found for ${storeName}`);
            return null;
        } catch (error) {
            console.error('[Storage] Load error:', error);
            // Try localStorage as final fallback
            return this.loadFromLocalStorage(storeName);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage(storeName) {
        const allData = this.getAllFromLocalStorage();
        return allData[storeName] !== undefined ? allData[storeName] : null;
    }

    /**
     * Load from IndexedDB
     */
    loadFromIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get all data from localStorage
     */
    getAllFromLocalStorage() {
        if (this.memoryCache) return this.memoryCache;
        try {
            const data = localStorage.getItem(this.storageKey);
            this.memoryCache = data ? JSON.parse(data) : {};
            return this.memoryCache;
        } catch (error) {
            console.error('[Storage] Error parsing localStorage:', error);
            return {};
        }
    }

    /**
     * Export all data as JSON
     */
    async exportData() {
        try {
            const data = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                localStorage: this.getAllFromLocalStorage(),
                indexedDB: {}
            };

            // Export IndexedDB data if available
            if (this.db) {
                const stores = ['facility', 'procedures', 'hazards', 'temperatureLog',
                              'trainings', 'audits', 'tests', 'deliveries', 'correctiveActions', 'reminders', 'flowChart'];

                for (const storeName of stores) {
                    data.indexedDB[storeName] = await this.loadFromIndexedDB(storeName);
                }
            }

            return data;
        } catch (error) {
            console.error('[Storage] Export error:', error);
            throw error;
        }
    }

    /**
     * Import data from JSON
     */
    async importData(jsonData) {
        try {
            if (!jsonData || typeof jsonData !== 'object') {
                throw new Error('Invalid import data');
            }

            // Import to localStorage
            if (jsonData.localStorage) {
                localStorage.setItem(this.storageKey, JSON.stringify(jsonData.localStorage));
                this.memoryCache = null;
            }

            // Import to IndexedDB
            if (this.db && jsonData.indexedDB) {
                for (const [storeName, data] of Object.entries(jsonData.indexedDB)) {
                    if (Array.isArray(data) && data.length > 0) {
                        await this.saveToIndexedDB(storeName, data);
                    }
                }
            }

            return { success: true, message: 'Dane zaimportowane pomyślnie' };
        } catch (error) {
            console.error('[Storage] Import error:', error);
            return { success: false, message: 'Błąd podczas importowania', error };
        }
    }

    /**
     * Clear all data
     */
    async clearAll() {
        try {
            // Clear localStorage
            localStorage.removeItem(this.storageKey);
            this.memoryCache = null;

            // Clear IndexedDB
            if (this.db) {
                const stores = ['facility', 'procedures', 'hazards', 'temperatureLog',
                              'trainings', 'audits', 'tests', 'deliveries', 'correctiveActions', 'reminders', 'flowChart'];

                for (const storeName of stores) {
                    await this.clearStore(storeName);
                }
            }

            return { success: true, message: 'Wszystkie dane zostały usunięte' };
        } catch (error) {
            console.error('[Storage] Clear error:', error);
            return { success: false, message: 'Błąd podczas usuwania danych', error };
        }
    }

    /**
     * Clear specific store in IndexedDB
     */
    clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get storage statistics
     */
    async getStats() {
        const stats = {
            localStorage: {
                used: 0,
                available: 5 * 1024 * 1024, // ~5MB typical limit
                items: 0
            },
            indexedDB: {
                stores: {},
                totalRecords: 0
            }
        };

        // localStorage stats
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            stats.localStorage.used = new Blob([data]).size;
            stats.localStorage.items = Object.keys(JSON.parse(data)).length;
        }

        // IndexedDB stats
        if (this.db) {
            const stores = ['facility', 'procedures', 'hazards', 'temperatureLog',
                          'trainings', 'audits', 'tests', 'deliveries', 'correctiveActions', 'reminders', 'flowChart'];

            for (const storeName of stores) {
                const data = await this.loadFromIndexedDB(storeName);
                stats.indexedDB.stores[storeName] = Array.isArray(data) ? data.length : 0;
                stats.indexedDB.totalRecords += stats.indexedDB.stores[storeName];
            }
        }

        return stats;
    }

    /**
     * Add item to store
     */
    async addItem(storeName, item) {
        try {
            await this.ready();

            // Ensure item has an id
            const newItem = {
                ...item,
                id: item.id || Date.now(),
                timestamp: new Date().toISOString()
            };

            // Load current data, add item, and save
            let data = await this.load(storeName);
            if (!Array.isArray(data)) {
                data = [];
            }
            data.push(newItem);
            await this.save(storeName, data);

            return newItem.id;
        } catch (error) {
            console.error('[Storage] Add item error:', error);
            throw error;
        }
    }

    /**
     * Update item in store
     */
    async updateItem(storeName, id, updates) {
        try {
            await this.ready();

            let data = await this.load(storeName);
            if (!Array.isArray(data)) {
                throw new Error('Store does not contain an array');
            }

            const index = data.findIndex(item => item.id === id);
            if (index === -1) {
                throw new Error('Item not found');
            }

            data[index] = {
                ...data[index],
                ...updates,
                lastModified: new Date().toISOString()
            };

            await this.save(storeName, data);
            return data[index];
        } catch (error) {
            console.error('[Storage] Update item error:', error);
            throw error;
        }
    }

    /**
     * Delete item from store
     */
    async deleteItem(storeName, id) {
        try {
            await this.ready();

            let data = await this.load(storeName);
            if (!Array.isArray(data)) {
                throw new Error('Store does not contain an array');
            }

            const index = data.findIndex(item => item.id === id);
            if (index === -1) {
                throw new Error('Item not found');
            }

            data.splice(index, 1);
            await this.save(storeName, data);
        } catch (error) {
            console.error('[Storage] Delete item error:', error);
            throw error;
        }
    }

    /**
     * Get single item by id
     */
    async getItem(storeName, id) {
        try {
            const data = await this.load(storeName);
            if (!Array.isArray(data)) {
                return data && data.id === id ? data : null;
            }
            return data.find(item => item.id === id) || null;
        } catch (error) {
            console.error('[Storage] Get item error:', error);
            return null;
        }
    }
}

// Create global storage instance
const storage = new StorageManager();
