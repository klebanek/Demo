import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { StorageManager } from '../src/js/storage.js';

// Mock CONFIG
vi.mock('../src/js/config.js', () => ({
    CONFIG: {
        STORAGE: {
            DB_NAME: 'test-db',
            DB_VERSION: 1,
            LOCAL_STORAGE_KEY: 'test-key',
            STORES: ['testStore']
        }
    }
}));

// Mock Utils - minimal implementation
vi.mock('../src/js/utils.js', () => ({
    Utils: {
        generateId: () => 'test-id',
        formatBytes: () => '0 B'
    }
}));

describe('StorageManager', () => {
    let storage;

    beforeEach(async () => {
        // Reset IndexedDB state if possible, or use fresh instance
        // fake-indexeddb persists in global scope?
        // We can just rely on StorageManager init to create stores.

        storage = new StorageManager();
        await storage.ready();
    });

    afterEach(async () => {
        if (storage && storage.db) {
            storage.db.close();
        }
        // In a real env we might deleteDB, but fake-indexeddb in-memory behavior is tricky to reset perfectly
        // without reloading module. But we can clear stores.
    });

    it('should save data to IndexedDB', async () => {
        const data = [{ id: 1, name: 'Test Item' }];
        const result = await storage.save('testStore', data);

        expect(result.success).toBe(true);

        // Verify
        const loaded = await storage.load('testStore');
        expect(loaded).toHaveLength(1);
        expect(loaded[0].name).toBe('Test Item');
    });

    it('should update data in IndexedDB', async () => {
        const initial = [{ id: 1, name: 'Initial' }];
        await storage.save('testStore', initial);

        const updated = [{ id: 1, name: 'Updated' }];
        await storage.save('testStore', updated);

        const loaded = await storage.load('testStore');
        expect(loaded[0].name).toBe('Updated');
    });

    it('should fail gracefully when DB is not available', async () => {
        // Force DB failure
        const originalDB = storage.db;
        storage.db = null;

        const result = await storage.save('testStore', [{ id: 1 }]);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Błąd');

        storage.db = originalDB;
    });
});
