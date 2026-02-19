import { CONFIG } from "./config.js";
/**
 * INOVIT HACCP - Advanced Local Storage Manager
 * Supports localStorage, IndexedDB, and automatic sync
 */

/**
 * Helper for Web Crypto API encryption/decryption
 */
const CryptoHelper = {
    DB_NAME: 'inovit-haccp-crypto',
    STORE_NAME: 'keys',
    KEY_ID: 'encryption-key',

    /**
     * Convert Uint8Array to Base64 string safely (avoiding stack overflow)
     */
    uint8ArrayToBase64(arr) {
        let binary = '';
        const len = arr.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(arr[i]);
        }
        return btoa(binary);
    },

    /**
     * Convert Base64 string to Uint8Array safely
     */
    base64ToUint8Array(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    },

    /**
     * Get or generate encryption key from IndexedDB
     */
    async getKey() {
        if (!window.crypto || !window.crypto.subtle) {
            console.warn('[Crypto] Web Crypto API not available');
            return null;
        }

        return new Promise((resolve) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                e.target.result.createObjectStore(this.STORE_NAME);
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const getRequest = store.get(this.KEY_ID);

                getRequest.onsuccess = async () => {
                    if (getRequest.result) {
                        resolve(getRequest.result);
                    } else {
                        try {
                            // Generate key
                            const newKey = await crypto.subtle.generateKey(
                                { name: "AES-GCM", length: 256 },
                                true,
                                ["encrypt", "decrypt"]
                            );

                            // Start a NEW transaction for the put because the previous one might have auto-committed
                            // while we were awaiting generateKey
                            const putTransaction = db.transaction([this.STORE_NAME], 'readwrite');
                            const putStore = putTransaction.objectStore(this.STORE_NAME);
                            const putRequest = putStore.put(newKey, this.KEY_ID);

                            putRequest.onsuccess = () => resolve(newKey);
                            putRequest.onerror = (err) => {
                                console.error('[Crypto] Key storage failed:', err);
                                resolve(null);
                            };
                        } catch (err) {
                            console.error('[Crypto] Key generation failed:', err);
                            resolve(null);
                        }
                    }
                };
                getRequest.onerror = () => resolve(null);
            };
            request.onerror = () => resolve(null);
        });
    },

    /**
     * Encrypt data using AES-GCM
     */
    async encrypt(data, key) {
        try {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(JSON.stringify(data));
            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                encoded
            );

            return {
                ciphertext: this.uint8ArrayToBase64(new Uint8Array(ciphertext)),
                iv: this.uint8ArrayToBase64(iv),
                v: 1
            };
        } catch (err) {
            console.error('[Crypto] Encryption failed:', err);
            return data;
        }
    },

    /**
     * Decrypt data using AES-GCM
     */
    async decrypt(encryptedData, key) {
        try {
            const { ciphertext, iv } = encryptedData;
            const ivArr = this.base64ToUint8Array(iv);
            const ciphertextArr = this.base64ToUint8Array(ciphertext);

            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivArr },
                key,
                ciphertextArr
            );

            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (err) {
            console.error('[Crypto] Decryption failed:', err);
            throw err;
        }
    }
};

export class StorageManager {
    constructor() {
        this.dbName = typeof CONFIG !== 'undefined' ? CONFIG.STORAGE.DB_NAME : 'inovit-haccp-db';
        this.dbVersion = (typeof CONFIG !== 'undefined' ? CONFIG.STORAGE.DB_VERSION : 2) + 1; // Bump version for settings store
        this.db = null;
        this.storageKey = typeof CONFIG !== 'undefined' ? CONFIG.STORAGE.LOCAL_STORAGE_KEY : 'inovit-haccp-data';

        // Define all stores centrally
        this.stores = [
            'facility', 'procedures', 'hazards', 'temperatureLog',
            'trainings', 'audits', 'tests', 'deliveries',
            'correctiveActions', 'flowChart', 'reminders', 'auditLog'
        ];

        this.memoryCache = null;
        this.encryptionKey = null;
        this.loadingCachePromise = null;
        this.initPromise = this.init();
    }

    /**
     * Initialize storage system
     */
    async init() {
        try {
            await this.initIndexedDB();
            this.encryptionKey = await CryptoHelper.getKey();
            console.log('[Storage] Storage system initialized with encryption');
        } catch (error) {
            console.warn('[Storage] Initialization warning:', error);
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

                // Use stores from config if available, otherwise use our default list
                let storesToCreate = this.stores;
                if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE && CONFIG.STORAGE.STORES) {
                    storesToCreate = CONFIG.STORAGE.STORES;
                }

                // Add internal stores
                const allStores = [...new Set([...storesToCreate, 'internal_settings'])];

                allStores.forEach(storeName => {
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

            // Only save to IndexedDB
            if (this.db) {
                await this.saveToIndexedDB(storeName, data);
                return { success: true, message: 'Dane zapisane pomyślnie' };
            }
            throw new Error("IndexedDB unavailable");
        } catch (error) {
            console.error('[Storage] Save error:', error);
            return { success: false, message: 'Błąd podczas zapisywania', error };
        }
    }

    /**
     * Save to localStorage (encrypted)
     */
    async saveToLocalStorage(storeName, data) {
        const allData = await this.getAllFromLocalStorage();
        allData[storeName] = data;
        allData.lastModified = new Date().toISOString();
        await this.saveAllToLocalStorage(allData);
    }

    /**
     * Save all data to localStorage with encryption
     */
    async saveAllToLocalStorage(allData) {
        this.memoryCache = allData;
        let dataToStore = JSON.stringify(allData);

        if (this.encryptionKey) {
            const encrypted = await CryptoHelper.encrypt(allData, this.encryptionKey);
            dataToStore = JSON.stringify(encrypted);
        }

        localStorage.setItem(this.storageKey, dataToStore);

        // Cleanup old unencrypted keys if they exist
        localStorage.removeItem('auditLog');
    }

    /**
     * Save to IndexedDB
     */
    saveToIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.db.objectStoreNames.contains(storeName)) {
                    reject(new Error(`Store ${storeName} not found`));
                    return;
                }

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

            // 1. Try IndexedDB (Primary)
            if (this.db) {
                const idbData = await this.loadFromIndexedDB(storeName);
                if (idbData && (!Array.isArray(idbData) || idbData.length > 0)) {
                    return idbData;
                }
            }

            // 2. Migration: Check localStorage once
            const localData = await this.loadFromLocalStorage(storeName);
            if (localData && (!Array.isArray(localData) || localData.length > 0)) {
                 console.log('[Storage] Migrating ' + storeName + ' to IndexedDB');
                 if (this.db) {
                     await this.saveToIndexedDB(storeName, localData);
                 }
                 return localData;
            }

            return [];
        } catch (error) {
            console.error('[Storage] Load error:', error);
            return [];
        }
    }

    /**
     * Load from localStorage
     */
    async loadFromLocalStorage(storeName) {
        const allData = await this.getAllFromLocalStorage();
        return allData[storeName] !== undefined ? allData[storeName] : null;
    }

    /**
     * Load from IndexedDB
     */
    loadFromIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.db.objectStoreNames.contains(storeName)) {
                    resolve([]); // Store not found, return empty array
                    return;
                }

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
     * Get all data from localStorage (decrypted)
     */
    async getAllFromLocalStorage() {
        if (this.memoryCache) return this.memoryCache;
        if (this.loadingCachePromise) return this.loadingCachePromise;

        this.loadingCachePromise = (async () => {
            try {
                const rawData = localStorage.getItem(this.storageKey);

                // Migration check: auditLog used to be in its own key
                const oldAuditLog = localStorage.getItem('auditLog');

                if (!rawData && !oldAuditLog) {
                    this.memoryCache = {};
                    return {};
                }

                let parsedData = {};
                if (rawData) {
                    try {
                        const parsed = JSON.parse(rawData);
                        // Check if it's encrypted
                        if (parsed && parsed.ciphertext && parsed.iv) {
                            if (this.encryptionKey) {
                                parsedData = await CryptoHelper.decrypt(parsed, this.encryptionKey);
                            } else {
                                console.warn('[Storage] Data is encrypted but key is not available');
                                return {};
                            }
                        } else {
                            parsedData = parsed || {};
                        }
                    } catch (e) {
                        console.error('[Storage] Error parsing/decrypting localStorage:', e);
                    }
                }

                // Migrate auditLog if it exists separately
                if (oldAuditLog && !parsedData.auditLog) {
                    try {
                        parsedData.auditLog = JSON.parse(oldAuditLog);
                    } catch (e) {
                        console.error('[Storage] Error parsing old auditLog:', e);
                    }
                }

                this.memoryCache = parsedData;
                return this.memoryCache;
            } finally {
                this.loadingCachePromise = null;
            }
        })();

        return this.loadingCachePromise;
    }

    /**
     * Export all data as JSON
     */
    async exportData() {
        try {
            await this.ready();
            const data = {
                version: '1.1.0',
                exportDate: new Date().toISOString(),
                localStorage: await this.getAllFromLocalStorage(),
                indexedDB: {}
            };

            // Export IndexedDB data if available
            if (this.db) {
                for (const storeName of this.stores) {
                    if (storeName !== 'auditLog') { // Usually we don't export logs
                        data.indexedDB[storeName] = await this.loadFromIndexedDB(storeName);
                    }
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
            await this.ready();
            if (!jsonData || typeof jsonData !== 'object') {
                throw new Error('Invalid import data');
            }

            // Import to localStorage
            if (jsonData.localStorage) {
                await this.saveAllToLocalStorage(jsonData.localStorage);
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
            await this.ready();
            // Clear localStorage
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem('auditLog');
            this.memoryCache = null;

            // Clear IndexedDB
            if (this.db) {
                const storesToClear = [...this.stores, 'internal_settings'];
                for (const storeName of storesToClear) {
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
            if (!this.db.objectStoreNames.contains(storeName)) {
                resolve(); // Nothing to clear
                return;
            }
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
        await this.ready();
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
        const rawData = localStorage.getItem(this.storageKey);
        if (rawData) {
            stats.localStorage.used = new Blob([rawData]).size;
            const data = await this.getAllFromLocalStorage();
            stats.localStorage.items = Object.keys(data).length;
        }

        // IndexedDB stats
        if (this.db) {
            for (const storeName of this.stores) {
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
export const storage = new StorageManager();
