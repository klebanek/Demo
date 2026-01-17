/**
 * INOVIT HACCP - Advanced Local Storage Manager
 * Supports localStorage, IndexedDB, and automatic sync
 */

class StorageManager {
    constructor() {
        this.dbName = 'inovit-haccp-db';
        this.dbVersion = 1;
        this.db = null;
        this.storageKey = 'inovit-haccp-data';
        this.init();
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

                // Create object stores
                if (!db.objectStoreNames.contains('facility')) {
                    db.createObjectStore('facility', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('procedures')) {
                    db.createObjectStore('procedures', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('hazards')) {
                    db.createObjectStore('hazards', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('temperatureLog')) {
                    const tempStore = db.createObjectStore('temperatureLog', { keyPath: 'id', autoIncrement: true });
                    tempStore.createIndex('date', 'date', { unique: false });
                    tempStore.createIndex('device', 'device', { unique: false });
                }
                if (!db.objectStoreNames.contains('trainings')) {
                    db.createObjectStore('trainings', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('audits')) {
                    db.createObjectStore('audits', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('tests')) {
                    db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('deliveries')) {
                    const deliveryStore = db.createObjectStore('deliveries', { keyPath: 'id', autoIncrement: true });
                    deliveryStore.createIndex('date', 'date', { unique: false });
                    deliveryStore.createIndex('supplier', 'supplier', { unique: false });
                }
                if (!db.objectStoreNames.contains('correctiveActions')) {
                    db.createObjectStore('correctiveActions', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    /**
     * Save data to both localStorage and IndexedDB
     */
    async save(storeName, data) {
        try {
            // Save to localStorage
            this.saveToLocalStorage(storeName, data);

            // Save to IndexedDB if available
            if (this.db) {
                await this.saveToIndexedDB(storeName, data);
            }

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
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = Array.isArray(data)
                ? data.map(item => store.put({ ...item, timestamp: new Date().toISOString() }))
                : store.put({ ...data, timestamp: new Date().toISOString() });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Load data from storage
     */
    async load(storeName) {
        try {
            // Try IndexedDB first
            if (this.db) {
                const data = await this.loadFromIndexedDB(storeName);
                if (data && data.length > 0) {
                    return data;
                }
            }

            // Fallback to localStorage
            return this.loadFromLocalStorage(storeName);
        } catch (error) {
            console.error('[Storage] Load error:', error);
            return null;
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage(storeName) {
        const allData = this.getAllFromLocalStorage();
        return allData[storeName] || null;
    }

    /**
     * Load from IndexedDB
     */
    loadFromIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all data from localStorage
     */
    getAllFromLocalStorage() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
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
                              'trainings', 'audits', 'tests', 'deliveries', 'correctiveActions'];

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

            // Clear IndexedDB
            if (this.db) {
                const stores = ['facility', 'procedures', 'hazards', 'temperatureLog',
                              'trainings', 'audits', 'tests', 'deliveries', 'correctiveActions'];

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
                          'trainings', 'audits', 'tests', 'deliveries', 'correctiveActions'];

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
            if (this.db) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add({
                    ...item,
                    timestamp: new Date().toISOString()
                });

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } else {
                // Fallback to localStorage
                const allData = this.getAllFromLocalStorage();
                if (!allData[storeName]) allData[storeName] = [];
                allData[storeName].push(item);
                this.saveToLocalStorage(storeName, allData[storeName]);
                return allData[storeName].length - 1;
            }
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
            if (this.db) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const getRequest = store.get(id);

                return new Promise((resolve, reject) => {
                    getRequest.onsuccess = () => {
                        const data = getRequest.result;
                        if (data) {
                            Object.assign(data, updates, {
                                lastModified: new Date().toISOString()
                            });
                            const updateRequest = store.put(data);
                            updateRequest.onsuccess = () => resolve(data);
                            updateRequest.onerror = () => reject(updateRequest.error);
                        } else {
                            reject(new Error('Item not found'));
                        }
                    };
                    getRequest.onerror = () => reject(getRequest.error);
                });
            }
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
            if (this.db) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                return new Promise((resolve, reject) => {
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        } catch (error) {
            console.error('[Storage] Delete item error:', error);
            throw error;
        }
    }
}

// Create global storage instance
const storage = new StorageManager();
