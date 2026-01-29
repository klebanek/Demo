/**
 * INOVIT HACCP - Page Templates Module
 * @module templates
 * @description HTML templates for dynamic pages
 */

const PageTemplates = {
    /**
     * Get page content by ID
     * @param {string} pageId - Page ID
     * @returns {string|null} Page HTML
     */
    getPage(pageId) {
        const pages = {
            'wprowadzenie': this.introduction,
            'opis-zakladu': this.facility,
            'ghp-gmp': this.ghpGmp,
            'schemat': this.schema,
            'analiza': this.hazardAnalysis,
            'rejestry': this.registers,
            'korekty': this.correctiveActions,
            'szkolenia': this.trainings,
            'audyty': this.audits,
            'badania': this.tests
        };

        const template = pages[pageId];
        return template ? template() : null;
    },

    /**
     * Common page header template
     * @param {string} title - Page title
     * @param {string} icon - Icon class
     * @returns {string} Header HTML
     */
    pageHeader(title, icon = '') {
        return `
            <div class="page-header">
                <h2 class="page-title">
                    ${icon ? `<i class="${Utils.escapeHtml(icon)}" aria-hidden="true"></i> ` : ''}
                    ${Utils.escapeHtml(title)}
                </h2>
                <button class="back-btn" onclick="Navigation.showPage('dashboard')" aria-label="Powrót do centrum">
                    <i class="fas fa-arrow-left" aria-hidden="true"></i> Centrum
                </button>
            </div>
            ${Navigation.renderBreadcrumb()}
        `;
    },

    /**
     * Introduction page
     */
    introduction() {
        return `
            <div id="wprowadzenie" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Wprowadzenie do dokumentacji HACCP', 'fas fa-book-open')}

                <div class="form-section">
                    <h4><i class="fas fa-info-circle" aria-hidden="true"></i> Podstawy systemu HACCP</h4>
                    <p>System HACCP (Hazard Analysis and Critical Control Points) to systematyczne podejście do identyfikacji, oceny i kontroli zagrożeń bezpieczeństwa żywności.</p>

                    <h4><i class="fas fa-list-ol" aria-hidden="true"></i> Siedem zasad HACCP:</h4>
                    <ol class="principles-list">
                        <li><strong>Analiza zagrożeń</strong> - identyfikacja potencjalnych zagrożeń</li>
                        <li><strong>Krytyczne punkty kontroli (CCP)</strong> - określenie punktów kontroli</li>
                        <li><strong>Limity krytyczne</strong> - ustanowienie granic bezpieczeństwa</li>
                        <li><strong>Monitorowanie</strong> - system nadzoru nad CCP</li>
                        <li><strong>Działania korygujące</strong> - procedury naprawcze</li>
                        <li><strong>Weryfikacja</strong> - potwierdzenie skuteczności systemu</li>
                        <li><strong>Dokumentacja</strong> - prowadzenie zapisów</li>
                    </ol>

                    <h4><i class="fas fa-balance-scale" aria-hidden="true"></i> Podstawy prawne</h4>
                    <ul class="legal-list">
                        <li>Rozporządzenie (WE) nr 852/2004</li>
                        <li>Rozporządzenie (WE) nr 853/2004</li>
                        <li>Ustawa o bezpieczeństwie żywności i żywienia</li>
                    </ul>
                </div>
            </div>
        `;
    },

    /**
     * Facility page
     */
    facility() {
        const facilityTypes = CONFIG.FACILITY_TYPES.map(type =>
            `<option value="${Utils.escapeHtml(type)}">${Utils.escapeHtml(type)}</option>`
        ).join('');

        return `
            <div id="opis-zakladu" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Opis zakładu', 'fas fa-building')}

                <form id="facility-form" novalidate>
                    <div class="form-section">
                        <h4><i class="fas fa-id-card" aria-hidden="true"></i> Dane identyfikacyjne zakładu</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="facility-name">Nazwa zakładu <span class="required">*</span></label>
                                <input type="text" id="facility-name" name="name" class="form-control"
                                    placeholder="Wprowadź nazwę zakładu" required
                                    aria-required="true" autocomplete="organization">
                            </div>
                            <div class="form-group">
                                <label for="facility-nip">NIP</label>
                                <input type="text" id="facility-nip" name="nip" class="form-control"
                                    placeholder="000-000-00-00" pattern="\\d{3}-?\\d{3}-?\\d{2}-?\\d{2}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="facility-address">Adres</label>
                            <input type="text" id="facility-address" name="address" class="form-control"
                                placeholder="Ulica, numer" autocomplete="street-address">
                        </div>
                        <div class="form-group">
                            <label for="facility-city">Kod pocztowy i miejscowość</label>
                            <input type="text" id="facility-city" name="city" class="form-control"
                                placeholder="00-000 Miasto" autocomplete="postal-code">
                        </div>
                    </div>

                    <div class="form-section">
                        <h4><i class="fas fa-industry" aria-hidden="true"></i> Charakterystyka działalności</h4>
                        <div class="form-group">
                            <label for="facility-type">Rodzaj działalności</label>
                            <select id="facility-type" name="type" class="form-control">
                                <option value="">Wybierz rodzaj działalności</option>
                                ${facilityTypes}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="facility-products">Asortyment</label>
                            <textarea id="facility-products" name="products" class="form-control"
                                placeholder="Opisz produkowane/sprzedawane produkty" rows="4"></textarea>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-success" id="save-facility-btn">
                            <i class="fas fa-save" aria-hidden="true"></i> Zapisz dane
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    /**
     * GHP/GMP page
     */
    ghpGmp() {
        return `
            <div id="ghp-gmp" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Program GHP/GMP', 'fas fa-shield-alt')}

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-clipboard-list" aria-hidden="true"></i> Procedury obowiązkowe</h4>
                        <div class="table-controls">
                            <input type="search" id="procedures-search" class="form-control search-input"
                                placeholder="Szukaj procedury..." aria-label="Szukaj procedury">
                            <select id="procedures-filter" class="form-control filter-select" aria-label="Filtruj po statusie">
                                <option value="">Wszystkie statusy</option>
                                ${CONFIG.STATUS.PROCEDURE.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="procedures-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="name" role="columnheader" aria-sort="none">
                                        Procedura <i class="fas fa-sort" aria-hidden="true"></i>
                                    </th>
                                    <th scope="col" data-sort="status" role="columnheader" aria-sort="none">
                                        Status <i class="fas fa-sort" aria-hidden="true"></i>
                                    </th>
                                    <th scope="col" data-sort="date" role="columnheader" aria-sort="none">
                                        Data aktualizacji <i class="fas fa-sort" aria-hidden="true"></i>
                                    </th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="procedures-tbody"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="procedures-pagination"></div>
                </div>

                <button class="btn" onclick="CrudManager.procedures.add()">
                    <i class="fas fa-plus" aria-hidden="true"></i> Dodaj nową procedurę
                </button>
            </div>
        `;
    },

    /**
     * Schema page
     */
    schema() {
        return `
            <div id="schemat" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Schemat technologiczny', 'fas fa-project-diagram')}

                <div class="form-section">
                    <h4><i class="fas fa-stream" aria-hidden="true"></i> Przepływ procesu produkcyjnego</h4>
                    <div class="flowchart-wrapper" role="img" aria-label="Schemat przepływu procesu">
                        <div id="flowchart-container" class="flowchart-container">
                            <!-- Dynamic content -->
                        </div>
                    </div>

                    <div class="flowchart-legend">
                        <div class="legend-item">
                            <span class="legend-color legend-normal"></span>
                            <span>Etap standardowy</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color legend-ccp"></span>
                            <span>Krytyczny punkt kontroli (CCP)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color legend-end"></span>
                            <span>Etap końcowy</span>
                        </div>
                    </div>

                    <button class="btn" onclick="CrudManager.flowChart.edit()">
                        <i class="fas fa-edit" aria-hidden="true"></i> Edytuj schemat
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Hazard analysis page
     */
    hazardAnalysis() {
        return `
            <div id="analiza" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Analiza zagrożeń HACCP', 'fas fa-search-plus')}

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> Matryca analizy zagrożeń</h4>
                        <div class="table-controls">
                            <input type="search" id="hazards-search" class="form-control search-input"
                                placeholder="Szukaj zagrożenia..." aria-label="Szukaj zagrożenia">
                            <select id="hazards-filter-type" class="form-control filter-select" aria-label="Filtruj po typie">
                                <option value="">Wszystkie typy</option>
                                ${CONFIG.HAZARD.TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                            <select id="hazards-filter-ccp" class="form-control filter-select" aria-label="Filtruj po CCP">
                                <option value="">Wszystkie</option>
                                <option value="TAK">Tylko CCP</option>
                                <option value="NIE">Bez CCP</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="hazards-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="stage">Etap</th>
                                    <th scope="col" data-sort="hazard">Zagrożenie</th>
                                    <th scope="col" data-sort="type">Typ</th>
                                    <th scope="col" data-sort="risk">Ryzyko</th>
                                    <th scope="col" data-sort="ccp">CCP</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="hazards-tbody"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="hazards-pagination"></div>
                </div>

                <button class="btn" onclick="CrudManager.hazards.add()">
                    <i class="fas fa-plus" aria-hidden="true"></i> Dodaj zagrożenie
                </button>
            </div>
        `;
    },

    /**
     * Registers page
     */
    registers() {
        return `
            <div id="rejestry" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Rejestry i zapisy', 'fas fa-clipboard-list')}

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-thermometer-half" aria-hidden="true"></i> Rejestr kontroli temperatury</h4>
                        <div class="table-controls">
                            <input type="date" id="temp-filter-date" class="form-control"
                                aria-label="Filtruj po dacie">
                            <input type="search" id="temp-search" class="form-control search-input"
                                placeholder="Szukaj urządzenia..." aria-label="Szukaj urządzenia">
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="temperature-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="date">Data</th>
                                    <th scope="col" data-sort="time">Godzina</th>
                                    <th scope="col" data-sort="device">Urządzenie</th>
                                    <th scope="col" data-sort="temperature">Temperatura (°C)</th>
                                    <th scope="col">Norma</th>
                                    <th scope="col" data-sort="status">Status</th>
                                    <th scope="col">Uwagi</th>
                                    <th scope="col">Podpis</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="temperature-log"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="temperature-pagination"></div>

                    <button class="btn btn-success" onclick="CrudManager.temperature.add()">
                        <i class="fas fa-plus" aria-hidden="true"></i> Dodaj pomiar
                    </button>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-truck" aria-hidden="true"></i> Rejestr dostaw surowca</h4>
                        <div class="table-controls">
                            <input type="date" id="delivery-filter-date" class="form-control"
                                aria-label="Filtruj po dacie">
                            <input type="search" id="delivery-search" class="form-control search-input"
                                placeholder="Szukaj dostawcy/produktu..." aria-label="Szukaj dostawy">
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="deliveries-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="date">Data dostawy</th>
                                    <th scope="col" data-sort="supplier">Dostawca</th>
                                    <th scope="col" data-sort="product">Produkt</th>
                                    <th scope="col">Ilość</th>
                                    <th scope="col">Temperatura</th>
                                    <th scope="col" data-sort="expiryDate">Termin ważności</th>
                                    <th scope="col" data-sort="quality">Ocena jakości</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="deliveries-tbody"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="deliveries-pagination"></div>

                    <button class="btn" onclick="CrudManager.deliveries.add()">
                        <i class="fas fa-plus" aria-hidden="true"></i> Dodaj dostawę
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Corrective actions page
     */
    correctiveActions() {
        return `
            <div id="korekty" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Działania korygujące', 'fas fa-tools')}

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-exclamation-circle" aria-hidden="true"></i> Rejestr działań korygujących</h4>
                        <div class="table-controls">
                            <select id="actions-filter-status" class="form-control filter-select" aria-label="Filtruj po statusie">
                                <option value="">Wszystkie statusy</option>
                                ${CONFIG.STATUS.CORRECTIVE_ACTION.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                            <select id="actions-filter-ccp" class="form-control filter-select" aria-label="Filtruj po CCP">
                                <option value="">Wszystkie</option>
                                <option value="TAK">Tylko CCP</option>
                                <option value="NIE">Bez CCP</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="corrective-actions-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="date">Data zgłoszenia</th>
                                    <th scope="col">Opis problemu</th>
                                    <th scope="col" data-sort="ccp">CCP</th>
                                    <th scope="col">Działanie podjęte</th>
                                    <th scope="col" data-sort="responsible">Odpowiedzialny</th>
                                    <th scope="col" data-sort="status">Status</th>
                                    <th scope="col" data-sort="closeDate">Data zamknięcia</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="corrective-actions-tbody"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="corrective-actions-pagination"></div>
                </div>

                <button class="btn btn-warning" onclick="CrudManager.correctiveActions.add()">
                    <i class="fas fa-exclamation-triangle" aria-hidden="true"></i> Zgłoś problem
                </button>
            </div>
        `;
    },

    /**
     * Trainings page
     */
    trainings() {
        return `
            <div id="szkolenia" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Szkolenia pracowników', 'fas fa-graduation-cap')}

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-calendar-alt" aria-hidden="true"></i> Plan szkoleń</h4>
                        <div class="table-controls">
                            <input type="search" id="trainings-search" class="form-control search-input"
                                placeholder="Szukaj szkolenia..." aria-label="Szukaj szkolenia">
                            <select id="trainings-filter" class="form-control filter-select" aria-label="Filtruj po statusie">
                                <option value="">Wszystkie statusy</option>
                                ${CONFIG.STATUS.TRAINING.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="trainings-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="topic">Temat szkolenia</th>
                                    <th scope="col" data-sort="date">Data planowana</th>
                                    <th scope="col" data-sort="trainer">Prowadzący</th>
                                    <th scope="col" data-sort="participants">Uczestnicy</th>
                                    <th scope="col" data-sort="status">Status</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="trainings-tbody"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="trainings-pagination"></div>
                </div>

                <button class="btn" onclick="CrudManager.trainings.add()">
                    <i class="fas fa-plus" aria-hidden="true"></i> Dodaj szkolenie
                </button>
            </div>
        `;
    },

    /**
     * Audits page
     */
    audits() {
        return `
            <div id="audyty" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Audyty i weryfikacja', 'fas fa-clipboard-check')}

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-search" aria-hidden="true"></i> Harmonogram audytów</h4>
                        <div class="table-controls">
                            <select id="audits-filter-type" class="form-control filter-select" aria-label="Filtruj po typie">
                                <option value="">Wszystkie typy</option>
                                ${CONFIG.AUDIT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                            <select id="audits-filter-result" class="form-control filter-select" aria-label="Filtruj po wyniku">
                                <option value="">Wszystkie wyniki</option>
                                ${CONFIG.STATUS.AUDIT.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="audits-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="type">Typ audytu</th>
                                    <th scope="col" data-sort="date">Data</th>
                                    <th scope="col" data-sort="auditor">Audytor</th>
                                    <th scope="col" data-sort="area">Obszar</th>
                                    <th scope="col" data-sort="result">Wynik</th>
                                    <th scope="col">Uwagi</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="audits-tbody"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="audits-pagination"></div>
                </div>

                <button class="btn" onclick="CrudManager.audits.add()">
                    <i class="fas fa-search" aria-hidden="true"></i> Zaplanuj audyt
                </button>
            </div>
        `;
    },

    /**
     * Tests page
     */
    tests() {
        return `
            <div id="badania" class="content-page fade-in-up">
                ${PageTemplates.pageHeader('Plan i rejestr badań', 'fas fa-flask')}

                <div class="form-section">
                    <div class="section-header">
                        <h4><i class="fas fa-vial" aria-hidden="true"></i> Plan badań</h4>
                        <div class="table-controls">
                            <select id="tests-filter-type" class="form-control filter-select" aria-label="Filtruj po typie">
                                <option value="">Wszystkie typy</option>
                                ${CONFIG.TEST_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                            <select id="tests-filter-status" class="form-control filter-select" aria-label="Filtruj po statusie">
                                <option value="">Wszystkie statusy</option>
                                ${CONFIG.STATUS.TEST.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="data-table sortable" id="tests-table" role="grid">
                            <thead>
                                <tr>
                                    <th scope="col" data-sort="type">Typ badania</th>
                                    <th scope="col" data-sort="material">Materiał</th>
                                    <th scope="col" data-sort="frequency">Częstotliwość</th>
                                    <th scope="col" data-sort="lab">Laboratorium</th>
                                    <th scope="col" data-sort="lastTest">Ostatnie badanie</th>
                                    <th scope="col" data-sort="nextTest">Następne badanie</th>
                                    <th scope="col" data-sort="status">Status</th>
                                    <th scope="col">Akcje</th>
                                </tr>
                            </thead>
                            <tbody id="tests-tbody"></tbody>
                        </table>
                    </div>

                    <div class="pagination-container" id="tests-pagination"></div>
                </div>

                <button class="btn" onclick="CrudManager.tests.add()">
                    <i class="fas fa-vial" aria-hidden="true"></i> Dodaj badanie
                </button>
            </div>
        `;
    }
};

// Export for ES6 modules (future use)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTemplates;
}
