/**
 * INOVIT HACCP - CRUD Manager Module
 * @module crud
 * @description Generic CRUD operations for all data types
 */

const CrudManager = {
    /**
     * Current sort state per table
     */
    sortState: {},

    /**
     * Current filter state per table
     */
    filterState: {},

    /**
     * Current page state per table
     */
    pageState: {},

    /**
     * Data cache
     */
    cache: {},

    // ==================== PROCEDURES ====================

    procedures: {
        storeName: 'procedures',
        defaultData: CONFIG.DEFAULT_PROCEDURES,

        async load() {
            let data = await storage.load(this.storeName);
            if (!data || data.length === 0) {
                data = Utils.deepClone(this.defaultData);
                await storage.save(this.storeName, data);
            }
            CrudManager.cache.procedures = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('procedures-tbody');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'procedures');
            const sorted = CrudManager.applySort(filtered, 'procedures');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'procedures');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="4" class="empty-state">Brak procedur do wyświetlenia</td></tr>'
                : items.map(p => `
                    <tr>
                        <td>${Utils.escapeHtml(p.name)}</td>
                        <td><span class="status ${CrudManager.getStatusClass(p.status, 'procedure')}">${Utils.escapeHtml(p.status)}</span></td>
                        <td>${p.date ? Utils.formatDate(p.date) : '-'}</td>
                        <td>
                            <button class="btn btn-small" onclick="CrudManager.procedures.edit(${p.id})" aria-label="Edytuj procedurę ${Utils.escapeHtml(p.name)}">
                                <i class="fas fa-edit" aria-hidden="true"></i> Edytuj
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('procedures-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('procedures');
        },

        async add() {
            const formHtml = `
                <div class="form-group">
                    <label for="procedure-name">Nazwa procedury <span class="required">*</span></label>
                    <input type="text" id="procedure-name" name="name" class="form-control"
                        placeholder="np. Kontrola temperatury" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="procedure-status">Status</label>
                        <select id="procedure-status" name="status" class="form-control">
                            ${CONFIG.STATUS.PROCEDURE.map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="procedure-date">Data aktualizacji</label>
                        <input type="date" id="procedure-date" name="date" class="form-control" value="${Utils.getCurrentDate()}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="procedure-description">Opis procedury</label>
                    <textarea id="procedure-description" name="description" class="form-control" rows="4"
                        placeholder="Szczegółowy opis..."></textarea>
                </div>
            `;

            const result = await Modal.form('Nowa procedura GHP/GMP', formHtml, {
                validation: (data) => {
                    if (!Validators.required(data.name)) {
                        return { name: ['Nazwa procedury jest wymagana'] };
                    }
                    return true;
                }
            });

            if (result) {
                const data = await this.load();
                const newItem = {
                    id: Date.now(),
                    ...result,
                    timestamp: new Date().toISOString()
                };
                data.push(newItem);
                await storage.save(this.storeName, data);
                Notifications.success('Procedura została dodana');
                this.display();
            }
        },

        async edit(id) {
            const data = await this.load();
            const item = data.find(p => p.id === id);
            if (!item) {
                Notifications.error('Nie znaleziono procedury');
                return;
            }

            const formHtml = `
                <div class="form-group">
                    <label for="procedure-name">Nazwa procedury <span class="required">*</span></label>
                    <input type="text" id="procedure-name" name="name" class="form-control"
                        value="${Utils.escapeHtml(item.name || '')}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="procedure-status">Status</label>
                        <select id="procedure-status" name="status" class="form-control">
                            ${CONFIG.STATUS.PROCEDURE.map(s =>
                                `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="procedure-date">Data aktualizacji</label>
                        <input type="date" id="procedure-date" name="date" class="form-control" value="${item.date || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="procedure-description">Opis procedury</label>
                    <textarea id="procedure-description" name="description" class="form-control" rows="4">${Utils.escapeHtml(item.description || '')}</textarea>
                </div>
            `;

            Modal.open({
                title: 'Edytuj procedurę',
                content: `<form id="modal-form">${formHtml}</form>`,
                footer: `
                    <button type="button" class="btn btn-danger" id="modal-delete">
                        <i class="fas fa-trash" aria-hidden="true"></i> Usuń
                    </button>
                    <button type="button" class="btn btn-secondary" id="modal-cancel">Anuluj</button>
                    <button type="submit" form="modal-form" class="btn btn-success">
                        <i class="fas fa-save" aria-hidden="true"></i> Zapisz
                    </button>
                `,
                onOpen: () => {
                    document.getElementById('modal-cancel').onclick = () => Modal.close();
                    document.getElementById('modal-delete').onclick = () => this.delete(id);
                    document.getElementById('modal-form').onsubmit = async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const updates = Object.fromEntries(formData.entries());

                        if (!Validators.required(updates.name)) {
                            Notifications.warning('Nazwa procedury jest wymagana');
                            return;
                        }

                        const idx = data.findIndex(p => p.id === id);
                        if (idx !== -1) {
                            data[idx] = { ...data[idx], ...updates, lastModified: new Date().toISOString() };
                            await storage.save(this.storeName, data);
                            Modal.close();
                            Notifications.success('Procedura została zaktualizowana');
                            this.display();
                        }
                    };
                }
            });
        },

        async delete(id) {
            const confirmed = await Modal.confirm('Czy na pewno chcesz usunąć tę procedurę?', {
                confirmText: 'Usuń',
                confirmClass: 'btn-danger'
            });

            if (confirmed) {
                let data = await this.load();
                data = data.filter(p => p.id !== id);
                await storage.save(this.storeName, data);
                Modal.close();
                Notifications.success('Procedura została usunięta');
                this.display();
            }
        }
    },

    // ==================== HAZARDS ====================

    hazards: {
        storeName: 'hazards',
        defaultData: CONFIG.DEFAULT_HAZARDS,

        async load() {
            let data = await storage.load(this.storeName);
            if (!data || data.length === 0) {
                data = Utils.deepClone(this.defaultData);
                await storage.save(this.storeName, data);
            }
            CrudManager.cache.hazards = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('hazards-tbody');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'hazards');
            const sorted = CrudManager.applySort(filtered, 'hazards');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'hazards');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="6" class="empty-state">Brak zagrożeń do wyświetlenia</td></tr>'
                : items.map(h => `
                    <tr>
                        <td>${Utils.escapeHtml(h.stage)}</td>
                        <td>${Utils.escapeHtml(h.hazard)}</td>
                        <td>${Utils.escapeHtml(h.type)}</td>
                        <td><span class="status ${CrudManager.getRiskClass(h.risk)}">${Utils.escapeHtml(h.risk)}</span></td>
                        <td><span class="status ${h.ccp === 'TAK' ? 'status-overdue' : 'status-completed'}">${Utils.escapeHtml(h.ccp)}</span></td>
                        <td>
                            <button class="btn btn-small" onclick="CrudManager.hazards.edit(${h.id})" aria-label="Edytuj zagrożenie">
                                <i class="fas fa-edit" aria-hidden="true"></i> Edytuj
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('hazards-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('hazards');
        },

        async add() {
            const formHtml = this.getFormHtml();
            const result = await Modal.form('Nowe zagrożenie HACCP', formHtml, {
                validation: (data) => {
                    const errors = {};
                    if (!Validators.required(data.stage)) errors.stage = ['Etap procesu jest wymagany'];
                    if (!Validators.required(data.hazard)) errors.hazard = ['Opis zagrożenia jest wymagany'];
                    return Object.keys(errors).length > 0 ? errors : true;
                }
            });

            if (result) {
                const data = await this.load();
                data.push({ id: Date.now(), ...result, timestamp: new Date().toISOString() });
                await storage.save(this.storeName, data);
                Notifications.success('Zagrożenie zostało dodane');
                this.display();
            }
        },

        async edit(id) {
            const data = await this.load();
            const item = data.find(h => h.id === id);
            if (!item) {
                Notifications.error('Nie znaleziono zagrożenia');
                return;
            }

            const formHtml = this.getFormHtml(item);

            Modal.open({
                title: 'Edytuj zagrożenie',
                content: `<form id="modal-form">${formHtml}</form>`,
                footer: `
                    <button type="button" class="btn btn-danger" id="modal-delete"><i class="fas fa-trash"></i> Usuń</button>
                    <button type="button" class="btn btn-secondary" id="modal-cancel">Anuluj</button>
                    <button type="submit" form="modal-form" class="btn btn-success"><i class="fas fa-save"></i> Zapisz</button>
                `,
                onOpen: () => {
                    document.getElementById('modal-cancel').onclick = () => Modal.close();
                    document.getElementById('modal-delete').onclick = () => this.delete(id);
                    document.getElementById('modal-form').onsubmit = async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const updates = Object.fromEntries(formData.entries());

                        const idx = data.findIndex(h => h.id === id);
                        if (idx !== -1) {
                            data[idx] = { ...data[idx], ...updates, lastModified: new Date().toISOString() };
                            await storage.save(this.storeName, data);
                            Modal.close();
                            Notifications.success('Zagrożenie zostało zaktualizowane');
                            this.display();
                        }
                    };
                }
            });
        },

        async delete(id) {
            if (await Modal.confirm('Czy na pewno chcesz usunąć to zagrożenie?')) {
                let data = await this.load();
                data = data.filter(h => h.id !== id);
                await storage.save(this.storeName, data);
                Modal.close();
                Notifications.success('Zagrożenie zostało usunięte');
                this.display();
            }
        },

        getFormHtml(item = {}) {
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label for="hazard-stage">Etap procesu <span class="required">*</span></label>
                        <input type="text" id="hazard-stage" name="stage" class="form-control"
                            value="${Utils.escapeHtml(item.stage || '')}" placeholder="np. Przyjęcie surowca" required>
                    </div>
                    <div class="form-group">
                        <label for="hazard-type">Typ</label>
                        <select id="hazard-type" name="type" class="form-control">
                            ${CONFIG.HAZARD.TYPES.map(t => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="hazard-name">Opis zagrożenia <span class="required">*</span></label>
                    <input type="text" id="hazard-name" name="hazard" class="form-control"
                        value="${Utils.escapeHtml(item.hazard || '')}" placeholder="np. Zanieczyszczenie mikrobiologiczne" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="hazard-probability">Prawdopodobieństwo</label>
                        <select id="hazard-probability" name="probability" class="form-control">
                            ${CONFIG.HAZARD.PROBABILITIES.map(p => `<option value="${p}" ${item.probability === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="hazard-impact">Skutki</label>
                        <select id="hazard-impact" name="impact" class="form-control">
                            ${CONFIG.HAZARD.IMPACTS.map(i => `<option value="${i}" ${item.impact === i ? 'selected' : ''}>${i}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="hazard-risk">Ryzyko</label>
                        <select id="hazard-risk" name="risk" class="form-control">
                            ${CONFIG.HAZARD.RISKS.map(r => `<option value="${r}" ${item.risk === r ? 'selected' : ''}>${r}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="hazard-ccp">CCP?</label>
                        <select id="hazard-ccp" name="ccp" class="form-control">
                            ${CONFIG.HAZARD.CCP_OPTIONS.map(c => `<option value="${c}" ${item.ccp === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="hazard-control">Środki kontroli</label>
                    <textarea id="hazard-control" name="control" class="form-control" rows="2"
                        placeholder="Opisz środki kontroli...">${Utils.escapeHtml(item.control || '')}</textarea>
                </div>
            `;
        }
    },

    // ==================== DELIVERIES ====================

    deliveries: {
        storeName: 'deliveries',

        async load() {
            const data = await storage.load(this.storeName) || [];
            CrudManager.cache.deliveries = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('deliveries-tbody');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'deliveries');
            const sorted = CrudManager.applySort(filtered, 'deliveries');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'deliveries');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="8" class="empty-state">Brak dostaw do wyświetlenia</td></tr>'
                : items.map((d, i) => `
                    <tr>
                        <td>${Utils.escapeHtml(d.date || '')}</td>
                        <td>${Utils.escapeHtml(d.supplier || '')}</td>
                        <td>${Utils.escapeHtml(d.product || '')}</td>
                        <td>${Utils.escapeHtml(d.quantity || '')}</td>
                        <td>${Utils.escapeHtml(d.temperature || '-')}</td>
                        <td>${Utils.escapeHtml(d.expiryDate || '-')}</td>
                        <td><span class="status ${CrudManager.getQualityClass(d.quality)}">${Utils.escapeHtml(d.quality || 'Przyjęto')}</span></td>
                        <td>
                            <button class="btn btn-small" onclick="CrudManager.deliveries.view(${i})">
                                <i class="fas fa-eye"></i> Szczegóły
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('deliveries-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('deliveries');
        },

        async add() {
            const formHtml = this.getFormHtml();
            const result = await Modal.form('Nowa dostawa surowca', formHtml, {
                validation: (data) => {
                    const errors = {};
                    if (!Validators.required(data.date)) errors.date = ['Data dostawy jest wymagana'];
                    if (!Validators.required(data.supplier)) errors.supplier = ['Dostawca jest wymagany'];
                    if (!Validators.required(data.product)) errors.product = ['Produkt jest wymagany'];
                    if (!Validators.required(data.quantity)) errors.quantity = ['Ilość jest wymagana'];
                    return Object.keys(errors).length > 0 ? errors : true;
                }
            });

            if (result) {
                const data = await this.load();
                data.push({ ...result, timestamp: new Date().toISOString() });
                await storage.save(this.storeName, data);
                Notifications.success('Dostawa została dodana');
                this.display();
            }
        },

        async view(index) {
            const data = await this.load();
            const d = data[index];
            if (!d) {
                Notifications.error('Nie znaleziono dostawy');
                return;
            }

            Modal.open({
                title: `Dostawa #${index + 1}`,
                content: `
                    <div class="detail-grid">
                        <div class="detail-item"><label>Data</label><span>${Utils.escapeHtml(d.date || '-')}</span></div>
                        <div class="detail-item"><label>Dostawca</label><span>${Utils.escapeHtml(d.supplier || '-')}</span></div>
                        <div class="detail-item"><label>Produkt</label><span>${Utils.escapeHtml(d.product || '-')}</span></div>
                        <div class="detail-item"><label>Ilość</label><span>${Utils.escapeHtml(d.quantity || '-')}</span></div>
                        <div class="detail-item"><label>Temperatura</label><span>${Utils.escapeHtml(d.temperature || '-')}</span></div>
                        <div class="detail-item"><label>Termin ważności</label><span>${Utils.escapeHtml(d.expiryDate || '-')}</span></div>
                        <div class="detail-item"><label>Ocena</label><span class="status ${CrudManager.getQualityClass(d.quality)}">${Utils.escapeHtml(d.quality || 'Przyjęto')}</span></div>
                        <div class="detail-item"><label>Wpis</label><span>${d.timestamp ? Utils.formatDateTime(d.timestamp) : '-'}</span></div>
                    </div>
                    ${d.notes ? `<div class="detail-notes"><label>Uwagi</label><p>${Utils.escapeHtml(d.notes)}</p></div>` : ''}
                `,
                footer: `
                    <button class="btn btn-danger" onclick="CrudManager.deliveries.delete(${index})"><i class="fas fa-trash"></i> Usuń</button>
                    <button class="btn" onclick="CrudManager.deliveries.edit(${index})"><i class="fas fa-edit"></i> Edytuj</button>
                    <button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>
                `
            });
        },

        async edit(index) {
            const data = await this.load();
            const item = data[index];
            if (!item) return;

            const formHtml = this.getFormHtml(item);
            const result = await Modal.form(`Edytuj dostawę #${index + 1}`, formHtml);

            if (result) {
                data[index] = { ...data[index], ...result, lastModified: new Date().toISOString() };
                await storage.save(this.storeName, data);
                Notifications.success('Dostawa została zaktualizowana');
                this.display();
            }
        },

        async delete(index) {
            if (await Modal.confirm('Czy na pewno chcesz usunąć tę dostawę?')) {
                const data = await this.load();
                data.splice(index, 1);
                await storage.save(this.storeName, data);
                Modal.close();
                Notifications.success('Dostawa została usunięta');
                this.display();
            }
        },

        getFormHtml(item = {}) {
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label for="delivery-date">Data dostawy <span class="required">*</span></label>
                        <input type="date" id="delivery-date" name="date" class="form-control"
                            value="${item.date || Utils.getCurrentDate()}" required>
                    </div>
                    <div class="form-group">
                        <label for="delivery-supplier">Dostawca <span class="required">*</span></label>
                        <input type="text" id="delivery-supplier" name="supplier" class="form-control"
                            value="${Utils.escapeHtml(item.supplier || '')}" placeholder="Nazwa dostawcy" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="delivery-product">Produkt <span class="required">*</span></label>
                        <input type="text" id="delivery-product" name="product" class="form-control"
                            value="${Utils.escapeHtml(item.product || '')}" placeholder="Nazwa produktu" required>
                    </div>
                    <div class="form-group">
                        <label for="delivery-quantity">Ilość <span class="required">*</span></label>
                        <input type="text" id="delivery-quantity" name="quantity" class="form-control"
                            value="${Utils.escapeHtml(item.quantity || '')}" placeholder="np. 10 kg, 5 szt." required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="delivery-temperature">Temperatura przy odbiorze</label>
                        <input type="text" id="delivery-temperature" name="temperature" class="form-control"
                            value="${Utils.escapeHtml(item.temperature || '')}" placeholder="np. 4°C">
                    </div>
                    <div class="form-group">
                        <label for="delivery-expiry">Termin ważności</label>
                        <input type="date" id="delivery-expiry" name="expiryDate" class="form-control"
                            value="${item.expiryDate || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="delivery-quality">Ocena jakości</label>
                    <select id="delivery-quality" name="quality" class="form-control">
                        ${CONFIG.STATUS.DELIVERY_QUALITY.map(q =>
                            `<option value="${q}" ${item.quality === q ? 'selected' : ''}>${q}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="delivery-notes">Uwagi</label>
                    <textarea id="delivery-notes" name="notes" class="form-control" rows="2"
                        placeholder="Dodatkowe uwagi...">${Utils.escapeHtml(item.notes || '')}</textarea>
                </div>
            `;
        }
    },

    // ==================== TEMPERATURE ====================

    temperature: {
        storeName: 'temperatureLog',

        async load() {
            const data = await storage.load(this.storeName) || [];
            CrudManager.cache.temperatureLog = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('temperature-log');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'temperature');
            const sorted = CrudManager.applySort(filtered, 'temperature');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'temperature');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="9" class="empty-state">Brak zapisów temperatury</td></tr>'
                : items.map((r, i) => `
                    <tr>
                        <td>${Utils.escapeHtml(r.date || '')}</td>
                        <td>${Utils.escapeHtml(r.time || '')}</td>
                        <td>${Utils.escapeHtml(r.device || '')}</td>
                        <td>${Utils.escapeHtml(r.temperature || '')}</td>
                        <td>${Utils.escapeHtml(r.norm || '')}</td>
                        <td><span class="status ${r.status === 'OK' ? 'status-completed' : 'status-warning'}">${Utils.escapeHtml(r.status || 'OK')}</span></td>
                        <td>${Utils.escapeHtml(r.notes || '-')}</td>
                        <td>${Utils.escapeHtml(r.signature || '')}</td>
                        <td>
                            <button class="btn btn-small btn-danger" onclick="CrudManager.temperature.delete(${i})" aria-label="Usuń pomiar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('temperature-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('temperature');
        },

        async add() {
            const formHtml = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="temp-date">Data <span class="required">*</span></label>
                        <input type="date" id="temp-date" name="date" class="form-control" value="${Utils.getCurrentDate()}" required>
                    </div>
                    <div class="form-group">
                        <label for="temp-time">Godzina <span class="required">*</span></label>
                        <input type="time" id="temp-time" name="time" class="form-control" value="${Utils.getCurrentTime()}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="temp-device">Urządzenie <span class="required">*</span></label>
                        <input type="text" id="temp-device" name="device" class="form-control" placeholder="np. Lodówka 1" required>
                    </div>
                    <div class="form-group">
                        <label for="temp-temperature">Temperatura (°C) <span class="required">*</span></label>
                        <input type="number" id="temp-temperature" name="temperature" class="form-control" step="0.1" placeholder="np. 4.5" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="temp-norm">Norma</label>
                        <input type="text" id="temp-norm" name="norm" class="form-control" placeholder="np. 0-4°C">
                    </div>
                    <div class="form-group">
                        <label for="temp-status">Status</label>
                        <select id="temp-status" name="status" class="form-control">
                            <option value="OK">OK</option>
                            <option value="Przekroczenie">Przekroczenie</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="temp-notes">Uwagi</label>
                    <input type="text" id="temp-notes" name="notes" class="form-control" placeholder="Opcjonalne uwagi">
                </div>
                <div class="form-group">
                    <label for="temp-signature">Inicjały</label>
                    <input type="text" id="temp-signature" name="signature" class="form-control" placeholder="np. JK" maxlength="5">
                </div>
            `;

            const result = await Modal.form('Nowy pomiar temperatury', formHtml, {
                validation: (data) => {
                    const errors = {};
                    if (!Validators.required(data.device)) errors.device = ['Urządzenie jest wymagane'];
                    if (!Validators.required(data.temperature)) errors.temperature = ['Temperatura jest wymagana'];
                    if (!Validators.temperature(data.temperature)) errors.temperature = ['Nieprawidłowa wartość temperatury'];
                    return Object.keys(errors).length > 0 ? errors : true;
                }
            });

            if (result) {
                const data = await this.load();
                data.push({ ...result, timestamp: new Date().toISOString() });
                await storage.save(this.storeName, data);
                Notifications.success('Pomiar został dodany');
                this.display();
            }
        },

        async delete(index) {
            if (await Modal.confirm('Czy na pewno chcesz usunąć ten pomiar?')) {
                const data = await this.load();
                data.splice(index, 1);
                await storage.save(this.storeName, data);
                Notifications.success('Pomiar został usunięty');
                this.display();
            }
        }
    },

    // ==================== CORRECTIVE ACTIONS ====================

    correctiveActions: {
        storeName: 'correctiveActions',

        async load() {
            const data = await storage.load(this.storeName) || [];
            CrudManager.cache.correctiveActions = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('corrective-actions-tbody');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'correctiveActions');
            const sorted = CrudManager.applySort(filtered, 'correctiveActions');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'correctiveActions');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="8" class="empty-state">Brak działań korygujących</td></tr>'
                : items.map((a, i) => `
                    <tr>
                        <td>${Utils.escapeHtml(a.date)}</td>
                        <td class="truncate" title="${Utils.escapeHtml(a.problem)}">${Utils.escapeHtml(a.problem)}</td>
                        <td>${Utils.escapeHtml(a.ccp)}</td>
                        <td class="truncate" title="${Utils.escapeHtml(a.actionTaken)}">${Utils.escapeHtml(a.actionTaken)}</td>
                        <td>${Utils.escapeHtml(a.responsible)}</td>
                        <td><span class="status ${CrudManager.getActionStatusClass(a.status)}">${Utils.escapeHtml(a.status)}</span></td>
                        <td>${Utils.escapeHtml(a.closeDate || '-')}</td>
                        <td>
                            <button class="btn btn-small" onclick="CrudManager.correctiveActions.view(${i})">
                                <i class="fas fa-eye"></i> Szczegóły
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('corrective-actions-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('correctiveActions');
        },

        async add() {
            const formHtml = this.getFormHtml();
            const result = await Modal.form('Nowe działanie korygujące', formHtml, {
                validation: (data) => {
                    const errors = {};
                    if (!Validators.required(data.problem)) errors.problem = ['Opis problemu jest wymagany'];
                    if (!Validators.required(data.actionTaken)) errors.actionTaken = ['Działanie jest wymagane'];
                    return Object.keys(errors).length > 0 ? errors : true;
                }
            });

            if (result) {
                const data = await this.load();
                data.push({ ...result, timestamp: new Date().toISOString() });
                await storage.save(this.storeName, data);
                Notifications.success('Działanie korygujące zostało dodane');
                this.display();
            }
        },

        async view(index) {
            const data = await this.load();
            const a = data[index];
            if (!a) return;

            Modal.open({
                title: 'Działanie korygujące',
                content: `
                    <div class="detail-grid">
                        <div class="detail-item"><label>Data</label><span>${Utils.escapeHtml(a.date)}</span></div>
                        <div class="detail-item"><label>CCP</label><span>${Utils.escapeHtml(a.ccp)}</span></div>
                        <div class="detail-item"><label>Status</label><span class="status ${CrudManager.getActionStatusClass(a.status)}">${Utils.escapeHtml(a.status)}</span></div>
                        <div class="detail-item"><label>Odpowiedzialny</label><span>${Utils.escapeHtml(a.responsible)}</span></div>
                    </div>
                    <div class="detail-notes"><label>Problem</label><p>${Utils.escapeHtml(a.problem)}</p></div>
                    <div class="detail-notes"><label>Podjęte działanie</label><p>${Utils.escapeHtml(a.actionTaken)}</p></div>
                `,
                footer: `<button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>`
            });
        },

        getFormHtml(item = {}) {
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label for="action-date">Data zgłoszenia <span class="required">*</span></label>
                        <input type="date" id="action-date" name="date" class="form-control" value="${item.date || Utils.getCurrentDate()}" required>
                    </div>
                    <div class="form-group">
                        <label for="action-ccp">Dotyczy CCP?</label>
                        <select id="action-ccp" name="ccp" class="form-control">
                            ${CONFIG.HAZARD.CCP_OPTIONS.map(c => `<option value="${c}" ${item.ccp === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="action-problem">Opis problemu <span class="required">*</span></label>
                    <textarea id="action-problem" name="problem" class="form-control" rows="2" required>${Utils.escapeHtml(item.problem || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="action-taken">Podjęte działanie <span class="required">*</span></label>
                    <textarea id="action-taken" name="actionTaken" class="form-control" rows="2" required>${Utils.escapeHtml(item.actionTaken || '')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="action-responsible">Osoba odpowiedzialna</label>
                        <input type="text" id="action-responsible" name="responsible" class="form-control" value="${Utils.escapeHtml(item.responsible || '')}">
                    </div>
                    <div class="form-group">
                        <label for="action-status">Status</label>
                        <select id="action-status" name="status" class="form-control">
                            ${CONFIG.STATUS.CORRECTIVE_ACTION.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="action-close-date">Data zamknięcia</label>
                    <input type="date" id="action-close-date" name="closeDate" class="form-control" value="${item.closeDate || ''}">
                </div>
            `;
        }
    },

    // ==================== TRAININGS ====================

    trainings: {
        storeName: 'trainings',

        async load() {
            const data = await storage.load(this.storeName) || [];
            CrudManager.cache.trainings = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('trainings-tbody');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'trainings');
            const sorted = CrudManager.applySort(filtered, 'trainings');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'trainings');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="6" class="empty-state">Brak szkoleń</td></tr>'
                : items.map((t, i) => `
                    <tr>
                        <td>${Utils.escapeHtml(t.topic)}</td>
                        <td>${Utils.escapeHtml(t.date)}</td>
                        <td>${Utils.escapeHtml(t.trainer || '-')}</td>
                        <td>${Utils.escapeHtml(t.participants || '0')}</td>
                        <td><span class="status ${CrudManager.getTrainingStatusClass(t.status)}">${Utils.escapeHtml(t.status)}</span></td>
                        <td>
                            <button class="btn btn-small" onclick="CrudManager.trainings.view(${i})">
                                <i class="fas fa-eye"></i> Szczegóły
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('trainings-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('trainings');
        },

        async add() {
            const formHtml = this.getFormHtml();
            const result = await Modal.form('Nowe szkolenie', formHtml, {
                validation: (data) => {
                    const errors = {};
                    if (!Validators.required(data.topic)) errors.topic = ['Temat jest wymagany'];
                    if (!Validators.required(data.date)) errors.date = ['Data jest wymagana'];
                    return Object.keys(errors).length > 0 ? errors : true;
                }
            });

            if (result) {
                const data = await this.load();
                data.push({ ...result, timestamp: new Date().toISOString() });
                await storage.save(this.storeName, data);
                Notifications.success('Szkolenie zostało dodane');
                this.display();
            }
        },

        async view(index) {
            const data = await this.load();
            const t = data[index];
            if (!t) return;

            Modal.open({
                title: 'Szczegóły szkolenia',
                content: `
                    <div class="detail-grid">
                        <div class="detail-item"><label>Temat</label><span>${Utils.escapeHtml(t.topic)}</span></div>
                        <div class="detail-item"><label>Data</label><span>${Utils.escapeHtml(t.date)}</span></div>
                        <div class="detail-item"><label>Prowadzący</label><span>${Utils.escapeHtml(t.trainer || '-')}</span></div>
                        <div class="detail-item"><label>Uczestnicy</label><span>${Utils.escapeHtml(t.participants || '0')}</span></div>
                        <div class="detail-item"><label>Status</label><span class="status ${CrudManager.getTrainingStatusClass(t.status)}">${Utils.escapeHtml(t.status)}</span></div>
                    </div>
                    ${t.notes ? `<div class="detail-notes"><label>Uwagi</label><p>${Utils.escapeHtml(t.notes)}</p></div>` : ''}
                `,
                footer: `<button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>`
            });
        },

        getFormHtml(item = {}) {
            return `
                <div class="form-group">
                    <label for="training-topic">Temat szkolenia <span class="required">*</span></label>
                    <input type="text" id="training-topic" name="topic" class="form-control" value="${Utils.escapeHtml(item.topic || '')}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="training-date">Data <span class="required">*</span></label>
                        <input type="date" id="training-date" name="date" class="form-control" value="${item.date || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="training-trainer">Prowadzący</label>
                        <input type="text" id="training-trainer" name="trainer" class="form-control" value="${Utils.escapeHtml(item.trainer || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="training-participants">Liczba uczestników</label>
                        <input type="number" id="training-participants" name="participants" class="form-control" min="0" value="${item.participants || '0'}">
                    </div>
                    <div class="form-group">
                        <label for="training-status">Status</label>
                        <select id="training-status" name="status" class="form-control">
                            ${CONFIG.STATUS.TRAINING.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="training-notes">Uwagi</label>
                    <textarea id="training-notes" name="notes" class="form-control" rows="2">${Utils.escapeHtml(item.notes || '')}</textarea>
                </div>
            `;
        }
    },

    // ==================== AUDITS ====================

    audits: {
        storeName: 'audits',

        async load() {
            const data = await storage.load(this.storeName) || [];
            CrudManager.cache.audits = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('audits-tbody');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'audits');
            const sorted = CrudManager.applySort(filtered, 'audits');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'audits');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="7" class="empty-state">Brak audytów</td></tr>'
                : items.map((a, i) => `
                    <tr>
                        <td>${Utils.escapeHtml(a.type)}</td>
                        <td>${Utils.escapeHtml(a.date)}</td>
                        <td>${Utils.escapeHtml(a.auditor || '-')}</td>
                        <td>${Utils.escapeHtml(a.area || '-')}</td>
                        <td><span class="status ${CrudManager.getAuditResultClass(a.result)}">${Utils.escapeHtml(a.result)}</span></td>
                        <td>${Utils.escapeHtml(a.notes || '-')}</td>
                        <td>
                            <button class="btn btn-small" onclick="CrudManager.audits.view(${i})">
                                <i class="fas fa-eye"></i> Szczegóły
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('audits-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('audits');
        },

        async add() {
            const formHtml = this.getFormHtml();
            const result = await Modal.form('Nowy audyt', formHtml, {
                validation: (data) => {
                    const errors = {};
                    if (!Validators.required(data.date)) errors.date = ['Data jest wymagana'];
                    return Object.keys(errors).length > 0 ? errors : true;
                }
            });

            if (result) {
                const data = await this.load();
                data.push({ ...result, timestamp: new Date().toISOString() });
                await storage.save(this.storeName, data);
                Notifications.success('Audyt został dodany');
                this.display();
            }
        },

        async view(index) {
            const data = await this.load();
            const a = data[index];
            if (!a) return;

            Modal.open({
                title: 'Szczegóły audytu',
                content: `
                    <div class="detail-grid">
                        <div class="detail-item"><label>Typ</label><span>${Utils.escapeHtml(a.type)}</span></div>
                        <div class="detail-item"><label>Data</label><span>${Utils.escapeHtml(a.date)}</span></div>
                        <div class="detail-item"><label>Audytor</label><span>${Utils.escapeHtml(a.auditor || '-')}</span></div>
                        <div class="detail-item"><label>Obszar</label><span>${Utils.escapeHtml(a.area || '-')}</span></div>
                        <div class="detail-item"><label>Wynik</label><span class="status ${CrudManager.getAuditResultClass(a.result)}">${Utils.escapeHtml(a.result)}</span></div>
                        <div class="detail-item"><label>Niezgodności</label><span>${Utils.escapeHtml(a.findings || '0')}</span></div>
                    </div>
                    ${a.notes ? `<div class="detail-notes"><label>Uwagi</label><p>${Utils.escapeHtml(a.notes)}</p></div>` : ''}
                `,
                footer: `<button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>`
            });
        },

        getFormHtml(item = {}) {
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label for="audit-type">Typ audytu <span class="required">*</span></label>
                        <select id="audit-type" name="type" class="form-control">
                            ${CONFIG.AUDIT_TYPES.map(t => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="audit-date">Data <span class="required">*</span></label>
                        <input type="date" id="audit-date" name="date" class="form-control" value="${item.date || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="audit-auditor">Audytor</label>
                        <input type="text" id="audit-auditor" name="auditor" class="form-control" value="${Utils.escapeHtml(item.auditor || '')}">
                    </div>
                    <div class="form-group">
                        <label for="audit-area">Obszar</label>
                        <input type="text" id="audit-area" name="area" class="form-control" value="${Utils.escapeHtml(item.area || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="audit-result">Wynik</label>
                        <select id="audit-result" name="result" class="form-control">
                            ${CONFIG.STATUS.AUDIT.map(s => `<option value="${s}" ${item.result === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="audit-findings">Niezgodności</label>
                        <input type="number" id="audit-findings" name="findings" class="form-control" min="0" value="${item.findings || '0'}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="audit-notes">Uwagi</label>
                    <textarea id="audit-notes" name="notes" class="form-control" rows="2">${Utils.escapeHtml(item.notes || '')}</textarea>
                </div>
            `;
        }
    },

    // ==================== TESTS ====================

    tests: {
        storeName: 'tests',

        async load() {
            const data = await storage.load(this.storeName) || [];
            CrudManager.cache.tests = data;
            return data;
        },

        async display() {
            const data = await this.load();
            const tbody = document.getElementById('tests-tbody');
            if (!tbody) return;

            const filtered = CrudManager.applyFilters(data, 'tests');
            const sorted = CrudManager.applySort(filtered, 'tests');
            const { items, html: paginationHtml } = CrudManager.paginate(sorted, 'tests');

            tbody.innerHTML = items.length === 0
                ? '<tr><td colspan="8" class="empty-state">Brak badań</td></tr>'
                : items.map((t, i) => `
                    <tr>
                        <td>${Utils.escapeHtml(t.type)}</td>
                        <td>${Utils.escapeHtml(t.material)}</td>
                        <td>${Utils.escapeHtml(t.frequency)}</td>
                        <td>${Utils.escapeHtml(t.lab || '-')}</td>
                        <td>${Utils.escapeHtml(t.lastTest || '-')}</td>
                        <td>${Utils.escapeHtml(t.nextTest || '-')}</td>
                        <td><span class="status ${CrudManager.getTestStatusClass(t.status)}">${Utils.escapeHtml(t.status)}</span></td>
                        <td>
                            <button class="btn btn-small" onclick="CrudManager.tests.view(${i})">
                                <i class="fas fa-eye"></i> Szczegóły
                            </button>
                        </td>
                    </tr>
                `).join('');

            const paginationContainer = document.getElementById('tests-pagination');
            if (paginationContainer) paginationContainer.innerHTML = paginationHtml;

            CrudManager.setupTableFeatures('tests');
        },

        async add() {
            const formHtml = this.getFormHtml();
            const result = await Modal.form('Nowe badanie', formHtml, {
                validation: (data) => {
                    const errors = {};
                    if (!Validators.required(data.material)) errors.material = ['Materiał jest wymagany'];
                    return Object.keys(errors).length > 0 ? errors : true;
                }
            });

            if (result) {
                const data = await this.load();
                data.push({ ...result, timestamp: new Date().toISOString() });
                await storage.save(this.storeName, data);
                Notifications.success('Badanie zostało dodane');
                this.display();
            }
        },

        async view(index) {
            const data = await this.load();
            const t = data[index];
            if (!t) return;

            Modal.open({
                title: 'Szczegóły badania',
                content: `
                    <div class="detail-grid">
                        <div class="detail-item"><label>Typ</label><span>${Utils.escapeHtml(t.type)}</span></div>
                        <div class="detail-item"><label>Materiał</label><span>${Utils.escapeHtml(t.material)}</span></div>
                        <div class="detail-item"><label>Częstotliwość</label><span>${Utils.escapeHtml(t.frequency)}</span></div>
                        <div class="detail-item"><label>Laboratorium</label><span>${Utils.escapeHtml(t.lab || '-')}</span></div>
                        <div class="detail-item"><label>Ostatnie</label><span>${Utils.escapeHtml(t.lastTest || '-')}</span></div>
                        <div class="detail-item"><label>Następne</label><span>${Utils.escapeHtml(t.nextTest || '-')}</span></div>
                        <div class="detail-item"><label>Status</label><span class="status ${CrudManager.getTestStatusClass(t.status)}">${Utils.escapeHtml(t.status)}</span></div>
                    </div>
                `,
                footer: `<button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>`
            });
        },

        getFormHtml(item = {}) {
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label for="test-type">Typ badania <span class="required">*</span></label>
                        <select id="test-type" name="type" class="form-control">
                            ${CONFIG.TEST_TYPES.map(t => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="test-material">Materiał <span class="required">*</span></label>
                        <input type="text" id="test-material" name="material" class="form-control" value="${Utils.escapeHtml(item.material || '')}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="test-frequency">Częstotliwość</label>
                        <select id="test-frequency" name="frequency" class="form-control">
                            ${CONFIG.TEST_FREQUENCIES.map(f => `<option value="${f}" ${item.frequency === f ? 'selected' : ''}>${f}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="test-lab">Laboratorium</label>
                        <input type="text" id="test-lab" name="lab" class="form-control" value="${Utils.escapeHtml(item.lab || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="test-last">Ostatnie badanie</label>
                        <input type="date" id="test-last" name="lastTest" class="form-control" value="${item.lastTest || ''}">
                    </div>
                    <div class="form-group">
                        <label for="test-next">Następne badanie</label>
                        <input type="date" id="test-next" name="nextTest" class="form-control" value="${item.nextTest || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="test-status">Status</label>
                    <select id="test-status" name="status" class="form-control">
                        ${CONFIG.STATUS.TEST.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
            `;
        }
    },

    // ==================== FLOWCHART ====================

    flowChart: {
        storeName: 'flowChart',

        async load() {
            let data = await storage.load(this.storeName);
            if (!data || data.length === 0) {
                data = Utils.deepClone(CONFIG.DEFAULT_FLOWCHART);
            }
            CrudManager.cache.flowChart = data;
            return data;
        },

        async display() {
            const steps = await this.load();
            const container = document.getElementById('flowchart-container');
            if (!container) return;

            container.innerHTML = steps.map((step, i) => {
                const isCcp = step.includes('(CCP)');
                const isLast = i === steps.length - 1;
                const bgColor = isCcp ? 'var(--danger-color)' : isLast ? 'var(--success-color)' : 'var(--secondary-color)';

                return `
                    ${i > 0 ? '<div class="flowchart-arrow" aria-hidden="true"><i class="fas fa-arrow-down"></i></div>' : ''}
                    <div class="flowchart-step ${isCcp ? 'ccp' : ''} ${isLast ? 'final' : ''}"
                         style="background-color: ${bgColor}"
                         role="listitem">
                        ${Utils.escapeHtml(step)}
                    </div>
                `;
            }).join('');
        },

        async edit() {
            const steps = await this.load();

            const stepsHtml = steps.map((step, i) => `
                <div class="flowchart-edit-row" data-index="${i}">
                    <span class="step-number">${i + 1}.</span>
                    <input type="text" class="form-control flow-step" value="${Utils.escapeHtml(step)}" data-index="${i}">
                    <button type="button" class="btn btn-small btn-danger remove-step" title="Usuń etap">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

            Modal.open({
                title: 'Edytor schematu technologicznego',
                content: `
                    <p class="help-text">Edytuj etapy procesu. Dodaj "(CCP)" do nazw krytycznych punktów kontroli.</p>
                    <div id="flow-steps-container">${stepsHtml}</div>
                    <button type="button" class="btn btn-small" id="add-step-btn">
                        <i class="fas fa-plus"></i> Dodaj etap
                    </button>
                `,
                footer: `
                    <button type="button" class="btn btn-secondary" onclick="Modal.close()">Anuluj</button>
                    <button type="button" class="btn btn-success" id="save-flowchart-btn">
                        <i class="fas fa-save"></i> Zapisz
                    </button>
                `,
                size: 'medium',
                onOpen: () => {
                    const container = document.getElementById('flow-steps-container');

                    // Add step handler
                    document.getElementById('add-step-btn').onclick = () => {
                        const idx = container.children.length;
                        const row = document.createElement('div');
                        row.className = 'flowchart-edit-row';
                        row.dataset.index = idx;
                        row.innerHTML = `
                            <span class="step-number">${idx + 1}.</span>
                            <input type="text" class="form-control flow-step" value="" data-index="${idx}" placeholder="Nazwa etapu">
                            <button type="button" class="btn btn-small btn-danger remove-step" title="Usuń etap">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        container.appendChild(row);
                        row.querySelector('input').focus();
                    };

                    // Remove step handler (delegated)
                    container.onclick = (e) => {
                        if (e.target.closest('.remove-step')) {
                            const rows = container.querySelectorAll('.flowchart-edit-row');
                            if (rows.length <= 1) {
                                Notifications.warning('Schemat musi mieć minimum jeden etap');
                                return;
                            }
                            e.target.closest('.flowchart-edit-row').remove();
                            // Renumber
                            container.querySelectorAll('.flowchart-edit-row').forEach((row, i) => {
                                row.querySelector('.step-number').textContent = `${i + 1}.`;
                            });
                        }
                    };

                    // Save handler
                    document.getElementById('save-flowchart-btn').onclick = async () => {
                        const inputs = container.querySelectorAll('.flow-step');
                        const newSteps = [];
                        inputs.forEach(input => {
                            const value = input.value.trim();
                            if (value) newSteps.push(value);
                        });

                        if (newSteps.length === 0) {
                            Notifications.warning('Dodaj minimum jeden etap');
                            return;
                        }

                        await storage.save(this.storeName, newSteps);
                        Modal.close();
                        Notifications.success('Schemat został zapisany');
                        this.display();
                    };
                }
            });
        }
    },

    // ==================== HELPER METHODS ====================

    /**
     * Get status CSS class
     */
    getStatusClass(status, type) {
        const map = {
            'Ukończone': 'status-completed',
            'W trakcie': 'status-pending',
            'Opóźnione': 'status-overdue'
        };
        return map[status] || 'status-pending';
    },

    getRiskClass(risk) {
        const map = {
            'Krytyczne': 'status-overdue',
            'Wysokie': 'status-warning',
            'Średnie': 'status-pending',
            'Niskie': 'status-completed'
        };
        return map[risk] || 'status-pending';
    },

    getQualityClass(quality) {
        const map = {
            'Przyjęto': 'status-completed',
            'Przyjęto warunkowo': 'status-pending',
            'Odrzucono': 'status-overdue'
        };
        return map[quality] || 'status-completed';
    },

    getActionStatusClass(status) {
        const map = {
            'Zamknięte': 'status-completed',
            'W realizacji': 'status-pending',
            'Otwarte': 'status-overdue'
        };
        return map[status] || 'status-pending';
    },

    getTrainingStatusClass(status) {
        const map = {
            'Zrealizowane': 'status-completed',
            'Planowane': 'status-pending',
            'Anulowane': 'status-overdue'
        };
        return map[status] || 'status-pending';
    },

    getAuditResultClass(result) {
        const map = {
            'Pozytywny': 'status-completed',
            'Warunkowo pozytywny': 'status-pending',
            'Negatywny': 'status-overdue',
            'Planowany': 'status-pending'
        };
        return map[result] || 'status-pending';
    },

    getTestStatusClass(status) {
        const map = {
            'Aktualne': 'status-completed',
            'Do wykonania': 'status-pending',
            'Przeterminowane': 'status-overdue'
        };
        return map[status] || 'status-pending';
    },

    /**
     * Apply filters to data
     */
    applyFilters(data, tableName) {
        const filters = this.filterState[tableName] || {};
        let filtered = [...data];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(searchLower)
                )
            );
        }

        // Status/type filters
        Object.entries(filters).forEach(([key, value]) => {
            if (key !== 'search' && value) {
                filtered = filtered.filter(item => item[key] === value);
            }
        });

        return filtered;
    },

    /**
     * Apply sorting to data
     */
    applySort(data, tableName) {
        const sort = this.sortState[tableName];
        if (!sort) return data;

        return [...data].sort((a, b) => {
            let aVal = a[sort.column] || '';
            let bVal = b[sort.column] || '';

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * Paginate data
     */
    paginate(data, tableName) {
        const page = this.pageState[tableName] || 1;
        const perPage = CONFIG.UI.ITEMS_PER_PAGE;
        const totalPages = Math.ceil(data.length / perPage);
        const start = (page - 1) * perPage;
        const items = data.slice(start, start + perPage);

        const html = totalPages > 1 ? this.renderPagination(page, totalPages, tableName) : '';

        return { items, html, totalPages, currentPage: page };
    },

    /**
     * Render pagination HTML
     */
    renderPagination(currentPage, totalPages, tableName) {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        return `
            <nav class="pagination" aria-label="Nawigacja stron">
                <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''}
                    onclick="CrudManager.goToPage('${tableName}', ${currentPage - 1})" aria-label="Poprzednia strona">
                    <i class="fas fa-chevron-left"></i>
                </button>
                ${pages.map(p => p === '...'
                    ? '<span class="pagination-ellipsis">...</span>'
                    : `<button class="pagination-btn ${p === currentPage ? 'active' : ''}"
                        onclick="CrudManager.goToPage('${tableName}', ${p})" aria-label="Strona ${p}"
                        ${p === currentPage ? 'aria-current="page"' : ''}>${p}</button>`
                ).join('')}
                <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''}
                    onclick="CrudManager.goToPage('${tableName}', ${currentPage + 1})" aria-label="Następna strona">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </nav>
        `;
    },

    /**
     * Go to specific page
     */
    goToPage(tableName, page) {
        this.pageState[tableName] = page;
        this.refreshTable(tableName);
    },

    /**
     * Refresh table display
     */
    refreshTable(tableName) {
        const tableMap = {
            'procedures': this.procedures,
            'hazards': this.hazards,
            'deliveries': this.deliveries,
            'temperature': this.temperature,
            'correctiveActions': this.correctiveActions,
            'trainings': this.trainings,
            'audits': this.audits,
            'tests': this.tests
        };

        if (tableMap[tableName]) {
            tableMap[tableName].display();
        }
    },

    /**
     * Setup table features (sorting, filtering)
     */
    setupTableFeatures(tableName) {
        // Setup sortable headers
        const table = document.querySelector(`#${tableName.replace(/([A-Z])/g, '-$1').toLowerCase()}-table, #${tableName}-table`);
        if (table) {
            table.querySelectorAll('th[data-sort]').forEach(th => {
                th.style.cursor = 'pointer';
                th.onclick = () => {
                    const column = th.dataset.sort;
                    const currentSort = this.sortState[tableName];
                    const direction = currentSort?.column === column && currentSort?.direction === 'asc' ? 'desc' : 'asc';
                    this.sortState[tableName] = { column, direction };
                    this.refreshTable(tableName);
                };
            });
        }

        // Setup search inputs
        const searchInput = document.querySelector(`#${tableName}-search, #${tableName.replace(/([A-Z])/g, '-$1').toLowerCase()}-search`);
        if (searchInput) {
            searchInput.oninput = Utils.debounce((e) => {
                this.filterState[tableName] = this.filterState[tableName] || {};
                this.filterState[tableName].search = e.target.value;
                this.pageState[tableName] = 1;
                this.refreshTable(tableName);
            }, CONFIG.UI.DEBOUNCE_DELAY);
        }

        // Setup filter selects
        document.querySelectorAll(`[id^="${tableName}-filter"], [id^="${tableName.replace(/([A-Z])/g, '-$1').toLowerCase()}-filter"]`).forEach(select => {
            select.onchange = (e) => {
                const filterKey = select.id.split('-').pop();
                this.filterState[tableName] = this.filterState[tableName] || {};
                this.filterState[tableName][filterKey] = e.target.value;
                this.pageState[tableName] = 1;
                this.refreshTable(tableName);
            };
        });
    }
};

// Export for ES6 modules (future use)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrudManager;
}
