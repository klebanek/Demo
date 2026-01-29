/**
 * INOVIT HACCP - Main Application Controller
 * @module app
 * @version 2.0.0
 * @description Main application entry point and controller
 */

const App = {
    /**
     * Application state
     */
    state: {
        initialized: false,
        online: navigator.onLine,
        currentPage: 'welcome'
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

            // Initialize modules
            this.initAnimations();
            this.initNavigation();
            this.initEventListeners();
            this.initAccessibility();

            // Register page load callbacks
            this.registerPageCallbacks();

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
     * Initialize CSS animations
     */
    initAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Initialize navigation
     */
    initNavigation() {
        Navigation.init();
    },

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Online/Offline events
        window.addEventListener('online', () => {
            this.state.online = true;
            document.getElementById('offline-indicator').style.display = 'none';
            Notifications.success('Połączono z internetem');
        });

        window.addEventListener('offline', () => {
            this.state.online = false;
            document.getElementById('offline-indicator').style.display = 'block';
            Notifications.warning('Tryb offline - dane zapisywane lokalnie');
        });

        // Initial offline check
        if (!navigator.onLine) {
            document.getElementById('offline-indicator').style.display = 'block';
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + H = Home
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                Navigation.showPage('welcome');
            }
            // Alt + D = Dashboard
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                Navigation.showPage('dashboard');
            }
            // Alt + E = Export
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                this.exportData();
            }
        });

        // Form auto-save with debounce
        document.addEventListener('input', Utils.debounce((e) => {
            if (e.target.closest('#facility-form')) {
                this.autoSaveFacility();
            }
        }, 1000));
    },

    /**
     * Initialize accessibility features
     */
    initAccessibility() {
        // Create ARIA live region
        Utils.createAnnouncer();

        // Skip link
        const skipLink = Utils.createElement('a', {
            href: '#main-content',
            className: 'skip-link',
            onClick: (e) => {
                e.preventDefault();
                const main = document.querySelector('.main-content');
                if (main) {
                    main.setAttribute('tabindex', '-1');
                    main.focus();
                }
            }
        }, 'Przejdź do treści głównej');
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main landmark
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.setAttribute('role', 'main');
            mainContent.id = 'main-content';
        }

        // Add header landmark
        const header = document.querySelector('.header');
        if (header) {
            header.setAttribute('role', 'banner');
        }

        // Improve button accessibility
        document.querySelectorAll('.nav-btn, .module-card').forEach(el => {
            if (!el.getAttribute('aria-label') && !el.textContent.trim()) {
                const icon = el.querySelector('i');
                if (icon) {
                    el.setAttribute('aria-label', icon.className);
                }
            }
        });
    },

    /**
     * Register page load callbacks
     */
    registerPageCallbacks() {
        Navigation.onPageLoad('opis-zakladu', () => this.loadFacilityData());
        Navigation.onPageLoad('ghp-gmp', () => CrudManager.procedures.display());
        Navigation.onPageLoad('schemat', () => CrudManager.flowChart.display());
        Navigation.onPageLoad('analiza', () => CrudManager.hazards.display());
        Navigation.onPageLoad('rejestry', async () => {
            await CrudManager.temperature.display();
            await CrudManager.deliveries.display();
        });
        Navigation.onPageLoad('korekty', () => CrudManager.correctiveActions.display());
        Navigation.onPageLoad('szkolenia', () => CrudManager.trainings.display());
        Navigation.onPageLoad('audyty', () => CrudManager.audits.display());
        Navigation.onPageLoad('badania', () => CrudManager.tests.display());
    },

    /**
     * Load facility data
     */
    async loadFacilityData() {
        const data = await storage.load('facility');
        if (!data) return;

        const form = document.getElementById('facility-form');
        if (!form) return;

        // Populate form fields
        Object.entries(data).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value || '';
            }
        });

        // Setup form submission
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.saveFacilityData();
        };
    },

    /**
     * Save facility data
     */
    async saveFacilityData() {
        const form = document.getElementById('facility-form');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate
        const validation = Validators.validateForm(data, {
            name: ['required', { minLength: 2 }]
        });

        if (!validation.isValid) {
            Validators.showFormErrors(form, validation.errors);
            Notifications.warning('Popraw błędy w formularzu');
            return;
        }

        // Save
        const btn = document.getElementById('save-facility-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zapisywanie...';
        }

        try {
            data.lastModified = new Date().toISOString();
            await storage.save('facility', data);
            Notifications.success('Dane zakładu zostały zapisane');
        } catch (error) {
            console.error('[App] Save error:', error);
            Notifications.error('Błąd podczas zapisywania danych');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Zapisz dane';
            }
        }
    },

    /**
     * Auto-save facility data (debounced)
     */
    async autoSaveFacility() {
        const form = document.getElementById('facility-form');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.lastModified = new Date().toISOString();
        data.autoSaved = true;

        try {
            await storage.save('facility', data);
            // Silent save - no notification for autosave
        } catch (error) {
            console.error('[App] Autosave error:', error);
        }
    },

    /**
     * Export all data
     */
    async exportData() {
        const loading = Notifications.loading('Eksportowanie danych...');

        try {
            const data = await storage.exportData();
            const json = JSON.stringify(data, null, 2);
            const filename = `inovit-haccp-export-${Utils.getCurrentDate()}.json`;
            Utils.downloadFile(json, filename, 'application/json');
            loading.success('Dane zostały wyeksportowane');
        } catch (error) {
            console.error('[App] Export error:', error);
            loading.error('Błąd podczas eksportu danych');
        }
    },

    /**
     * Import data
     */
    importData() {
        document.getElementById('import-file-input').click();
    },

    /**
     * Handle import file
     */
    async handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        if (!Validators.fileType(file, ['application/json'])) {
            Notifications.error('Nieprawidłowy typ pliku. Wybierz plik JSON.');
            return;
        }

        if (!Validators.fileSize(file, CONFIG.UI.MAX_FILE_SIZE)) {
            Notifications.error(`Plik jest zbyt duży. Maksymalny rozmiar: ${Utils.formatBytes(CONFIG.UI.MAX_FILE_SIZE)}`);
            return;
        }

        const confirmed = await Modal.confirm(
            'Czy na pewno chcesz zaimportować dane? Obecne dane mogą zostać nadpisane.',
            { title: 'Potwierdzenie importu', confirmText: 'Importuj', icon: 'fas fa-upload' }
        );

        if (!confirmed) {
            event.target.value = '';
            return;
        }

        const loading = Notifications.loading('Importowanie danych...');

        try {
            const text = await Utils.readFileAsText(file);
            const data = Utils.parseJSON(text);

            if (!data) {
                throw new Error('Invalid JSON');
            }

            const result = await storage.importData(data);

            if (result.success) {
                loading.success('Dane zostały zaimportowane. Odświeżanie strony...');
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('[App] Import error:', error);
            loading.error('Błąd podczas importowania danych');
        }

        event.target.value = '';
    },

    /**
     * Show statistics
     */
    async showStats() {
        const loading = Modal.loading('Ładowanie statystyk...');

        try {
            const stats = await storage.getStats();

            Modal.open({
                title: 'Statystyki aplikacji',
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
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) return;

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        Notifications.show('Dostępna nowa wersja aplikacji', 'info', {
                            duration: 0,
                            title: 'Aktualizacja',
                            actions: [
                                {
                                    label: 'Odśwież',
                                    handler: () => {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        window.location.reload();
                                    }
                                }
                            ]
                        });
                    }
                });
            });
        } catch (error) {
            console.warn('[App] Update check failed:', error);
        }
    }
};

// Legacy support - global functions
function showPage(pageId) {
    Navigation.showPage(pageId);
}

function exportData() {
    App.exportData();
}

function importData() {
    App.importData();
}

function handleImportFile(event) {
    App.handleImportFile(event);
}

function showStats() {
    App.showStats();
}

function showHelp() {
    App.showHelp();
}

// Legacy CRUD functions for backwards compatibility
async function saveFacilityData() {
    await App.saveFacilityData();
}

function addProcedure() {
    CrudManager.procedures.add();
}

function editProcedure(id) {
    CrudManager.procedures.edit(id);
}

function addHazard() {
    CrudManager.hazards.add();
}

function editHazard(id) {
    CrudManager.hazards.edit(id);
}

function addDelivery() {
    CrudManager.deliveries.add();
}

function viewDelivery(index) {
    CrudManager.deliveries.view(index);
}

function editDelivery(index) {
    CrudManager.deliveries.edit(index);
}

function deleteDelivery(index) {
    CrudManager.deliveries.delete(index);
}

function addTemperatureRecord() {
    CrudManager.temperature.add();
}

function deleteTemperatureRecord(index) {
    CrudManager.temperature.delete(index);
}

function addCorrectiveAction() {
    CrudManager.correctiveActions.add();
}

function viewCorrectiveAction(index) {
    CrudManager.correctiveActions.view(index);
}

function addTraining() {
    CrudManager.trainings.add();
}

function viewTraining(index) {
    CrudManager.trainings.view(index);
}

function addAudit() {
    CrudManager.audits.add();
}

function viewAudit(index) {
    CrudManager.audits.view(index);
}

function addTest() {
    CrudManager.tests.add();
}

function viewTest(index) {
    CrudManager.tests.view(index);
}

function editFlowChart() {
    CrudManager.flowChart.edit();
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => App.init());

// Export for ES6 modules (future use)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
