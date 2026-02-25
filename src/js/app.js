/**
 * INOVIT HACCP - Main Application Controller
 * @module app
 * @version 2.0.0
 * @description Main application entry point and controller
 */

import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { Validators } from './validators.js';
import { storage } from './storage.js';
import { Notifications } from './notifications.js';
import { Modal } from './modal.js';
import { Navigation } from './navigation.js';
import { PageTemplates } from './templates.js';
import { CrudManager } from './crud.js';
import { PDFExport } from './pdf-export.js';
import { Reminders } from './reminders.js';
import { DashboardKPI } from './dashboard-kpi.js';
import { GlobalSearch } from './global-search.js';
import { AuditLog } from './audit-log.js';
import { CsvExport } from './csv-export.js';
import { DarkMode } from './dark-mode.js';
import { registerSW } from 'virtual:pwa-register';

// Expose modules to global scope for inline event handlers and legacy compatibility
window.CONFIG = CONFIG;
window.Utils = Utils;
window.Validators = Validators;
window.storage = storage;
window.Notifications = Notifications;
window.Modal = Modal;
window.Navigation = Navigation;
window.PageTemplates = PageTemplates;
window.CrudManager = CrudManager;
window.PDFExport = PDFExport;
window.Reminders = Reminders;
window.DashboardKPI = DashboardKPI;
window.GlobalSearch = GlobalSearch;
window.AuditLog = AuditLog;
window.CsvExport = CsvExport;
window.DarkMode = DarkMode;

// Also expose global functions expected by inline HTML handlers
window.showPage = (pageId) => Navigation.showPage(pageId);
window.exportData = () => App.exportData();
window.importData = () => App.importData();
window.handleImportFile = (event) => App.handleImportFile(event);
window.showStats = () => App.showStats();
window.showHelp = () => App.showHelp();
window.saveFacilityData = async () => await App.saveFacilityData();
window.addProcedure = () => CrudManager.procedures.add();
window.editProcedure = (id) => CrudManager.procedures.edit(id);
window.addHazard = () => CrudManager.hazards.add();
window.editHazard = (id) => CrudManager.hazards.edit(id);
window.addDelivery = () => CrudManager.deliveries.add();
window.viewDelivery = (index) => CrudManager.deliveries.view(index);
window.editDelivery = (index) => CrudManager.deliveries.edit(index);
window.deleteDelivery = (index) => CrudManager.deliveries.delete(index);
window.addTemperatureRecord = () => CrudManager.temperature.add();
window.deleteTemperatureRecord = (index) => CrudManager.temperature.delete(index);
window.addCorrectiveAction = () => CrudManager.correctiveActions.add();
window.viewCorrectiveAction = (index) => CrudManager.correctiveActions.view(index);
window.addTraining = () => CrudManager.trainings.add();
window.viewTraining = (index) => CrudManager.trainings.view(index);
window.addAudit = () => CrudManager.audits.add();
window.viewAudit = (index) => CrudManager.audits.view(index);
window.addTest = () => CrudManager.tests.add();
window.viewTest = (index) => CrudManager.tests.view(index);
window.editFlowChart = () => CrudManager.flowChart.edit();
window.showPdfExportDialog = () => App.showPdfExportDialog();
window.toggleRemindersPanel = () => App.toggleRemindersPanel();
window.showCsvExportDialog = () => CsvExport.showExportDialog();

export const App = {
    /**
     * Application state
     */
    state: {
        initialized: false,
        online: navigator.onLine,
        currentPage: 'dashboard'
    },

    /**
     * Initialize application
     */
    async init() {
        console.log('[App] Initializing INOVIT HACCP v2.0...');

        try {
            // Wait for DOM
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }

            // Register page load callbacks BEFORE navigation init
            this.registerPageCallbacks();

            // Initialize modules
            this.initAnimations();
            this.initNavigation();
            this.initEventListeners();
            this.initAccessibility();

            // Initialize reminders system
            this.initReminders();

            // Check for service worker updates
            this.checkForUpdates();

            this.state.initialized = true;
            console.log('[App] INOVIT HACCP initialized successfully');

        } catch (error) {
            console.error('[App] Initialization error:', error);
            Notifications.error('Błąd podczas uruchamiania aplikacji');
        }
    },

    /**
     * Initialize animations
     */
    initAnimations() {
        // Simple fade in for main content
        const main = document.querySelector('main');
        if (main) {
            main.classList.add('fade-in');
        }
    },

    /**
     * Initialize navigation
     */
    initNavigation() {
        // Handle initial hash or default page
        const hash = window.location.hash.slice(1);
        if (hash) {
            Navigation.showPage(hash);
        } else {
            Navigation.showPage('dashboard');
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.pageId) {
                Navigation.showPage(event.state.pageId, false);
            }
        });
    },

    /**
     * Initialize global event listeners
     */
    initEventListeners() {
        // Online/Offline status
        window.addEventListener('online', () => {
            this.state.online = true;
            Notifications.success('Połączenie z internetem przywrócone');
            this.updateOnlineStatus();
        });

        window.addEventListener('offline', () => {
            this.state.online = false;
            Notifications.warning('Brak połączenia z internetem. Tryb offline aktywny.');
            this.updateOnlineStatus();
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                GlobalSearch.open();
            }
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                Navigation.showPage('welcome');
            }
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                Navigation.showPage('dashboard');
            }
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                this.showPdfExportDialog();
            }
        });
    },

    /**
     * Initialize accessibility features
     */
    initAccessibility() {
        // Add focus outline styles if user is using keyboard
        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('user-is-tabbing');
            }
        });

        document.body.addEventListener('mousedown', () => {
            document.body.classList.remove('user-is-tabbing');
        });
    },

    /**
     * Register callbacks for page loads
     */
    registerPageCallbacks() {
        // Dashboard
        Navigation.onPageLoad('dashboard', async () => {
            await DashboardKPI.init();
        });

        // GHP/GMP
        Navigation.onPageLoad('ghp-gmp', async () => {
            await CrudManager.procedures.display();
        });

        // Schemat
        Navigation.onPageLoad('schemat', async () => {
             await CrudManager.flowChart.display();
        });

        // Analiza
        Navigation.onPageLoad('analiza', async () => {
             await CrudManager.hazards.display();
        });

        // Registers
        Navigation.onPageLoad('rejestry', async () => {
            await CrudManager.temperature.display();
            await CrudManager.deliveries.display();
        });

        // Korekty
        Navigation.onPageLoad('korekty', async () => {
             await CrudManager.correctiveActions.display();
        });

        // Szkolenia
        Navigation.onPageLoad('szkolenia', async () => {
             await CrudManager.trainings.display();
        });

        // Audyty
        Navigation.onPageLoad('audyty', async () => {
             await CrudManager.audits.display();
        });

        // Badania
        Navigation.onPageLoad('badania', async () => {
             await CrudManager.tests.display();
        });
    },

    /**
     * Update online status indicator
     */
    updateOnlineStatus() {
        const indicator = document.querySelector('.status-indicator');
        if (indicator) {
            indicator.className = `status-indicator ${this.state.online ? 'online' : 'offline'}`;
            indicator.innerHTML = `<i class="fas fa-${this.state.online ? 'wifi' : 'wifi-slash'}"></i> ${this.state.online ? 'Online' : 'Offline'}`;
        }
    },

    /**
     * Handle file import
     */
    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const loading = Notifications.loading('Importowanie danych...');

        try {
            const text = await Utils.readFileAsText(file);
            const data = JSON.parse(text);

            await storage.importData(data);

            loading.success('Dane zostały zaimportowane pomyślnie');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('[App] Import error:', error);
            loading.error('Błąd podczas importu danych: ' + error.message);
        }

        // Reset input
        event.target.value = '';
    },

    /**
     * Export all data
     */
    async exportData() {
        const loading = Notifications.loading('Przygotowywanie eksportu...');
        try {
            const data = await storage.exportData();
            const json = JSON.stringify(data, null, 2);
            const date = new Date().toISOString().split('T')[0];

            Utils.downloadFile(json, `inovit-haccp-backup-${date}.json`, 'application/json');

            loading.success('Eksport zakończony pomyślnie');
        } catch (error) {
            console.error('[App] Export error:', error);
            loading.error('Błąd podczas eksportu danych');
        }
    },

    /**
     * Import data trigger
     */
    importData() {
        document.getElementById('import-file-input').click();
    },

    /**
     * Save facility data
     */
    async saveFacilityData() {
        const form = document.getElementById('facility-form');
        if (!form) return;

        // Basic validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const loading = Notifications.loading('Zapisywanie...');

        try {
            await storage.save('facility', data);
            loading.success('Dane zakładu zostały zapisane');
        } catch (error) {
            console.error('[App] Save facility error:', error);
            loading.error('Błąd zapisu danych');
        }
    },

    /**
     * Show storage stats
     */
    async showStats() {
        const loading = Notifications.loading('Pobieranie statystyk...');
        try {
            const stats = await storage.getStats();
            loading.dismiss();

            Modal.open({
                title: 'Statystyki pamięci',
                content: `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-database"></i></div>
                            <div class="stat-content">
                                <h4>LocalStorage</h4>
                                <p>Wykorzystanie: <strong>${Utils.formatBytes(stats.localStorage.used)}</strong></p>
                                <p>Elementy: <strong>${stats.localStorage.items}</strong></p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-server"></i></div>
                            <div class="stat-content">
                                <h4>IndexedDB</h4>
                                <p>Łączna liczba rekordów: <strong>${stats.indexedDB.totalRecords}</strong></p>
                            </div>
                        </div>
                    </div>
                    <div class="stats-details">
                        <h4><i class="fas fa-list"></i> Szczegóły magazynów</h4>
                        <ul class="stats-list">
                            ${Object.entries(stats.indexedDB.stores).map(([name, count]) =>
                                `<li><span class="stats-label">${this.getStoreName(name)}</span><span class="stats-value">${count} rekordów</span></li>`
                            ).join('')}
                        </ul>
                    </div>
                    <div class="stats-status">
                        <span class="status-indicator ${navigator.onLine ? 'online' : 'offline'}">
                            <i class="fas fa-${navigator.onLine ? 'wifi' : 'wifi-slash'}"></i>
                            ${navigator.onLine ? 'Online' : 'Offline'}
                        </span>
                    </div>
                `,
                footer: `<button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>`,
                size: 'medium'
            });
        } catch (error) {
            console.error('[App] Stats error:', error);
            loading.close();
            Notifications.error('Błąd podczas pobierania statystyk');
        }
    },

    /**
     * Get human-readable store name
     */
    getStoreName(key) {
        const names = {
            facility: 'Dane zakładu',
            procedures: 'Procedury',
            hazards: 'Zagrożenia',
            temperatureLog: 'Rejestr temperatury',
            trainings: 'Szkolenia',
            audits: 'Audyty',
            tests: 'Badania',
            deliveries: 'Dostawy',
            correctiveActions: 'Działania korygujące'
        };
        return names[key] || key;
    },

    /**
     * Show help
     */
    showHelp() {
        Modal.open({
            title: 'Pomoc - INOVIT e-Segregator HACCP',
            content: `
                <div class="help-content">
                    <section class="help-section">
                        <h4><i class="fas fa-compass"></i> Nawigacja</h4>
                        <ul>
                            <li>Kliknij na moduły w centrum dokumentacji</li>
                            <li>Użyj przycisku "Centrum" do powrotu</li>
                            <li>Dane są automatycznie zapisywane lokalnie</li>
                        </ul>
                    </section>

                    <section class="help-section">
                        <h4><i class="fas fa-keyboard"></i> Skróty klawiaturowe</h4>
                        <ul class="shortcuts-list">
                            <li><kbd>Ctrl</kbd> + <kbd>K</kbd> - Globalne wyszukiwanie</li>
                            <li><kbd>Alt</kbd> + <kbd>H</kbd> - Strona główna</li>
                            <li><kbd>Alt</kbd> + <kbd>D</kbd> - Dashboard</li>
                            <li><kbd>Alt</kbd> + <kbd>E</kbd> - Eksport danych</li>
                            <li><kbd>Esc</kbd> - Zamknij okno modalne</li>
                        </ul>
                    </section>

                    <section class="help-section">
                        <h4><i class="fas fa-save"></i> Funkcje</h4>
                        <ul>
                            <li>Eksport/import danych do pliku JSON</li>
                            <li>Automatyczne zapisywanie w przeglądarce</li>
                            <li>Pełna funkcjonalność offline</li>
                            <li>Instalacja jako aplikacja PWA</li>
                        </ul>
                    </section>

                    <section class="help-section">
                        <h4><i class="fas fa-phone"></i> Wsparcie INOVIT</h4>
                        <ul class="contact-list">
                            <li><i class="fas fa-phone"></i> ${CONFIG.APP.CONTACT.PHONE}</li>
                            <li><i class="fas fa-envelope"></i> ${CONFIG.APP.CONTACT.EMAIL}</li>
                            <li><i class="fas fa-globe"></i> ${CONFIG.APP.CONTACT.WEBSITE}</li>
                        </ul>
                    </section>

                    <div class="help-footer">
                        <p><strong>Wersja ${CONFIG.APP.VERSION}</strong> - PWA z lokalnym zapisem</p>
                        <p>Wszystkie dane przechowywane bezpiecznie na Twoim urządzeniu</p>
                    </div>
                </div>
            `,
            footer: `<button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>`,
            size: 'medium'
        });
    },

    /**
     * Check for service worker updates
     */
    async checkForUpdates() {
        const updateSW = registerSW({
            onNeedRefresh() {
                Notifications.show('Dostępna nowa wersja aplikacji', 'info', {
                    duration: 0,
                    title: 'Aktualizacja',
                    actions: [
                        {
                            label: 'Odśwież',
                            handler: () => {
                                updateSW(true);
                            }
                        }
                    ]
                });
            },
            onOfflineReady() {
                Notifications.success('Aplikacja gotowa do pracy offline');
            }
        });
    },

    /**
     * Initialize reminders system
     */
    initReminders() {
        if (typeof Reminders !== 'undefined') {
            Reminders.init();
            console.log('[App] Reminders system initialized');
        }
    },

    /**
     * Show PDF export dialog
     */
    showPdfExportDialog() {
        if (typeof PDFExport !== 'undefined') {
            PDFExport.showExportDialog();
        } else {
            Notifications.error('Moduł eksportu PDF nie jest dostępny');
        }
    },

    /**
     * Toggle reminders panel
     */
    toggleRemindersPanel() {
        const panel = document.getElementById('reminders-panel');
        if (panel) {
            panel.classList.toggle('open');
            if (panel.classList.contains('open') && typeof Reminders !== 'undefined') {
                Reminders.display();
            }
        }
    }
};

window.App = App;

// Initialize application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
