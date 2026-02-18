const test = require('node:test');
const assert = require('node:assert');
const CsvExport = require('../js/csv-export.js');

test('CsvExport.escapeCSV', async (t) => {
    await t.test('should return empty string for null or undefined', () => {
        assert.strictEqual(CsvExport.escapeCSV(null), '');
        assert.strictEqual(CsvExport.escapeCSV(undefined), '');
    });

    await t.test('should return simple string as is', () => {
        assert.strictEqual(CsvExport.escapeCSV('hello'), 'hello');
        assert.strictEqual(CsvExport.escapeCSV('123'), '123');
    });

    await t.test('should wrap in quotes if it contains the separator', () => {
        assert.strictEqual(CsvExport.escapeCSV('hello;world', ';'), '"hello;world"');
        // default separator is ;
        assert.strictEqual(CsvExport.escapeCSV('hello;world'), '"hello;world"');
    });

    await t.test('should wrap in quotes and escape quotes if it contains double quotes', () => {
        assert.strictEqual(CsvExport.escapeCSV('he"llo'), '"he""llo"');
        assert.strictEqual(CsvExport.escapeCSV('"quoted"'), '"""quoted"""');
    });

    await t.test('should wrap in quotes if it contains newlines or carriage returns', () => {
        assert.strictEqual(CsvExport.escapeCSV('hello\nworld'), '"hello\nworld"');
        assert.strictEqual(CsvExport.escapeCSV('hello\rworld'), '"hello\rworld"');
    });

    await t.test('should handle custom separators', () => {
        assert.strictEqual(CsvExport.escapeCSV('hello,world', ','), '"hello,world"');
        // if separator is , but string contains ; it should NOT be escaped (unless other conditions met)
        assert.strictEqual(CsvExport.escapeCSV('hello;world', ','), 'hello;world');
    });

    await t.test('should handle non-string values', () => {
        assert.strictEqual(CsvExport.escapeCSV(123), '123');
        assert.strictEqual(CsvExport.escapeCSV(true), 'true');
        assert.strictEqual(CsvExport.escapeCSV(false), 'false');
    });

    await t.test('should handle combination of triggers', () => {
        // contains both separator and quotes
        assert.strictEqual(CsvExport.escapeCSV('hello;"world"', ';'), '"hello;""world"""');
    });
});
