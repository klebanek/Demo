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
                            <th>Data aktualizacji</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody id="procedures-tbody"></tbody>
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
                    <div id="flowchart-container" style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <!-- Dynamic content loaded by loadFlowChartDisplay() -->
                    </div>
                </div>

                <button class="btn" onclick="editFlowChart()" style="margin-top: 20px;">
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
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Etap</th>
                                <th>Zagrożenie</th>
                                <th>Typ</th>
                                <th>Ryzyko</th>
                                <th>CCP</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody id="hazards-tbody"></tbody>
                    </table>
                </div>

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
    } else if (pageId === 'ghp-gmp') {
        await loadProceduresDisplay();
    } else if (pageId === 'analiza') {
        await loadHazardsDisplay();
    } else if (pageId === 'korekty') {
        await loadCorrectiveActionsDisplay();
    } else if (pageId === 'szkolenia') {
        await loadTrainingsDisplay();
    } else if (pageId === 'audyty') {
        await loadAuditsDisplay();
    } else if (pageId === 'badania') {
        await loadTestsDisplay();
    } else if (pageId === 'schemat') {
        await loadFlowChartDisplay();
    }
}

// Load display functions for dynamic pages
async function loadProceduresDisplay() {
    await loadProceduresData();
    const tbody = document.getElementById('procedures-tbody');
    if (!tbody) return;

    const statusClass = (s) => s === 'Ukończone' ? 'status-completed' : s === 'Opóźnione' ? 'status-overdue' : 'status-pending';
    tbody.innerHTML = proceduresData.length === 0
        ? '<tr><td colspan="4" style="text-align:center;">Brak procedur</td></tr>'
        : proceduresData.map(p => `
            <tr>
                <td>${p.name}</td>
                <td><span class="status ${statusClass(p.status)}">${p.status}</span></td>
                <td>${p.date || '-'}</td>
                <td><button class="btn btn-small" onclick="editProcedure(${p.id})">Edytuj</button></td>
            </tr>
        `).join('');
}

async function loadHazardsDisplay() {
    await loadHazardsData();
    const tbody = document.getElementById('hazards-tbody');
    if (!tbody) return;

    const riskClass = (r) => r === 'Krytyczne' ? 'status-overdue' : r === 'Wysokie' ? 'status-warning' : 'status-completed';
    tbody.innerHTML = hazardsData.length === 0
        ? '<tr><td colspan="6" style="text-align:center;">Brak zagrożeń</td></tr>'
        : hazardsData.map(h => `
            <tr>
                <td>${h.stage}</td>
                <td>${h.hazard}</td>
                <td>${h.type}</td>
                <td><span class="status ${riskClass(h.risk)}">${h.risk}</span></td>
                <td>${h.ccp}</td>
                <td><button class="btn btn-small" onclick="editHazard(${h.id})">Edytuj</button></td>
            </tr>
        `).join('');
}

async function loadCorrectiveActionsDisplay() {
    const actions = await storage.load('correctiveActions') || [];
    const tbody = document.getElementById('corrective-actions-table');
    if (!tbody) return;

    const statusClass = (s) => s === 'Zamknięte' ? 'status-completed' : s === 'Otwarte' ? 'status-overdue' : 'status-pending';
    tbody.innerHTML = actions.length === 0
        ? '<tr><td colspan="8" style="text-align:center;">Brak działań korygujących</td></tr>'
        : actions.map((a, i) => `
            <tr>
                <td>${a.date}</td>
                <td>${a.problem}</td>
                <td>${a.ccp}</td>
                <td>${a.actionTaken}</td>
                <td>${a.responsible}</td>
                <td><span class="status ${statusClass(a.status)}">${a.status}</span></td>
                <td>${a.closeDate}</td>
                <td><button class="btn btn-small" onclick="viewCorrectiveAction(${i})">Szczegóły</button></td>
            </tr>
        `).join('');
}

async function loadTrainingsDisplay() {
    const trainings = await storage.load('trainings') || [];
    const tbody = document.getElementById('trainings-table');
    if (!tbody) return;

    const statusClass = (s) => s === 'Zrealizowane' ? 'status-completed' : s === 'Anulowane' ? 'status-overdue' : 'status-pending';
    tbody.innerHTML = trainings.length === 0
        ? '<tr><td colspan="6" style="text-align:center;">Brak szkoleń</td></tr>'
        : trainings.map((t, i) => `
            <tr>
                <td>${t.topic}</td>
                <td>${t.date}</td>
                <td>${t.trainer}</td>
                <td>${t.participants}</td>
                <td><span class="status ${statusClass(t.status)}">${t.status}</span></td>
                <td><button class="btn btn-small" onclick="viewTraining(${i})">Szczegóły</button></td>
            </tr>
        `).join('');
}

async function loadAuditsDisplay() {
    const audits = await storage.load('audits') || [];
    const tbody = document.getElementById('audits-table');
    if (!tbody) return;

    const resultClass = (r) => r === 'Pozytywny' ? 'status-completed' : r === 'Negatywny' ? 'status-overdue' : 'status-pending';
    tbody.innerHTML = audits.length === 0
        ? '<tr><td colspan="7" style="text-align:center;">Brak audytów</td></tr>'
        : audits.map((a, i) => `
            <tr>
                <td>${a.type}</td>
                <td>${a.date}</td>
                <td>${a.auditor}</td>
                <td>${a.area}</td>
                <td><span class="status ${resultClass(a.result)}">${a.result}</span></td>
                <td>${a.notes || '-'}</td>
                <td><button class="btn btn-small" onclick="viewAudit(${i})">Szczegóły</button></td>
            </tr>
        `).join('');
}

async function loadTestsDisplay() {
    const tests = await storage.load('tests') || [];
    const tbody = document.getElementById('tests-table');
    if (!tbody) return;

    const statusClass = (s) => s === 'Aktualne' ? 'status-completed' : s === 'Przeterminowane' ? 'status-overdue' : 'status-pending';
    tbody.innerHTML = tests.length === 0
        ? '<tr><td colspan="8" style="text-align:center;">Brak badań</td></tr>'
        : tests.map((t, i) => `
            <tr>
                <td>${t.type}</td>
                <td>${t.material}</td>
                <td>${t.frequency}</td>
                <td>${t.lab}</td>
                <td>${t.lastTest}</td>
                <td>${t.nextTest}</td>
                <td><span class="status ${statusClass(t.status)}">${t.status}</span></td>
                <td><button class="btn btn-small" onclick="viewTest(${i})">Szczegóły</button></td>
            </tr>
        `).join('');
}

async function loadFlowChartDisplay() {
    await loadFlowChartData();
    const container = document.getElementById('flowchart-container');
    if (!container) return;

    container.innerHTML = flowChartSteps.map((step, i) => {
        const isCcp = step.includes('(CCP)');
        const isFirst = i === 0;
        const isLast = i === flowChartSteps.length - 1;
        const bgColor = isCcp ? 'var(--danger-color)' : isLast ? 'var(--success-color)' : 'var(--secondary-color)';

        return `
            ${i > 0 ? '<div style="font-size:24px;color:var(--secondary-color);">↓</div>' : ''}
            <div style="background:${bgColor};color:white;padding:15px 30px;border-radius:8px;font-weight:bold;min-width:200px;">
                ${step}
            </div>
        `;
    }).join('');
}

// View detail functions for tables
async function viewCorrectiveAction(index) {
    const actions = await storage.load('correctiveActions') || [];
    const a = actions[index];
    if (!a) return;

    openModal('Działanie korygujące', `
        <div class="detail-grid">
            <div class="detail-item"><label>Data</label><span>${a.date}</span></div>
            <div class="detail-item"><label>CCP</label><span>${a.ccp}</span></div>
            <div class="detail-item"><label>Status</label><span class="status ${a.status === 'Zamknięte' ? 'status-completed' : 'status-pending'}">${a.status}</span></div>
            <div class="detail-item"><label>Odpowiedzialny</label><span>${a.responsible}</span></div>
        </div>
        <div style="margin-top:15px;padding:12px;background:var(--light-bg);border-radius:8px;">
            <label style="display:block;font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Problem</label>
            <span>${a.problem}</span>
        </div>
        <div style="margin-top:10px;padding:12px;background:var(--light-bg);border-radius:8px;">
            <label style="display:block;font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Podjęte działanie</label>
            <span>${a.actionTaken}</span>
        </div>
    `, `<button class="btn btn-secondary" onclick="closeModal()">Zamknij</button>`);
}

async function viewTraining(index) {
    const trainings = await storage.load('trainings') || [];
    const t = trainings[index];
    if (!t) return;

    openModal('Szczegóły szkolenia', `
        <div class="detail-grid">
            <div class="detail-item"><label>Temat</label><span>${t.topic}</span></div>
            <div class="detail-item"><label>Data</label><span>${t.date}</span></div>
            <div class="detail-item"><label>Prowadzący</label><span>${t.trainer}</span></div>
            <div class="detail-item"><label>Uczestnicy</label><span>${t.participants}</span></div>
            <div class="detail-item"><label>Status</label><span class="status ${t.status === 'Zrealizowane' ? 'status-completed' : 'status-pending'}">${t.status}</span></div>
        </div>
        ${t.notes ? `<div style="margin-top:15px;padding:12px;background:var(--light-bg);border-radius:8px;"><label style="display:block;font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Uwagi</label><span>${t.notes}</span></div>` : ''}
    `, `<button class="btn btn-secondary" onclick="closeModal()">Zamknij</button>`);
}

async function viewAudit(index) {
    const audits = await storage.load('audits') || [];
    const a = audits[index];
    if (!a) return;

    openModal('Szczegóły audytu', `
        <div class="detail-grid">
            <div class="detail-item"><label>Typ</label><span>${a.type}</span></div>
            <div class="detail-item"><label>Data</label><span>${a.date}</span></div>
            <div class="detail-item"><label>Audytor</label><span>${a.auditor}</span></div>
            <div class="detail-item"><label>Obszar</label><span>${a.area}</span></div>
            <div class="detail-item"><label>Wynik</label><span class="status ${a.result === 'Pozytywny' ? 'status-completed' : 'status-pending'}">${a.result}</span></div>
            <div class="detail-item"><label>Niezgodności</label><span>${a.findings}</span></div>
        </div>
        ${a.notes ? `<div style="margin-top:15px;padding:12px;background:var(--light-bg);border-radius:8px;"><label style="display:block;font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Uwagi</label><span>${a.notes}</span></div>` : ''}
    `, `<button class="btn btn-secondary" onclick="closeModal()">Zamknij</button>`);
}

async function viewTest(index) {
    const tests = await storage.load('tests') || [];
    const t = tests[index];
    if (!t) return;

    openModal('Szczegóły badania', `
        <div class="detail-grid">
            <div class="detail-item"><label>Typ</label><span>${t.type}</span></div>
            <div class="detail-item"><label>Materiał</label><span>${t.material}</span></div>
            <div class="detail-item"><label>Częstotliwość</label><span>${t.frequency}</span></div>
            <div class="detail-item"><label>Laboratorium</label><span>${t.lab}</span></div>
            <div class="detail-item"><label>Ostatnie</label><span>${t.lastTest}</span></div>
            <div class="detail-item"><label>Następne</label><span>${t.nextTest}</span></div>
            <div class="detail-item"><label>Status</label><span class="status ${t.status === 'Aktualne' ? 'status-completed' : 'status-pending'}">${t.status}</span></div>
        </div>
    `, `<button class="btn btn-secondary" onclick="closeModal()">Zamknij</button>`);
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

// ==================== MODAL SYSTEM ====================

function openModal(title, bodyContent, footerContent) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyContent;
    document.getElementById('modal-footer').innerHTML = footerContent;
    document.getElementById('modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

function closeModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

// ==================== DELIVERIES CRUD ====================

async function addDelivery() {
    const today = new Date().toISOString().split('T')[0];

    const bodyContent = `
        <div class="form-row">
            <div class="form-group">
                <label>Data dostawy *</label>
                <input type="date" id="delivery-date" class="form-control" value="${today}" required>
            </div>
            <div class="form-group">
                <label>Dostawca *</label>
                <input type="text" id="delivery-supplier" class="form-control" placeholder="Nazwa dostawcy" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Produkt *</label>
                <input type="text" id="delivery-product" class="form-control" placeholder="Nazwa produktu" required>
            </div>
            <div class="form-group">
                <label>Ilość *</label>
                <input type="text" id="delivery-quantity" class="form-control" placeholder="np. 10 kg, 5 szt." required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Temperatura przy odbiorze</label>
                <input type="text" id="delivery-temperature" class="form-control" placeholder="np. 4°C">
            </div>
            <div class="form-group">
                <label>Termin ważności</label>
                <input type="date" id="delivery-expiry" class="form-control">
            </div>
        </div>
        <div class="form-group">
            <label>Ocena jakości</label>
            <select id="delivery-quality" class="form-control">
                <option value="Przyjęto">Przyjęto - zgodne</option>
                <option value="Przyjęto warunkowo">Przyjęto warunkowo</option>
                <option value="Odrzucono">Odrzucono</option>
            </select>
        </div>
        <div class="form-group">
            <label>Uwagi</label>
            <textarea id="delivery-notes" class="form-control" rows="2" placeholder="Dodatkowe uwagi..."></textarea>
        </div>
    `;

    const footerContent = `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveDelivery()"><i class="fas fa-save"></i> Zapisz</button>
    `;

    openModal('Nowa dostawa surowca', bodyContent, footerContent);
}

async function saveDelivery(editIndex = null) {
    const date = document.getElementById('delivery-date').value;
    const supplier = document.getElementById('delivery-supplier').value;
    const product = document.getElementById('delivery-product').value;
    const quantity = document.getElementById('delivery-quantity').value;

    if (!date || !supplier || !product || !quantity) {
        showNotification('Wypełnij wymagane pola (*)', 'warning');
        return;
    }

    const delivery = {
        date, supplier, product, quantity,
        temperature: document.getElementById('delivery-temperature').value || '-',
        expiryDate: document.getElementById('delivery-expiry').value || '-',
        quality: document.getElementById('delivery-quality').value,
        notes: document.getElementById('delivery-notes').value || '',
        timestamp: new Date().toISOString()
    };

    const deliveries = await storage.load('deliveries') || [];

    if (editIndex !== null) {
        deliveries[editIndex] = { ...deliveries[editIndex], ...delivery };
        showNotification('Dostawa zaktualizowana', 'success');
    } else {
        deliveries.push(delivery);
        showNotification('Dostawa dodana', 'success');
    }

    await storage.save('deliveries', deliveries);
    closeModal();
    loadDeliveries();
}

async function viewDelivery(index) {
    const deliveries = await storage.load('deliveries') || [];
    const d = deliveries[index];
    if (!d) { showNotification('Nie znaleziono dostawy', 'error'); return; }

    const bodyContent = `
        <div class="detail-grid">
            <div class="detail-item"><label>Data</label><span>${d.date || '-'}</span></div>
            <div class="detail-item"><label>Dostawca</label><span>${d.supplier || '-'}</span></div>
            <div class="detail-item"><label>Produkt</label><span>${d.product || '-'}</span></div>
            <div class="detail-item"><label>Ilość</label><span>${d.quantity || '-'}</span></div>
            <div class="detail-item"><label>Temperatura</label><span>${d.temperature || '-'}</span></div>
            <div class="detail-item"><label>Termin ważności</label><span>${d.expiryDate || '-'}</span></div>
            <div class="detail-item"><label>Ocena</label><span class="status ${d.quality === 'Przyjęto' ? 'status-completed' : d.quality === 'Odrzucono' ? 'status-overdue' : 'status-pending'}">${d.quality}</span></div>
            <div class="detail-item"><label>Wpis</label><span>${d.timestamp ? new Date(d.timestamp).toLocaleString('pl-PL') : '-'}</span></div>
        </div>
        ${d.notes ? `<div style="margin-top:15px;padding:12px;background:var(--light-bg);border-radius:8px;"><label style="display:block;font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;">Uwagi</label><span>${d.notes}</span></div>` : ''}
    `;

    const footerContent = `
        <button class="btn btn-danger" onclick="deleteDelivery(${index})"><i class="fas fa-trash"></i> Usuń</button>
        <button class="btn" onclick="editDelivery(${index})"><i class="fas fa-edit"></i> Edytuj</button>
        <button class="btn btn-secondary" onclick="closeModal()">Zamknij</button>
    `;

    openModal('Dostawa #' + (index + 1), bodyContent, footerContent);
}

async function editDelivery(index) {
    const deliveries = await storage.load('deliveries') || [];
    const d = deliveries[index];
    if (!d) { showNotification('Nie znaleziono dostawy', 'error'); return; }

    const bodyContent = `
        <div class="form-row">
            <div class="form-group"><label>Data dostawy *</label><input type="date" id="delivery-date" class="form-control" value="${d.date || ''}" required></div>
            <div class="form-group"><label>Dostawca *</label><input type="text" id="delivery-supplier" class="form-control" value="${d.supplier || ''}" required></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Produkt *</label><input type="text" id="delivery-product" class="form-control" value="${d.product || ''}" required></div>
            <div class="form-group"><label>Ilość *</label><input type="text" id="delivery-quantity" class="form-control" value="${d.quantity || ''}" required></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Temperatura</label><input type="text" id="delivery-temperature" class="form-control" value="${d.temperature || ''}"></div>
            <div class="form-group"><label>Termin ważności</label><input type="date" id="delivery-expiry" class="form-control" value="${d.expiryDate || ''}"></div>
        </div>
        <div class="form-group"><label>Ocena jakości</label>
            <select id="delivery-quality" class="form-control">
                <option value="Przyjęto" ${d.quality === 'Przyjęto' ? 'selected' : ''}>Przyjęto - zgodne</option>
                <option value="Przyjęto warunkowo" ${d.quality === 'Przyjęto warunkowo' ? 'selected' : ''}>Przyjęto warunkowo</option>
                <option value="Odrzucono" ${d.quality === 'Odrzucono' ? 'selected' : ''}>Odrzucono</option>
            </select>
        </div>
        <div class="form-group"><label>Uwagi</label><textarea id="delivery-notes" class="form-control" rows="2">${d.notes || ''}</textarea></div>
    `;

    const footerContent = `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveDelivery(${index})"><i class="fas fa-save"></i> Zapisz</button>
    `;

    openModal('Edytuj dostawę #' + (index + 1), bodyContent, footerContent);
}

async function deleteDelivery(index) {
    if (!confirm('Usunąć tę dostawę?')) return;
    const deliveries = await storage.load('deliveries') || [];
    deliveries.splice(index, 1);
    await storage.save('deliveries', deliveries);
    closeModal();
    showNotification('Dostawa usunięta', 'success');
    loadDeliveries();
}

// ==================== PROCEDURES CRUD ====================

let proceduresData = [
    { id: 1, name: 'Higiena personelu', status: 'Ukończone', date: '2025-01-15', description: '' },
    { id: 2, name: 'Mycie i dezynfekcja', status: 'W trakcie', date: '2025-01-10', description: '' },
    { id: 3, name: 'Kontrola szkodników', status: 'Opóźnione', date: '2024-12-20', description: '' },
    { id: 4, name: 'Jakość wody', status: 'Ukończone', date: '2025-01-12', description: '' },
    { id: 5, name: 'Gospodarowanie odpadami', status: 'W trakcie', date: '2025-01-08', description: '' }
];

async function loadProceduresData() {
    const saved = await storage.load('procedures');
    if (saved && saved.length > 0) proceduresData = saved;
}

function addProcedure() {
    const bodyContent = `
        <div class="form-group"><label>Nazwa procedury *</label><input type="text" id="procedure-name" class="form-control" placeholder="np. Kontrola temperatury" required></div>
        <div class="form-row">
            <div class="form-group"><label>Status</label>
                <select id="procedure-status" class="form-control">
                    <option value="W trakcie">W trakcie</option>
                    <option value="Ukończone">Ukończone</option>
                    <option value="Opóźnione">Opóźnione</option>
                </select>
            </div>
            <div class="form-group"><label>Data aktualizacji</label><input type="date" id="procedure-date" class="form-control" value="${new Date().toISOString().split('T')[0]}"></div>
        </div>
        <div class="form-group"><label>Opis procedury</label><textarea id="procedure-description" class="form-control" rows="4" placeholder="Szczegółowy opis..."></textarea></div>
    `;
    openModal('Nowa procedura GHP/GMP', bodyContent, `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveProcedure()"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function saveProcedure(editId = null) {
    const name = document.getElementById('procedure-name').value;
    if (!name) { showNotification('Podaj nazwę procedury', 'warning'); return; }

    const procedure = {
        id: editId || Date.now(),
        name,
        status: document.getElementById('procedure-status').value,
        date: document.getElementById('procedure-date').value,
        description: document.getElementById('procedure-description').value || ''
    };

    await loadProceduresData();
    if (editId) {
        const idx = proceduresData.findIndex(p => p.id === editId);
        if (idx !== -1) proceduresData[idx] = procedure;
        showNotification('Procedura zaktualizowana', 'success');
    } else {
        proceduresData.push(procedure);
        showNotification('Procedura dodana', 'success');
    }

    await storage.save('procedures', proceduresData);
    closeModal();
    if (currentPage === 'ghp-gmp') loadContentPage('ghp-gmp');
}

async function editProcedure(id) {
    await loadProceduresData();
    const p = proceduresData.find(x => x.id === id);
    if (!p) { showNotification('Nie znaleziono procedury', 'error'); return; }

    const bodyContent = `
        <div class="form-group"><label>Nazwa procedury *</label><input type="text" id="procedure-name" class="form-control" value="${p.name || ''}" required></div>
        <div class="form-row">
            <div class="form-group"><label>Status</label>
                <select id="procedure-status" class="form-control">
                    <option value="W trakcie" ${p.status === 'W trakcie' ? 'selected' : ''}>W trakcie</option>
                    <option value="Ukończone" ${p.status === 'Ukończone' ? 'selected' : ''}>Ukończone</option>
                    <option value="Opóźnione" ${p.status === 'Opóźnione' ? 'selected' : ''}>Opóźnione</option>
                </select>
            </div>
            <div class="form-group"><label>Data aktualizacji</label><input type="date" id="procedure-date" class="form-control" value="${p.date || ''}"></div>
        </div>
        <div class="form-group"><label>Opis procedury</label><textarea id="procedure-description" class="form-control" rows="4">${p.description || ''}</textarea></div>
    `;
    openModal('Edytuj procedurę', bodyContent, `
        <button class="btn btn-danger" onclick="deleteProcedure(${id})"><i class="fas fa-trash"></i> Usuń</button>
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveProcedure(${id})"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function deleteProcedure(id) {
    if (!confirm('Usunąć procedurę?')) return;
    await loadProceduresData();
    proceduresData = proceduresData.filter(p => p.id !== id);
    await storage.save('procedures', proceduresData);
    closeModal();
    showNotification('Procedura usunięta', 'success');
    if (currentPage === 'ghp-gmp') loadContentPage('ghp-gmp');
}

// ==================== HAZARDS CRUD ====================

let hazardsData = [
    { id: 1, stage: 'Przyjęcie surowca', hazard: 'Zanieczyszczenie mikrobiologiczne', type: 'Biologiczne', probability: 'Średnie', impact: 'Wysokie', risk: 'Wysokie', ccp: 'TAK', control: '' },
    { id: 2, stage: 'Obróbka termiczna', hazard: 'Niedogotowanie', type: 'Biologiczne', probability: 'Niskie', impact: 'Wysokie', risk: 'Krytyczne', ccp: 'TAK', control: '' },
    { id: 3, stage: 'Przechowywanie', hazard: 'Wzrost temperatury', type: 'Fizyczne', probability: 'Średnie', impact: 'Średnie', risk: 'Średnie', ccp: 'NIE', control: '' }
];

async function loadHazardsData() {
    const saved = await storage.load('hazards');
    if (saved && saved.length > 0) hazardsData = saved;
}

function addHazard() {
    const bodyContent = `
        <div class="form-row">
            <div class="form-group"><label>Etap procesu *</label><input type="text" id="hazard-stage" class="form-control" placeholder="np. Przyjęcie surowca" required></div>
            <div class="form-group"><label>Typ</label>
                <select id="hazard-type" class="form-control">
                    <option value="Biologiczne">Biologiczne</option>
                    <option value="Chemiczne">Chemiczne</option>
                    <option value="Fizyczne">Fizyczne</option>
                </select>
            </div>
        </div>
        <div class="form-group"><label>Opis zagrożenia *</label><input type="text" id="hazard-name" class="form-control" placeholder="np. Zanieczyszczenie mikrobiologiczne" required></div>
        <div class="form-row">
            <div class="form-group"><label>Prawdopodobieństwo</label>
                <select id="hazard-probability" class="form-control"><option>Niskie</option><option>Średnie</option><option>Wysokie</option></select>
            </div>
            <div class="form-group"><label>Skutki</label>
                <select id="hazard-impact" class="form-control"><option>Niskie</option><option>Średnie</option><option>Wysokie</option></select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Ryzyko</label>
                <select id="hazard-risk" class="form-control"><option>Niskie</option><option>Średnie</option><option>Wysokie</option><option>Krytyczne</option></select>
            </div>
            <div class="form-group"><label>CCP?</label>
                <select id="hazard-ccp" class="form-control"><option value="NIE">NIE</option><option value="TAK">TAK</option></select>
            </div>
        </div>
        <div class="form-group"><label>Środki kontroli</label><textarea id="hazard-control" class="form-control" rows="2" placeholder="Opisz środki kontroli..."></textarea></div>
    `;
    openModal('Nowe zagrożenie HACCP', bodyContent, `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveHazard()"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function saveHazard(editId = null) {
    const stage = document.getElementById('hazard-stage').value;
    const name = document.getElementById('hazard-name').value;
    if (!stage || !name) { showNotification('Wypełnij wymagane pola', 'warning'); return; }

    const hazard = {
        id: editId || Date.now(), stage, hazard: name,
        type: document.getElementById('hazard-type').value,
        probability: document.getElementById('hazard-probability').value,
        impact: document.getElementById('hazard-impact').value,
        risk: document.getElementById('hazard-risk').value,
        ccp: document.getElementById('hazard-ccp').value,
        control: document.getElementById('hazard-control').value || ''
    };

    await loadHazardsData();
    if (editId) {
        const idx = hazardsData.findIndex(h => h.id === editId);
        if (idx !== -1) hazardsData[idx] = hazard;
        showNotification('Zagrożenie zaktualizowane', 'success');
    } else {
        hazardsData.push(hazard);
        showNotification('Zagrożenie dodane', 'success');
    }

    await storage.save('hazards', hazardsData);
    closeModal();
    if (currentPage === 'analiza') loadContentPage('analiza');
}

async function editHazard(id) {
    await loadHazardsData();
    const h = hazardsData.find(x => x.id === id);
    if (!h) { showNotification('Nie znaleziono zagrożenia', 'error'); return; }

    const bodyContent = `
        <div class="form-row">
            <div class="form-group"><label>Etap procesu *</label><input type="text" id="hazard-stage" class="form-control" value="${h.stage || ''}" required></div>
            <div class="form-group"><label>Typ</label>
                <select id="hazard-type" class="form-control">
                    <option value="Biologiczne" ${h.type === 'Biologiczne' ? 'selected' : ''}>Biologiczne</option>
                    <option value="Chemiczne" ${h.type === 'Chemiczne' ? 'selected' : ''}>Chemiczne</option>
                    <option value="Fizyczne" ${h.type === 'Fizyczne' ? 'selected' : ''}>Fizyczne</option>
                </select>
            </div>
        </div>
        <div class="form-group"><label>Opis zagrożenia *</label><input type="text" id="hazard-name" class="form-control" value="${h.hazard || ''}" required></div>
        <div class="form-row">
            <div class="form-group"><label>Prawdopodobieństwo</label>
                <select id="hazard-probability" class="form-control">
                    <option ${h.probability === 'Niskie' ? 'selected' : ''}>Niskie</option>
                    <option ${h.probability === 'Średnie' ? 'selected' : ''}>Średnie</option>
                    <option ${h.probability === 'Wysokie' ? 'selected' : ''}>Wysokie</option>
                </select>
            </div>
            <div class="form-group"><label>Skutki</label>
                <select id="hazard-impact" class="form-control">
                    <option ${h.impact === 'Niskie' ? 'selected' : ''}>Niskie</option>
                    <option ${h.impact === 'Średnie' ? 'selected' : ''}>Średnie</option>
                    <option ${h.impact === 'Wysokie' ? 'selected' : ''}>Wysokie</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Ryzyko</label>
                <select id="hazard-risk" class="form-control">
                    <option ${h.risk === 'Niskie' ? 'selected' : ''}>Niskie</option>
                    <option ${h.risk === 'Średnie' ? 'selected' : ''}>Średnie</option>
                    <option ${h.risk === 'Wysokie' ? 'selected' : ''}>Wysokie</option>
                    <option ${h.risk === 'Krytyczne' ? 'selected' : ''}>Krytyczne</option>
                </select>
            </div>
            <div class="form-group"><label>CCP?</label>
                <select id="hazard-ccp" class="form-control">
                    <option value="NIE" ${h.ccp === 'NIE' ? 'selected' : ''}>NIE</option>
                    <option value="TAK" ${h.ccp === 'TAK' ? 'selected' : ''}>TAK</option>
                </select>
            </div>
        </div>
        <div class="form-group"><label>Środki kontroli</label><textarea id="hazard-control" class="form-control" rows="2">${h.control || ''}</textarea></div>
    `;
    openModal('Edytuj zagrożenie', bodyContent, `
        <button class="btn btn-danger" onclick="deleteHazard(${id})"><i class="fas fa-trash"></i> Usuń</button>
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveHazard(${id})"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function deleteHazard(id) {
    if (!confirm('Usunąć zagrożenie?')) return;
    await loadHazardsData();
    hazardsData = hazardsData.filter(h => h.id !== id);
    await storage.save('hazards', hazardsData);
    closeModal();
    showNotification('Zagrożenie usunięte', 'success');
    if (currentPage === 'analiza') loadContentPage('analiza');
}

// ==================== CORRECTIVE ACTIONS CRUD ====================

async function addCorrectiveAction() {
    const today = new Date().toISOString().split('T')[0];
    const bodyContent = `
        <div class="form-row">
            <div class="form-group"><label>Data zgłoszenia *</label><input type="date" id="action-date" class="form-control" value="${today}" required></div>
            <div class="form-group"><label>Dotyczy CCP?</label>
                <select id="action-ccp" class="form-control"><option value="NIE">NIE</option><option value="TAK">TAK</option></select>
            </div>
        </div>
        <div class="form-group"><label>Opis problemu *</label><textarea id="action-problem" class="form-control" rows="2" placeholder="Opisz problem..." required></textarea></div>
        <div class="form-group"><label>Podjęte działanie *</label><textarea id="action-taken" class="form-control" rows="2" placeholder="Opisz działanie korygujące..." required></textarea></div>
        <div class="form-row">
            <div class="form-group"><label>Osoba odpowiedzialna</label><input type="text" id="action-responsible" class="form-control" placeholder="Imię i nazwisko"></div>
            <div class="form-group"><label>Status</label>
                <select id="action-status" class="form-control"><option value="Otwarte">Otwarte</option><option value="W realizacji">W realizacji</option><option value="Zamknięte">Zamknięte</option></select>
            </div>
        </div>
        <div class="form-group"><label>Data zamknięcia</label><input type="date" id="action-close-date" class="form-control"></div>
    `;
    openModal('Nowe działanie korygujące', bodyContent, `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveCorrectiveAction()"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function saveCorrectiveAction(editIndex = null) {
    const date = document.getElementById('action-date').value;
    const problem = document.getElementById('action-problem').value;
    const taken = document.getElementById('action-taken').value;
    if (!date || !problem || !taken) { showNotification('Wypełnij wymagane pola', 'warning'); return; }

    const action = {
        date, problem, ccp: document.getElementById('action-ccp').value, actionTaken: taken,
        responsible: document.getElementById('action-responsible').value || '-',
        status: document.getElementById('action-status').value,
        closeDate: document.getElementById('action-close-date').value || '-',
        timestamp: new Date().toISOString()
    };

    const actions = await storage.load('correctiveActions') || [];
    if (editIndex !== null) { actions[editIndex] = { ...actions[editIndex], ...action }; showNotification('Zaktualizowano', 'success'); }
    else { actions.push(action); showNotification('Dodano', 'success'); }

    await storage.save('correctiveActions', actions);
    closeModal();
    if (currentPage === 'korekty') loadContentPage('korekty');
}

// ==================== TRAININGS CRUD ====================

async function addTraining() {
    const bodyContent = `
        <div class="form-group"><label>Temat szkolenia *</label><input type="text" id="training-topic" class="form-control" placeholder="np. Higiena rąk" required></div>
        <div class="form-row">
            <div class="form-group"><label>Data *</label><input type="date" id="training-date" class="form-control" required></div>
            <div class="form-group"><label>Prowadzący</label><input type="text" id="training-trainer" class="form-control" placeholder="Imię i nazwisko"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Liczba uczestników</label><input type="number" id="training-participants" class="form-control" min="0" value="0"></div>
            <div class="form-group"><label>Status</label>
                <select id="training-status" class="form-control"><option value="Planowane">Planowane</option><option value="Zrealizowane">Zrealizowane</option><option value="Anulowane">Anulowane</option></select>
            </div>
        </div>
        <div class="form-group"><label>Uwagi</label><textarea id="training-notes" class="form-control" rows="2"></textarea></div>
    `;
    openModal('Nowe szkolenie', bodyContent, `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveTraining()"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function saveTraining(editIndex = null) {
    const topic = document.getElementById('training-topic').value;
    const date = document.getElementById('training-date').value;
    if (!topic || !date) { showNotification('Wypełnij wymagane pola', 'warning'); return; }

    const training = {
        topic, date, trainer: document.getElementById('training-trainer').value || '-',
        participants: document.getElementById('training-participants').value || '0',
        status: document.getElementById('training-status').value,
        notes: document.getElementById('training-notes').value || '', timestamp: new Date().toISOString()
    };

    const trainings = await storage.load('trainings') || [];
    if (editIndex !== null) { trainings[editIndex] = { ...trainings[editIndex], ...training }; showNotification('Zaktualizowano', 'success'); }
    else { trainings.push(training); showNotification('Dodano', 'success'); }

    await storage.save('trainings', trainings);
    closeModal();
    if (currentPage === 'szkolenia') loadContentPage('szkolenia');
}

// ==================== AUDITS CRUD ====================

async function addAudit() {
    const bodyContent = `
        <div class="form-row">
            <div class="form-group"><label>Typ audytu *</label>
                <select id="audit-type" class="form-control"><option value="Wewnętrzny">Wewnętrzny</option><option value="Zewnętrzny">Zewnętrzny</option><option value="Certyfikacyjny">Certyfikacyjny</option></select>
            </div>
            <div class="form-group"><label>Data *</label><input type="date" id="audit-date" class="form-control" required></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Audytor</label><input type="text" id="audit-auditor" class="form-control" placeholder="Imię i nazwisko"></div>
            <div class="form-group"><label>Obszar</label><input type="text" id="audit-area" class="form-control" placeholder="np. Produkcja"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Wynik</label>
                <select id="audit-result" class="form-control"><option value="Planowany">Planowany</option><option value="Pozytywny">Pozytywny</option><option value="Warunkowo pozytywny">Warunkowo pozytywny</option><option value="Negatywny">Negatywny</option></select>
            </div>
            <div class="form-group"><label>Niezgodności</label><input type="number" id="audit-findings" class="form-control" min="0" value="0"></div>
        </div>
        <div class="form-group"><label>Uwagi</label><textarea id="audit-notes" class="form-control" rows="2"></textarea></div>
    `;
    openModal('Nowy audyt', bodyContent, `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveAudit()"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function saveAudit(editIndex = null) {
    const type = document.getElementById('audit-type').value;
    const date = document.getElementById('audit-date').value;
    if (!type || !date) { showNotification('Wypełnij wymagane pola', 'warning'); return; }

    const audit = {
        type, date, auditor: document.getElementById('audit-auditor').value || '-',
        area: document.getElementById('audit-area').value || '-', result: document.getElementById('audit-result').value,
        findings: document.getElementById('audit-findings').value || '0',
        notes: document.getElementById('audit-notes').value || '', timestamp: new Date().toISOString()
    };

    const audits = await storage.load('audits') || [];
    if (editIndex !== null) { audits[editIndex] = { ...audits[editIndex], ...audit }; showNotification('Zaktualizowano', 'success'); }
    else { audits.push(audit); showNotification('Dodano', 'success'); }

    await storage.save('audits', audits);
    closeModal();
    if (currentPage === 'audyty') loadContentPage('audyty');
}

// ==================== TESTS CRUD ====================

async function addTest() {
    const bodyContent = `
        <div class="form-row">
            <div class="form-group"><label>Typ badania *</label>
                <select id="test-type" class="form-control"><option value="Mikrobiologiczne">Mikrobiologiczne</option><option value="Fizykochemiczne">Fizykochemiczne</option><option value="Wody">Badanie wody</option><option value="Powierzchni">Czystość powierzchni</option></select>
            </div>
            <div class="form-group"><label>Materiał *</label><input type="text" id="test-material" class="form-control" placeholder="np. Produkt gotowy" required></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Częstotliwość</label>
                <select id="test-frequency" class="form-control"><option>Codziennie</option><option>Tygodniowo</option><option>Miesięcznie</option><option>Kwartalnie</option><option>Rocznie</option></select>
            </div>
            <div class="form-group"><label>Laboratorium</label><input type="text" id="test-lab" class="form-control" placeholder="Nazwa laboratorium"></div>
        </div>
        <div class="form-row">
            <div class="form-group"><label>Ostatnie badanie</label><input type="date" id="test-last" class="form-control"></div>
            <div class="form-group"><label>Następne badanie</label><input type="date" id="test-next" class="form-control"></div>
        </div>
        <div class="form-group"><label>Status</label>
            <select id="test-status" class="form-control"><option value="Aktualne">Aktualne</option><option value="Do wykonania">Do wykonania</option><option value="Przeterminowane">Przeterminowane</option></select>
        </div>
    `;
    openModal('Nowe badanie', bodyContent, `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveTest()"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

async function saveTest(editIndex = null) {
    const type = document.getElementById('test-type').value;
    const material = document.getElementById('test-material').value;
    if (!type || !material) { showNotification('Wypełnij wymagane pola', 'warning'); return; }

    const test = {
        type, material, frequency: document.getElementById('test-frequency').value,
        lab: document.getElementById('test-lab').value || '-',
        lastTest: document.getElementById('test-last').value || '-',
        nextTest: document.getElementById('test-next').value || '-',
        status: document.getElementById('test-status').value, timestamp: new Date().toISOString()
    };

    const tests = await storage.load('tests') || [];
    if (editIndex !== null) { tests[editIndex] = { ...tests[editIndex], ...test }; showNotification('Zaktualizowano', 'success'); }
    else { tests.push(test); showNotification('Dodano', 'success'); }

    await storage.save('tests', tests);
    closeModal();
    if (currentPage === 'badania') loadContentPage('badania');
}

// ==================== FLOW CHART EDITOR ====================

let flowChartSteps = ['PRZYJĘCIE SUROWCA', 'PRZECHOWYWANIE', 'PRZYGOTOWANIE', 'OBRÓBKA TERMICZNA (CCP)', 'CHŁODZENIE', 'PAKOWANIE', 'WYDANIE PRODUKTU'];

async function loadFlowChartData() {
    const saved = await storage.load('flowChart');
    if (saved && saved.length > 0) flowChartSteps = saved;
}

async function editFlowChart() {
    await loadFlowChartData();
    const stepsHtml = flowChartSteps.map((step, i) => `
        <div class="form-group" style="display:flex;gap:10px;align-items:center;">
            <span style="min-width:30px;font-weight:bold;">${i + 1}.</span>
            <input type="text" class="form-control flow-step" value="${step}" data-index="${i}">
            <button class="btn btn-small btn-danger" onclick="removeFlowStep(${i})" title="Usuń"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    const bodyContent = `
        <p style="margin-bottom:15px;color:#666;">Edytuj etapy. Dodaj "(CCP)" do nazw krytycznych punktów kontroli.</p>
        <div id="flow-steps-container">${stepsHtml}</div>
        <button class="btn btn-small" onclick="addFlowStep()" style="margin-top:10px;"><i class="fas fa-plus"></i> Dodaj etap</button>
    `;
    openModal('Edytor schematu', bodyContent, `
        <button class="btn btn-secondary" onclick="closeModal()">Anuluj</button>
        <button class="btn btn-success" onclick="saveFlowChart()"><i class="fas fa-save"></i> Zapisz</button>
    `);
}

function addFlowStep() {
    const container = document.getElementById('flow-steps-container');
    const idx = container.children.length;
    container.insertAdjacentHTML('beforeend', `
        <div class="form-group" style="display:flex;gap:10px;align-items:center;">
            <span style="min-width:30px;font-weight:bold;">${idx + 1}.</span>
            <input type="text" class="form-control flow-step" value="" data-index="${idx}" placeholder="Nazwa etapu">
            <button class="btn btn-small btn-danger" onclick="removeFlowStep(${idx})" title="Usuń"><i class="fas fa-times"></i></button>
        </div>
    `);
}

function removeFlowStep(index) {
    const container = document.getElementById('flow-steps-container');
    const steps = container.querySelectorAll('.form-group');
    if (steps.length <= 1) { showNotification('Min. 1 etap', 'warning'); return; }
    steps[index].remove();
    container.querySelectorAll('.form-group').forEach((s, i) => {
        s.querySelector('span').textContent = (i + 1) + '.';
        s.querySelector('input').dataset.index = i;
    });
}

async function saveFlowChart() {
    const inputs = document.querySelectorAll('.flow-step');
    const steps = [];
    inputs.forEach(input => { const v = input.value.trim(); if (v) steps.push(v); });
    if (steps.length === 0) { showNotification('Dodaj min. 1 etap', 'warning'); return; }
    flowChartSteps = steps;
    await storage.save('flowChart', flowChartSteps);
    closeModal();
    showNotification('Schemat zapisany', 'success');
    if (currentPage === 'schemat') loadContentPage('schemat');
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
