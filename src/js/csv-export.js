import { Utils } from "./utils.js";
import { storage } from "./storage.js";
import { Notifications } from "./notifications.js";
import { Modal } from "./modal.js";
/**
 * INOVIT HACCP - CSV Export Module
 * @module csv-export
 * @description Export data to CSV format
 */

export const CsvExport = {
    /**
     * Module configurations for CSV export
     */
    modules: {
        procedures: {
            name: 'Procedury GHP/GMP',
            columns: [
                { key: 'name', header: 'Nazwa procedury' },
                { key: 'description', header: 'Opis' },
                { key: 'status', header: 'Status' },
                { key: 'date', header: 'Data aktualizacji' }
            ]
        },
        hazards: {
            name: 'Zagrożenia HACCP',
            columns: [
                { key: 'stage', header: 'Etap' },
                { key: 'hazard', header: 'Zagrożenie' },
                { key: 'type', header: 'Typ' },
                { key: 'risk', header: 'Ryzyko' },
                { key: 'ccp', header: 'CCP' },
                { key: 'controlMeasures', header: 'Środki kontroli' }
            ]
        },
        temperatureLog: {
            name: 'Rejestr temperatury',
            columns: [
                { key: 'date', header: 'Data' },
                { key: 'time', header: 'Godzina' },
                { key: 'device', header: 'Urządzenie' },
                { key: 'temperature', header: 'Temperatura (°C)' },
                { key: 'minTemp', header: 'Min (°C)' },
                { key: 'maxTemp', header: 'Max (°C)' },
                { key: 'status', header: 'Status' },
                { key: 'notes', header: 'Uwagi' },
                { key: 'signature', header: 'Podpis' }
            ]
        },
        deliveries: {
            name: 'Rejestr dostaw',
            columns: [
                { key: 'date', header: 'Data dostawy' },
                { key: 'supplier', header: 'Dostawca' },
                { key: 'product', header: 'Produkt' },
                { key: 'quantity', header: 'Ilość' },
                { key: 'temperature', header: 'Temperatura' },
                { key: 'expiryDate', header: 'Termin ważności' },
                { key: 'quality', header: 'Ocena jakości' },
                { key: 'notes', header: 'Uwagi' }
            ]
        },
        correctiveActions: {
            name: 'Działania korygujące',
            columns: [
                { key: 'date', header: 'Data zgłoszenia' },
                { key: 'problem', header: 'Problem' },
                { key: 'ccp', header: 'CCP' },
                { key: 'action', header: 'Działanie' },
                { key: 'responsible', header: 'Odpowiedzialny' },
                { key: 'status', header: 'Status' },
                { key: 'closeDate', header: 'Data zamknięcia' }
            ]
        },
        trainings: {
            name: 'Szkolenia',
            columns: [
                { key: 'topic', header: 'Temat' },
                { key: 'date', header: 'Data' },
                { key: 'trainer', header: 'Prowadzący' },
                { key: 'participants', header: 'Uczestnicy' },
                { key: 'status', header: 'Status' }
            ]
        },
        audits: {
            name: 'Audyty',
            columns: [
                { key: 'type', header: 'Typ audytu' },
                { key: 'date', header: 'Data' },
                { key: 'auditor', header: 'Audytor' },
                { key: 'area', header: 'Obszar' },
                { key: 'result', header: 'Wynik' },
                { key: 'notes', header: 'Uwagi' }
            ]
        },
        tests: {
            name: 'Badania',
            columns: [
                { key: 'type', header: 'Typ badania' },
                { key: 'material', header: 'Materiał' },
                { key: 'frequency', header: 'Częstotliwość' },
                { key: 'lab', header: 'Laboratorium' },
                { key: 'lastTest', header: 'Ostatnie badanie' },
                { key: 'nextTest', header: 'Następne badanie' },
                { key: 'status', header: 'Status' }
            ]
        }
    },

    /**
     * Show export dialog
     */
    showExportDialog() {
        const moduleOptions = Object.entries(this.modules).map(([key, config]) => `
            <label class="csv-export-option">
                <input type="checkbox" name="csv-module" value="${key}" checked>
                <span>${config.name}</span>
            </label>
        `).join('');

        Modal.open({
            title: 'Eksport do CSV',
            content: `
                <div class="csv-export-dialog">
                    <div class="csv-export-section">
                        <h4><i class="fas fa-list"></i> Wybierz moduły do eksportu</h4>
                        <div class="csv-export-options">
                            ${moduleOptions}
                        </div>
                    </div>

                    <div class="csv-export-section">
                        <h4><i class="fas fa-cog"></i> Opcje eksportu</h4>
                        <div class="csv-export-settings">
                            <label class="csv-export-setting">
                                <input type="checkbox" id="csv-include-headers" checked>
                                <span>Dodaj nagłówki kolumn</span>
                            </label>
                            <label class="csv-export-setting">
                                <input type="radio" name="csv-separator" value=";" checked>
                                <span>Separator: średnik (;) - Excel PL</span>
                            </label>
                            <label class="csv-export-setting">
                                <input type="radio" name="csv-separator" value=",">
                                <span>Separator: przecinek (,) - standard</span>
                            </label>
                        </div>
                    </div>

                    <div class="csv-export-info">
                        <i class="fas fa-info-circle"></i>
                        <p>Dane zostaną wyeksportowane do osobnych plików CSV dla każdego modułu lub do jednego archiwum ZIP.</p>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="Modal.close()">Anuluj</button>
                <button class="btn btn-success" onclick="CsvExport.exportSelected()">
                    <i class="fas fa-file-csv"></i> Eksportuj CSV
                </button>
            `,
            size: 'medium'
        });
    },

    /**
     * Export selected modules
     */
    async exportSelected() {
        const checkboxes = document.querySelectorAll('input[name="csv-module"]:checked');
        const selectedModules = Array.from(checkboxes).map(cb => cb.value);

        if (selectedModules.length === 0) {
            Notifications.warning('Wybierz przynajmniej jeden moduł do eksportu');
            return;
        }

        const includeHeaders = document.getElementById('csv-include-headers').checked;
        const separator = document.querySelector('input[name="csv-separator"]:checked').value;

        Modal.close();
        const loading = Notifications.loading('Eksportowanie danych CSV...');

        try {
            for (const moduleKey of selectedModules) {
                await this.exportModule(moduleKey, { includeHeaders, separator });
            }
            loading.success(`Wyeksportowano ${selectedModules.length} moduł(ów) do CSV`);
        } catch (error) {
            console.error('[CsvExport] Export error:', error);
            loading.error('Błąd podczas eksportu CSV');
        }
    },

    /**
     * Export single module to CSV
     */
    async exportModule(moduleKey, options = {}) {
        const config = this.modules[moduleKey];
        if (!config) {
            throw new Error(`Unknown module: ${moduleKey}`);
        }

        const data = await storage.load(moduleKey);
        if (!data || !Array.isArray(data) || data.length === 0) {
            Notifications.info(`Brak danych do eksportu: ${config.name}`);
            return;
        }

        const { includeHeaders = true, separator = ';' } = options;

        let csv = '';

        // Add BOM for UTF-8 Excel compatibility
        csv = '\uFEFF';

        // Add headers
        if (includeHeaders) {
            csv += config.columns.map(col => this.escapeCSV(col.header, separator)).join(separator) + '\n';
        }

        // Add data rows
        data.forEach(item => {
            const row = config.columns.map(col => {
                const value = item[col.key];
                return this.escapeCSV(this.formatValue(value), separator);
            });
            csv += row.join(separator) + '\n';
        });

        // Download file
        const filename = `haccp-${moduleKey}-${Utils.getCurrentDate()}.csv`;
        this.downloadCSV(csv, filename);
    },

    /**
     * Format value for CSV
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    },

    /**
     * Escape CSV value
     */
    escapeCSV(value, separator = ';') {
        if (value === null || value === undefined) {
            return '';
        }

        const str = String(value);

        // Check if escaping is needed
        if (str.includes(separator) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            // Escape double quotes by doubling them
            return '"' + str.replace(/"/g, '""') + '"';
        }

        return str;
    },

    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Quick export single module (for table context menus)
     */
    async quickExport(moduleKey) {
        const loading = Notifications.loading('Eksportowanie...');
        try {
            await this.exportModule(moduleKey, { includeHeaders: true, separator: ';' });
            loading.success('Eksport CSV zakończony');
        } catch (error) {
            loading.error('Błąd eksportu');
        }
    }
};

// Add global function for easy access
