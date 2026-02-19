import re

file_path = 'src/js/storage.js'

with open(file_path, 'r') as f:
    content = f.read()

# Pattern for load method
# We need to be careful with indentation and braces.
# The original code has "async load(storeName) {" then indented block, ending with indented "}"
# I'll use a regex that matches until the closing brace at the same indentation level (4 spaces).

load_regex = r'    async load\(storeName\) \{[\s\S]*?^\    \}'
new_load = """    async load(storeName) {
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
    }"""

content = re.sub(load_regex, new_load, content, count=1, flags=re.MULTILINE)

# Pattern for save method
save_regex = r'    async save\(storeName, data\) \{[\s\S]*?^\    \}'
new_save = """    async save(storeName, data) {
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
    }"""

content = re.sub(save_regex, new_save, content, count=1, flags=re.MULTILINE)

with open(file_path, 'w') as f:
    f.write(content)
