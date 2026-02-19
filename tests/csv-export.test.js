import { describe, it, expect, vi } from 'vitest';
import { CsvExport } from '../src/js/csv-export.js';

// Mock dependencies
vi.mock('../src/js/utils.js', () => ({ Utils: {} }));
vi.mock('../src/js/storage.js', () => ({ storage: {} }));
vi.mock('../src/js/notifications.js', () => ({ Notifications: {} }));
vi.mock('../src/js/modal.js', () => ({ Modal: {} }));

describe('CsvExport.escapeCSV', () => {
    it('should return empty string for null or undefined', () => {
        expect(CsvExport.escapeCSV(null)).toBe('');
        expect(CsvExport.escapeCSV(undefined)).toBe('');
    });

    it('should return simple string as is', () => {
        expect(CsvExport.escapeCSV('hello')).toBe('hello');
        expect(CsvExport.escapeCSV('123')).toBe('123');
    });

    it('should wrap in quotes if it contains the separator', () => {
        expect(CsvExport.escapeCSV('hello;world', ';')).toBe('"hello;world"');
        expect(CsvExport.escapeCSV('hello;world')).toBe('"hello;world"');
    });

    it('should wrap in quotes and escape quotes if it contains double quotes', () => {
        expect(CsvExport.escapeCSV('he"llo')).toBe('"he""llo"');
        expect(CsvExport.escapeCSV('"quoted"')).toBe('"""quoted"""');
    });

    it('should wrap in quotes if it contains newlines or carriage returns', () => {
        expect(CsvExport.escapeCSV('hello\nworld')).toBe('"hello\nworld"');
        expect(CsvExport.escapeCSV('hello\rworld')).toBe('"hello\rworld"');
    });

    it('should handle custom separators', () => {
        expect(CsvExport.escapeCSV('hello,world', ',')).toBe('"hello,world"');
        expect(CsvExport.escapeCSV('hello;world', ',')).toBe('hello;world');
    });

    it('should handle non-string values', () => {
        expect(CsvExport.escapeCSV(123)).toBe('123');
        expect(CsvExport.escapeCSV(true)).toBe('true');
        expect(CsvExport.escapeCSV(false)).toBe('false');
    });

    it('should handle combination of triggers', () => {
        expect(CsvExport.escapeCSV('hello;"world"', ';')).toBe('"hello;""world"""');
    });
});
