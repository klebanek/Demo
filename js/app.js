/**
 * INOVIT HACCP - Main Application Logic
 * PWA with Local Storage Support
 */

// Global state management
let currentPage = 'welcome';
let appData = {
    facility: {},
    procedures: [],
    hazards: [],
    temperatureLog: [],
    trainings: [],
    audits: [],
    tests: [],
    deliveries: [],
    correctiveActions: []
};

// Page navigation
function showPage(pageId) {
    console.log('[App] Showing page:', pageId);

    // Get content container
    const contentContainer = document.getElementById('content-container');

    // Hide all static pages (welcome and dashboard)
    const welcomePage = document.getElementById('welcome');
    const dashboardPage = document.getElementById('dashboard');

    if (welcomePage) {
        welcomePage.classList.add('page-hidden');
    }
    if (dashboardPage) {
        dashboardPage.classList.add('page-hidden');
    }

    // Clear dynamic content container
    if (contentContainer) {
        contentContainer.innerHTML = '';
    }

    // Show selected page
    if (pageId === 'welcome' || pageId === 'dashboard') {
        // Static pages - show the target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('page-hidden');

            // Force animation restart
            const animatedElement = targetPage.querySelector('.fade-in-up') || targetPage;
            if (animatedElement.classList.contains('fade-in-up')) {
                animatedElement.classList.remove('fade-in-up');
                // Force reflow to restart animation
                void animatedElement.offsetWidth;
                animatedElement.classList.add('fade-in-up');
            }

            currentPage = pageId;
            console.log('[App] Showing static page:', pageId);
        } else {
            console.error('[App] Target page not found:', pageId);
        }
    } else {
        // Dynamic pages - load into content container
        loadContentPage(pageId);
    }

    // Update browser URL without reloading
    if (history.pushState) {
        history.pushState(null, null, '#' + pageId);
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// Load content pages dynamically
function loadContentPage(pageId) {
    const contentContainer = document.getElementById('content-container');
    const pageContent = getPageContent(pageId);

    if (pageContent) {
        contentContainer.innerHTML = pageContent;
        currentPage = pageId;

        // Update browser URL
        if (history.pushState) {
            history.pushState(null, null, '#' + pageId);
        }

        // Load data for the page
        loadPageData(pageId);
    }
}

// Get page content HTML
function getPageContent(pageId) {
    const pages = {
        'wprowadzenie': getIntroductionPage(),
        'opis-zakladu': getFacilityPage(),
        'ghp-gmp': getGHPPage(),
        'schemat': getSchemaPage(),
        'analiza': getHazardAnalysisPage(),
        'rejestry': getRegistersPage(),
        'korekty': getCorrectiveActionsPage(),
        'szkolenia': getTrainingsPage(),
        'audyty': getAuditsPage(),
        'badania': getTestsPage()
    };

    return pages[pageId] || null;
}

// Page content templates
function getIntroductionPage() {
    return `
        <div id="wprowadzenie" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Wprowadzenie do dokumentacji HACCP</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Podstawy systemu HACCP</h4>
                <p>System HACCP (Hazard Analysis and Critical Control Points) to systematyczne podejście do identyfikacji, oceny i kontroli zagrożeń bezpieczeństwa żywności.</p>

                <h4>Siedem zasad HACCP:</h4>
                <ol>
                    <li><strong>Analiza zagrożeń</strong> - identyfikacja potencjalnych zagrożeń</li>
                    <li><strong>Krytyczne punkty kontroli (CCP)</strong> - określenie punktów kontroli</li>
                    <li><strong>Limity krytyczne</strong> - ustanowienie granic bezpieczeństwa</li>
                    <li><strong>Monitorowanie</strong> - system nadzoru nad CCP</li>
                    <li><strong>Działania korygujące</strong> - procedury naprawcze</li>
                    <li><strong>Weryfikacja</strong> - potwierdzenie skuteczności systemu</li>
                    <li><strong>Dokumentacja</strong> - prowadzenie zapisów</li>
                </ol>

                <h4>Podstawy prawne</h4>
                <ul>
                    <li>Rozporządzenie (WE) nr 852/2004</li>
                    <li>Rozporządzenie (WE) nr 853/2004</li>
                    <li>Ustawa o bezpieczeństwie żywności i żywienia</li>
                </ul>
            </div>
        </div>
    `;
}

function getFacilityPage() {
    return `
        <div id="opis-zakladu" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Opis zakładu</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Dane identyfikacyjne zakładu</h4>
                <div class="form-group">
                    <label>Nazwa zakładu</label>
                    <input type="text" id="facility-name" class="form-control" placeholder="Wprowadź nazwę zakładu">
                </div>
                <div class="form-group">
                    <label>Adres</label>
                    <input type="text" id="facility-address" class="form-control" placeholder="Ulica, numer">
                </div>
                <div class="form-group">
                    <label>Kod pocztowy i miejscowość</label>
                    <input type="text" id="facility-city" class="form-control" placeholder="00-000 Miasto">
                </div>
                <div class="form-group">
                    <label>NIP</label>
                    <input type="text" id="facility-nip" class="form-control" placeholder="000-000-00-00">
                </div>
            </div>

            <div class="form-section">
                <h4>Charakterystyka działalności</h4>
                <div class="form-group">
                    <label>Rodzaj działalności</label>
                    <select id="facility-type" class="form-control">
                        <option>Wybierz rodzaj działalności</option>
                        <option>Produkcja żywności</option>
                        <option>Handel detaliczny</option>
                        <option>Handel hurtowy</option>
                        <option>Gastronomia</option>
                        <option>Catering</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Asortyment</label>
                    <textarea id="facility-products" class="form-control" placeholder="Opisz produkowane/sprzedawane produkty"></textarea>
                </div>
            </div>

            <button class="btn btn-success" onclick="saveFacilityData()">
                <i class="fas fa-save"></i> Zapisz dane
            </button>
        </div>
    `;
}

function getGHPPage() {
    return `
        <div id="ghp-gmp" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Program GHP/GMP</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Procedury obowiązkowe</h4>
                <table class="data-table" id="procedures-table">
                    <thead>
                        <tr>
                            <th>Procedura</th>
                            <th>Status</th>
                            <th>Data ostatniej aktualizacji</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Higiena personelu</td>
                            <td><span class="status status-completed">Ukończone</span></td>
                            <td>2025-01-15</td>
                            <td><button class="btn btn-small" onclick="editProcedure(1)">Edytuj</button></td>
                        </tr>
                        <tr>
                            <td>Mycie i dezynfekcja</td>
                            <td><span class="status status-pending">W trakcie</span></td>
                            <td>2025-01-10</td>
                            <td><button class="btn btn-small" onclick="editProcedure(2)">Edytuj</button></td>
                        </tr>
                        <tr>
                            <td>Kontrola szkodników</td>
                            <td><span class="status status-overdue">Opóźnione</span></td>
                            <td>2024-12-20</td>
                            <td><button class="btn btn-small" onclick="editProcedure(3)">Edytuj</button></td>
                        </tr>
                        <tr>
                            <td>Jakość wody</td>
                            <td><span class="status status-completed">Ukończone</span></td>
                            <td>2025-01-12</td>
                            <td><button class="btn btn-small" onclick="editProcedure(4)">Edytuj</button></td>
                        </tr>
                        <tr>
                            <td>Gospodarowanie odpadami</td>
                            <td><span class="status status-pending">W trakcie</span></td>
                            <td>2025-01-08</td>
                            <td><button class="btn btn-small" onclick="editProcedure(5)">Edytuj</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <button class="btn" onclick="addProcedure()">
                <i class="fas fa-plus"></i> Dodaj nową procedurę
            </button>
        </div>
    `;
}

function getSchemaPage() {
    return `
        <div id="schemat" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Schemat technologiczny</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Przepływ procesu produkcyjnego</h4>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <div style="background: var(--secondary-color); color: white; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                            PRZYJĘCIE SUROWCA
                        </div>
                        <div style="font-size: 24px; color: var(--secondary-color);">↓</div>
                        <div style="background: var(--secondary-color); color: white; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                            PRZECHOWYWANIE
                        </div>
                        <div style="font-size: 24px; color: var(--secondary-color);">↓</div>
                        <div style="background: var(--secondary-color); color: white; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                            PRZYGOTOWANIE
                        </div>
                        <div style="font-size: 24px; color: var(--secondary-color);">↓</div>
                        <div style="background: var(--danger-color); color: white; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                            OBRÓBKA TERMICZNA (CCP)
                        </div>
                        <div style="font-size: 24px; color: var(--secondary-color);">↓</div>
                        <div style="background: var(--secondary-color); color: white; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                            CHŁODZENIE
                        </div>
                        <div style="font-size: 24px; color: var(--secondary-color);">↓</div>
                        <div style="background: var(--secondary-color); color: white; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                            PAKOWANIE
                        </div>
                        <div style="font-size: 24px; color: var(--secondary-color);">↓</div>
                        <div style="background: var(--success-color); color: white; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                            WYDANIE PRODUKTU
                        </div>
                    </div>
                </div>

                <button class="btn" onclick="editFlowChart()">
                    <i class="fas fa-edit"></i> Edytuj schemat
                </button>
            </div>
        </div>
    `;
}

function getHazardAnalysisPage() {
    return `
        <div id="analiza" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Analiza zagrożeń HACCP</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Matryca analizy zagrożeń</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Etap procesu</th>
                            <th>Zagrożenie</th>
                            <th>Typ zagrożenia</th>
                            <th>Prawdopodobieństwo</th>
                            <th>Skutki</th>
                            <th>Ryzyko</th>
                            <th>CCP</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="hazards-table">
                        <tr>
                            <td>Przyjęcie surowca</td>
                            <td>Zanieczyszczenie mikrobiologiczne</td>
                            <td>Biologiczne</td>
                            <td>Średnie</td>
                            <td>Wysokie</td>
                            <td><span class="status status-warning">Wysokie</span></td>
                            <td>TAK</td>
                            <td><button class="btn btn-small" onclick="editHazard(1)">Edytuj</button></td>
                        </tr>
                        <tr>
                            <td>Obróbka termiczna</td>
                            <td>Niedogotowanie</td>
                            <td>Biologiczne</td>
                            <td>Niskie</td>
                            <td>Wysokie</td>
                            <td><span class="status status-danger">Krytyczne</span></td>
                            <td>TAK</td>
                            <td><button class="btn btn-small" onclick="editHazard(2)">Edytuj</button></td>
                        </tr>
                        <tr>
                            <td>Przechowywanie</td>
                            <td>Wzrost temperatury</td>
                            <td>Fizyczne</td>
                            <td>Średnie</td>
                            <td>Średnie</td>
                            <td><span class="status status-warning">Średnie</span></td>
                            <td>NIE</td>
                            <td><button class="btn btn-small" onclick="editHazard(3)">Edytuj</button></td>
                        </tr>
                    </tbody>
                </table>

                <button class="btn" onclick="addHazard()">
                    <i class="fas fa-plus"></i> Dodaj zagrożenie
                </button>
            </div>
        </div>
    `;
}

function getRegistersPage() {
    return `
        <div id="rejestry" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Rejestry i zapisy</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Rejestr kontroli temperatury</h4>
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Godzina</th>
                                <th>Urządzenie</th>
                                <th>Temperatura (°C)</th>
                                <th>Norma</th>
                                <th>Status</th>
                                <th>Uwagi</th>
                                <th>Podpis</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody id="temperature-log">
                            <!-- Will be populated from storage -->
                        </tbody>
                    </table>
                </div>

                <button class="btn btn-success" onclick="addTemperatureRecord()">
                    <i class="fas fa-plus"></i> Dodaj pomiar
                </button>
            </div>

            <div class="form-section">
                <h4>Rejestr dostaw surowca</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Data dostawy</th>
                            <th>Dostawca</th>
                            <th>Produkt</th>
                            <th>Ilość</th>
                            <th>Temperatura</th>
                            <th>Termin ważności</th>
                            <th>Ocena jakości</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="deliveries-table">
                        <!-- Will be populated from storage -->
                    </tbody>
                </table>

                <button class="btn" onclick="addDelivery()">
                    <i class="fas fa-plus"></i> Dodaj dostawę
                </button>
            </div>
        </div>
    `;
}

function getCorrectiveActionsPage() {
    return `
        <div id="korekty" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Działania korygujące</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Rejestr działań korygujących</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Data zgłoszenia</th>
                            <th>Opis problemu</th>
                            <th>CCP</th>
                            <th>Działanie podjęte</th>
                            <th>Odpowiedzialny</th>
                            <th>Status</th>
                            <th>Data zamknięcia</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="corrective-actions-table">
                        <!-- Will be populated from storage -->
                    </tbody>
                </table>

                <button class="btn btn-warning" onclick="addCorrectiveAction()">
                    <i class="fas fa-exclamation-triangle"></i> Zgłoś problem
                </button>
            </div>
        </div>
    `;
}

function getTrainingsPage() {
    return `
        <div id="szkolenia" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Szkolenia pracowników</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Plan szkoleń na 2025 rok</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Temat szkolenia</th>
                            <th>Data planowana</th>
                            <th>Prowadzący</th>
                            <th>Uczestnicy</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="trainings-table">
                        <!-- Will be populated from storage -->
                    </tbody>
                </table>

                <button class="btn" onclick="addTraining()">
                    <i class="fas fa-plus"></i> Dodaj szkolenie
                </button>
            </div>
        </div>
    `;
}

function getAuditsPage() {
    return `
        <div id="audyty" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Audyty i weryfikacja</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Harmonogram audytów</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Typ audytu</th>
                            <th>Data</th>
                            <th>Audytor</th>
                            <th>Obszar</th>
                            <th>Wynik</th>
                            <th>Uwagi</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="audits-table">
                        <!-- Will be populated from storage -->
                    </tbody>
                </table>

                <button class="btn" onclick="addAudit()">
                    <i class="fas fa-search"></i> Zaplanuj audyt
                </button>
            </div>
        </div>
    `;
}

function getTestsPage() {
    return `
        <div id="badania" class="content-page fade-in-up">
            <div class="page-header">
                <h2 class="page-title">Plan i rejestr badań</h2>
                <button class="back-btn" onclick="showPage('dashboard')">
                    <i class="fas fa-arrow-left"></i> Centrum
                </button>
            </div>

            <div class="form-section">
                <h4>Plan badań na 2025</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Typ badania</th>
                            <th>Materiał</th>
                            <th>Częstotliwość</th>
                            <th>Laboratorium</th>
                            <th>Ostatnie badanie</th>
                            <th>Następne badanie</th>
                            <th>Status</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="tests-table">
                        <!-- Will be populated from storage -->
                    </tbody>
                </table>

                <button class="btn" onclick="addTest()">
                    <i class="fas fa-vial"></i> Dodaj badanie
                </button>
            </div>
        </div>
    `;
}

// Data management functions
async function saveFacilityData() {
    const facilityData = {
        name: document.getElementById('facility-name')?.value || '',
        address: document.getElementById('facility-address')?.value || '',
        city: document.getElementById('facility-city')?.value || '',
        nip: document.getElementById('facility-nip')?.value || '',
        type: document.getElementById('facility-type')?.value || '',
        products: document.getElementById('facility-products')?.value || '',
        lastModified: new Date().toISOString()
    };

    const result = await storage.save('facility', facilityData);

    if (result.success) {
        showNotification('Dane zakładu zostały zapisane pomyślnie!', 'success');
    } else {
        showNotification('Błąd podczas zapisywania danych', 'error');
    }
}

async function loadPageData(pageId) {
    if (pageId === 'opis-zakladu') {
        const facilityData = await storage.load('facility');
        if (facilityData) {
            setTimeout(() => {
                document.getElementById('facility-name').value = facilityData.name || '';
                document.getElementById('facility-address').value = facilityData.address || '';
                document.getElementById('facility-city').value = facilityData.city || '';
                document.getElementById('facility-nip').value = facilityData.nip || '';
                document.getElementById('facility-type').value = facilityData.type || '';
                document.getElementById('facility-products').value = facilityData.products || '';
            }, 100);
        }
    } else if (pageId === 'rejestry') {
        await loadTemperatureLog();
        await loadDeliveries();
    }
}

async function loadTemperatureLog() {
    const log = await storage.load('temperatureLog') || [];
    const tbody = document.getElementById('temperature-log');

    if (tbody) {
        tbody.innerHTML = log.length === 0 ? '<tr><td colspan="9" style="text-align: center;">Brak zapisów</td></tr>' :
            log.map((record, index) => `
                <tr>
                    <td>${record.date || ''}</td>
                    <td>${record.time || ''}</td>
                    <td>${record.device || ''}</td>
                    <td>${record.temperature || ''}</td>
                    <td>${record.norm || ''}</td>
                    <td><span class="status ${record.status === 'OK' ? 'status-completed' : 'status-warning'}">${record.status || 'OK'}</span></td>
                    <td>${record.notes || '-'}</td>
                    <td>${record.signature || ''}</td>
                    <td><button class="btn btn-small btn-danger" onclick="deleteTemperatureRecord(${index})"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
    }
}

async function loadDeliveries() {
    const deliveries = await storage.load('deliveries') || [];
    const tbody = document.getElementById('deliveries-table');

    if (tbody) {
        tbody.innerHTML = deliveries.length === 0 ? '<tr><td colspan="8" style="text-align: center;">Brak dostaw</td></tr>' :
            deliveries.map((delivery, index) => `
                <tr>
                    <td>${delivery.date || ''}</td>
                    <td>${delivery.supplier || ''}</td>
                    <td>${delivery.product || ''}</td>
                    <td>${delivery.quantity || ''}</td>
                    <td>${delivery.temperature || ''}</td>
                    <td>${delivery.expiryDate || ''}</td>
                    <td><span class="status status-completed">${delivery.quality || 'Przyjęto'}</span></td>
                    <td><button class="btn btn-small" onclick="viewDelivery(${index})">Szczegóły</button></td>
                </tr>
            `).join('');
    }
}

async function addTemperatureRecord() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);

    const device = prompt('Nazwa urządzenia:');
    if (!device) return;

    const temperature = prompt('Temperatura (°C):');
    if (!temperature) return;

    const norm = prompt('Norma (np. 0-4°C):');
    const notes = prompt('Uwagi (opcjonalnie):') || '-';
    const signature = prompt('Inicjały:');

    const record = {
        date,
        time,
        device,
        temperature,
        norm: norm || '',
        status: 'OK',
        notes,
        signature: signature || '',
        timestamp: now.toISOString()
    };

    await storage.addItem('temperatureLog', record);
    showNotification('Pomiar został dodany', 'success');
    loadTemperatureLog();
}

async function deleteTemperatureRecord(index) {
    if (!confirm('Czy na pewno chcesz usunąć ten pomiar?')) return;

    const log = await storage.load('temperatureLog') || [];
    log.splice(index, 1);
    await storage.save('temperatureLog', log);
    showNotification('Pomiar został usunięty', 'success');
    loadTemperatureLog();
}

async function addDelivery() {
    showNotification('Funkcja dodawania dostaw - użyj przycisku "Dodaj dostawę" aby wprowadzić dane', 'info');
}

// Export/Import functions
async function exportData() {
    try {
        const data = await storage.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'inovit-haccp-export-' + new Date().toISOString().split('T')[0] + '.json';
        link.click();

        showNotification('Dane zostały wyeksportowane', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Błąd podczas eksportu danych', 'error');
    }
}

function importData() {
    document.getElementById('import-file-input').click();
}

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        const result = await storage.importData(data);

        if (result.success) {
            showNotification('Dane zostały zaimportowane pomyślnie!', 'success');
            location.reload();
        } else {
            showNotification('Błąd podczas importowania danych', 'error');
        }
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Nieprawidłowy format pliku', 'error');
    }
}

async function showStats() {
    try {
        const stats = await storage.getStats();

        const message = `
📊 STATYSTYKI APLIKACJI

💾 LocalStorage:
• Wykorzystanie: ${(stats.localStorage.used / 1024).toFixed(2)} KB
• Dostępne: ${(stats.localStorage.available / 1024).toFixed(2)} KB
• Elementy: ${stats.localStorage.items}

🗄️ IndexedDB:
• Łączna liczba rekordów: ${stats.indexedDB.totalRecords}
${Object.entries(stats.indexedDB.stores).map(([name, count]) =>
    `• ${name}: ${count} rekordów`
).join('\n')}

📱 Status: ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}
        `;

        alert(message);
    } catch (error) {
        console.error('Stats error:', error);
        showNotification('Błąd podczas pobierania statystyk', 'error');
    }
}

function showHelp() {
    const helpText = `
🔹 INOVIT e-Segregator HACCP - Pomoc

📋 Nawigacja:
• Kliknij na moduły w centrum dokumentacji
• Użyj przycisków "Wróć" do nawigacji
• Dane są automatycznie zapisywane lokalnie

💾 Funkcje:
• Eksport danych do pliku JSON
• Import danych z pliku JSON
• Automatyczne zapisywanie w przeglądarce
• Tryb offline - pełna funkcjonalność bez internetu
• Synchronizacja localStorage + IndexedDB

📱 PWA (Progressive Web App):
• Zainstaluj aplikację na swoim urządzeniu
• Działa offline
• Powiadomienia push (opcjonalnie)
• Szybki dostęp z ekranu głównego

📞 Wsparcie INOVIT:
• Tel: +48 575-757-638
• Email: kontakt@inovit.com.pl
• Web: www.inovit.com.pl

⚡ Wersja PWA z lokalnym zapisem
Wszystkie dane przechowywane bezpiecznie na Twoim urządzeniu
    `;

    alert(helpText);
}

// Placeholder functions
function addProcedure() {
    showNotification('Funkcja dodawania procedur - w pełnej wersji dostępna pełna edycja', 'info');
}

function editProcedure(id) {
    showNotification(`Edycja procedury #${id} - funkcja w rozwoju`, 'info');
}

function addHazard() {
    showNotification('Funkcja dodawania zagrożeń - w pełnej wersji dostępny pełny formularz', 'info');
}

function editHazard(id) {
    showNotification(`Edycja zagrożenia #${id} - funkcja w rozwoju`, 'info');
}

function addCorrectiveAction() {
    showNotification('Funkcja zgłaszania działań korygujących - w pełnej wersji dostępny pełny formularz', 'info');
}

function addTraining() {
    showNotification('Funkcja dodawania szkoleń - w pełnej wersji dostępny kalendarz i zarządzanie uczestnikami', 'info');
}

function addAudit() {
    showNotification('Funkcja planowania audytów - w pełnej wersji dostępny pełen system audytów', 'info');
}

function addTest() {
    showNotification('Funkcja dodawania badań - w pełnej wersji dostępny pełny plan badań', 'info');
}

function editFlowChart() {
    showNotification('Edytor schematu technologicznego - w pełnej wersji dostępny wizualny edytor', 'info');
}

function viewDelivery(index) {
    showNotification(`Podgląd dostawy #${index + 1} - funkcja w rozwoju`, 'info');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#007380'};
        color: ${type === 'warning' ? '#333' : 'white'};
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 300px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[App] Initializing INOVIT HACCP PWA...');

    // Handle browser back/forward
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.substring(1);
        if (hash && isValidPage(hash)) {
            showPage(hash);
        } else {
            showPage('welcome');
        }
    });

    // Add CSS animations
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
    `;
    document.head.appendChild(style);

    // Set initial page from URL or show welcome
    const initialHash = window.location.hash.substring(1);
    if (initialHash && isValidPage(initialHash)) {
        showPage(initialHash);
    } else {
        // Explicitly show welcome page
        showPage('welcome');
    }

    console.log('[App] INOVIT HACCP PWA initialized successfully');
});

// Check if page ID is valid
function isValidPage(pageId) {
    const validPages = [
        'welcome',
        'dashboard',
        'wprowadzenie',
        'opis-zakladu',
        'ghp-gmp',
        'schemat',
        'analiza',
        'rejestry',
        'korekty',
        'szkolenia',
        'audyty',
        'badania'
    ];
    return validPages.includes(pageId);
}
