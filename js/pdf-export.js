/**
 * INOVIT HACCP - PDF Export Module
 * @module pdf-export
 * @description Generate PDF reports from application data
 */

const PDFExport = {
    /**
     * jsPDF instance
     */
    doc: null,

    /**
     * Current Y position on page
     */
    y: 0,

    /**
     * Page settings
     */
    settings: {
        margin: 20,
        lineHeight: 7,
        pageWidth: 210,
        pageHeight: 297,
        fontSize: {
            title: 18,
            subtitle: 14,
            heading: 12,
            normal: 10,
            small: 8
        },
        colors: {
            primary: [0, 79, 93],      // #004F5D
            secondary: [0, 115, 128],   // #007380
            accent: [0, 229, 255],      // #00E5FF
            success: [40, 167, 69],     // #28a745
            warning: [255, 193, 7],     // #ffc107
            danger: [220, 53, 69],      // #dc3545
            text: [51, 51, 51],         // #333
            gray: [128, 128, 128]
        }
    },

    /**
     * Initialize jsPDF
     * @returns {Promise<void>}
     */
    async init() {
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            // Load jsPDF from CDN
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
        }
    },

    /**
     * Load external script
     * @param {string} src - Script URL
     * @returns {Promise<void>}
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Create new PDF document
     * @param {string} orientation - 'portrait' or 'landscape'
     */
    createDocument(orientation = 'portrait') {
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF({
            orientation,
            unit: 'mm',
            format: 'a4'
        });
        this.y = this.settings.margin;
    },

    /**
     * Add header to PDF
     * @param {string} title - Document title
     */
    addHeader(title) {
        const { margin, pageWidth, colors, fontSize } = this.settings;

        // Header background
        this.doc.setFillColor(...colors.primary);
        this.doc.rect(0, 0, pageWidth, 35, 'F');

        // Logo text
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(fontSize.title);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('INOVIT', margin, 15);

        this.doc.setFontSize(fontSize.small);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text('e-Segregator HACCP', margin, 22);

        // Title
        this.doc.setFontSize(fontSize.subtitle);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, margin, 30);

        // Date
        this.doc.setFontSize(fontSize.small);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Wygenerowano: ${Utils.formatDateTime(new Date())}`, pageWidth - margin, 30, { align: 'right' });

        this.y = 45;
    },

    /**
     * Add footer to current page
     * @param {number} pageNumber - Current page number
     * @param {number} totalPages - Total pages
     */
    addFooter(pageNumber, totalPages) {
        const { margin, pageWidth, pageHeight, colors, fontSize } = this.settings;

        this.doc.setDrawColor(...colors.gray);
        this.doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        this.doc.setFontSize(fontSize.small);
        this.doc.setTextColor(...colors.gray);
        this.doc.text(
            `INOVIT e-Segregator HACCP | Strona ${pageNumber} z ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    },

    /**
     * Check if new page is needed
     * @param {number} requiredSpace - Space needed in mm
     */
    checkNewPage(requiredSpace = 20) {
        if (this.y + requiredSpace > this.settings.pageHeight - 25) {
            this.doc.addPage();
            this.y = this.settings.margin;
            return true;
        }
        return false;
    },

    /**
     * Add section heading
     * @param {string} text - Heading text
     * @param {string} icon - Icon character (optional)
     */
    addHeading(text, icon = '') {
        this.checkNewPage(15);

        const { margin, colors, fontSize } = this.settings;

        this.doc.setFillColor(...colors.secondary);
        this.doc.rect(margin, this.y - 5, 3, 10, 'F');

        this.doc.setFontSize(fontSize.heading);
        this.doc.setTextColor(...colors.primary);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${icon} ${text}`.trim(), margin + 6, this.y);

        this.y += 10;
    },

    /**
     * Add paragraph text
     * @param {string} text - Paragraph text
     */
    addParagraph(text) {
        const { margin, pageWidth, fontSize, colors, lineHeight } = this.settings;
        const maxWidth = pageWidth - (margin * 2);

        this.doc.setFontSize(fontSize.normal);
        this.doc.setTextColor(...colors.text);
        this.doc.setFont('helvetica', 'normal');

        const lines = this.doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            this.checkNewPage();
            this.doc.text(line, margin, this.y);
            this.y += lineHeight;
        });
    },

    /**
     * Add table to PDF
     * @param {string[]} headers - Table headers
     * @param {Array<Array>} data - Table data
     * @param {Object} options - Table options
     */
    addTable(headers, data, options = {}) {
        const { margin, colors } = this.settings;

        this.doc.autoTable({
            startY: this.y,
            head: [headers],
            body: data,
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: colors.primary,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                textColor: colors.text
            },
            alternateRowStyles: {
                fillColor: [248, 250, 251]
            },
            styles: {
                cellPadding: 3,
                overflow: 'linebreak'
            },
            ...options
        });

        this.y = this.doc.lastAutoTable.finalY + 10;
    },

    /**
     * Add key-value pair
     * @param {string} label - Label
     * @param {string} value - Value
     */
    addField(label, value) {
        const { margin, colors, fontSize } = this.settings;

        this.checkNewPage();

        this.doc.setFontSize(fontSize.small);
        this.doc.setTextColor(...colors.gray);
        this.doc.text(label + ':', margin, this.y);

        this.doc.setFontSize(fontSize.normal);
        this.doc.setTextColor(...colors.text);
        this.doc.text(String(value || '-'), margin + 50, this.y);

        this.y += 7;
    },

    /**
     * Add space
     * @param {number} space - Space in mm
     */
    addSpace(space = 5) {
        this.y += space;
    },

    /**
     * Export facility data to PDF
     */
    async exportFacility() {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument();

            const facility = await storage.load('facility') || {};

            this.addHeader('Opis zakładu');

            this.addHeading('Dane identyfikacyjne');
            this.addField('Nazwa zakładu', facility.name);
            this.addField('NIP', facility.nip);
            this.addField('Adres', facility.address);
            this.addField('Miejscowość', facility.city);

            this.addSpace(5);
            this.addHeading('Charakterystyka działalności');
            this.addField('Rodzaj działalności', facility.type);

            if (facility.products) {
                this.addSpace(3);
                this.doc.setFontSize(this.settings.fontSize.small);
                this.doc.setTextColor(...this.settings.colors.gray);
                this.doc.text('Asortyment:', this.settings.margin, this.y);
                this.y += 5;
                this.addParagraph(facility.products);
            }

            // Add footer to all pages
            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Zaklad_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export procedures to PDF
     */
    async exportProcedures() {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument();

            const procedures = await storage.load('procedures') || [];

            this.addHeader('Program GHP/GMP - Procedury');

            this.addHeading('Lista procedur');

            const headers = ['Lp.', 'Nazwa procedury', 'Status', 'Data aktualizacji'];
            const data = procedures.map((p, i) => [
                i + 1,
                p.name || '-',
                p.status || '-',
                p.date ? Utils.formatDate(p.date) : '-'
            ]);

            this.addTable(headers, data);

            // Details for each procedure
            procedures.forEach((p, i) => {
                if (p.description) {
                    this.checkNewPage(30);
                    this.addHeading(`${i + 1}. ${p.name}`);
                    this.addParagraph(p.description);
                }
            });

            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Procedury_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export hazard analysis to PDF
     */
    async exportHazards() {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument('landscape');

            const hazards = await storage.load('hazards') || [];

            this.addHeader('Analiza zagrożeń HACCP');

            this.addHeading('Matryca analizy zagrożeń');

            const headers = ['Etap', 'Zagrożenie', 'Typ', 'Prawdop.', 'Skutki', 'Ryzyko', 'CCP', 'Środki kontroli'];
            const data = hazards.map(h => [
                h.stage || '-',
                h.hazard || '-',
                h.type || '-',
                h.probability || '-',
                h.impact || '-',
                h.risk || '-',
                h.ccp || '-',
                h.control || '-'
            ]);

            this.addTable(headers, data, {
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 40 },
                    7: { cellWidth: 50 }
                }
            });

            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Analiza_Zagrozen_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export temperature log to PDF
     */
    async exportTemperature(dateFrom = null, dateTo = null) {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument();

            let data = await storage.load('temperatureLog') || [];

            // Filter by date range
            if (dateFrom || dateTo) {
                data = data.filter(r => {
                    const date = new Date(r.date);
                    if (dateFrom && date < new Date(dateFrom)) return false;
                    if (dateTo && date > new Date(dateTo)) return false;
                    return true;
                });
            }

            this.addHeader('Rejestr kontroli temperatury');

            if (dateFrom || dateTo) {
                this.addParagraph(`Okres: ${dateFrom || 'początek'} - ${dateTo || 'dziś'}`);
            }

            this.addHeading('Pomiary temperatury');

            const headers = ['Data', 'Godzina', 'Urządzenie', 'Temp. (°C)', 'Norma', 'Status', 'Podpis'];
            const tableData = data.map(r => [
                r.date || '-',
                r.time || '-',
                r.device || '-',
                r.temperature || '-',
                r.norm || '-',
                r.status || 'OK',
                r.signature || '-'
            ]);

            this.addTable(headers, tableData);

            // Summary
            if (data.length > 0) {
                const temps = data.map(r => parseFloat(r.temperature)).filter(t => !isNaN(t));
                if (temps.length > 0) {
                    this.addHeading('Podsumowanie');
                    this.addField('Liczba pomiarów', data.length);
                    this.addField('Temperatura min.', Math.min(...temps).toFixed(1) + '°C');
                    this.addField('Temperatura max.', Math.max(...temps).toFixed(1) + '°C');
                    this.addField('Temperatura śr.', (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) + '°C');

                    const violations = data.filter(r => r.status === 'Przekroczenie').length;
                    this.addField('Przekroczenia', violations);
                }
            }

            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Temperatura_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export deliveries to PDF
     */
    async exportDeliveries() {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument('landscape');

            const deliveries = await storage.load('deliveries') || [];

            this.addHeader('Rejestr dostaw surowca');

            this.addHeading('Lista dostaw');

            const headers = ['Data', 'Dostawca', 'Produkt', 'Ilość', 'Temp.', 'Termin ważności', 'Ocena', 'Uwagi'];
            const data = deliveries.map(d => [
                d.date || '-',
                d.supplier || '-',
                d.product || '-',
                d.quantity || '-',
                d.temperature || '-',
                d.expiryDate || '-',
                d.quality || 'Przyjęto',
                d.notes || '-'
            ]);

            this.addTable(headers, data);

            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Dostawy_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export trainings to PDF
     */
    async exportTrainings() {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument();

            const trainings = await storage.load('trainings') || [];

            this.addHeader('Rejestr szkoleń pracowników');

            this.addHeading('Plan szkoleń');

            const headers = ['Temat', 'Data', 'Prowadzący', 'Uczestnicy', 'Status'];
            const data = trainings.map(t => [
                t.topic || '-',
                t.date || '-',
                t.trainer || '-',
                t.participants || '0',
                t.status || '-'
            ]);

            this.addTable(headers, data);

            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Szkolenia_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export audits to PDF
     */
    async exportAudits() {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument();

            const audits = await storage.load('audits') || [];

            this.addHeader('Rejestr audytów i weryfikacji');

            this.addHeading('Harmonogram audytów');

            const headers = ['Typ', 'Data', 'Audytor', 'Obszar', 'Wynik', 'Niezgodności', 'Uwagi'];
            const data = audits.map(a => [
                a.type || '-',
                a.date || '-',
                a.auditor || '-',
                a.area || '-',
                a.result || '-',
                a.findings || '0',
                a.notes || '-'
            ]);

            this.addTable(headers, data);

            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Audyty_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export corrective actions to PDF
     */
    async exportCorrectiveActions() {
        const loading = Notifications.loading('Generowanie raportu PDF...');

        try {
            await this.init();
            this.createDocument('landscape');

            const actions = await storage.load('correctiveActions') || [];

            this.addHeader('Rejestr działań korygujących');

            this.addHeading('Lista działań');

            const headers = ['Data', 'Problem', 'CCP', 'Działanie', 'Odpowiedzialny', 'Status', 'Data zamknięcia'];
            const data = actions.map(a => [
                a.date || '-',
                a.problem || '-',
                a.ccp || '-',
                a.actionTaken || '-',
                a.responsible || '-',
                a.status || '-',
                a.closeDate || '-'
            ]);

            this.addTable(headers, data, {
                columnStyles: {
                    1: { cellWidth: 50 },
                    3: { cellWidth: 50 }
                }
            });

            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Dzialania_Korygujace_${Utils.getCurrentDate()}.pdf`);
            loading.success('Raport PDF został wygenerowany');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania PDF');
        }
    },

    /**
     * Export complete HACCP documentation
     */
    async exportFullDocumentation() {
        const loading = Notifications.loading('Generowanie pełnej dokumentacji...');

        try {
            await this.init();
            this.createDocument();

            // Title page
            this.addHeader('Pełna dokumentacja HACCP');
            this.addSpace(20);

            const facility = await storage.load('facility') || {};
            if (facility.name) {
                this.doc.setFontSize(24);
                this.doc.setTextColor(...this.settings.colors.primary);
                this.doc.text(facility.name, this.settings.pageWidth / 2, 100, { align: 'center' });

                this.doc.setFontSize(14);
                this.doc.setTextColor(...this.settings.colors.gray);
                this.doc.text(facility.address || '', this.settings.pageWidth / 2, 115, { align: 'center' });
                this.doc.text(facility.city || '', this.settings.pageWidth / 2, 125, { align: 'center' });
            }

            this.doc.setFontSize(12);
            this.doc.text(`Data wygenerowania: ${Utils.formatDate(new Date())}`, this.settings.pageWidth / 2, 200, { align: 'center' });

            // Facility
            this.doc.addPage();
            this.y = this.settings.margin;
            this.addHeader('1. Opis zakładu');
            this.addField('Nazwa zakładu', facility.name);
            this.addField('NIP', facility.nip);
            this.addField('Adres', facility.address);
            this.addField('Miejscowość', facility.city);
            this.addField('Rodzaj działalności', facility.type);
            if (facility.products) {
                this.addSpace(5);
                this.addHeading('Asortyment');
                this.addParagraph(facility.products);
            }

            // Procedures
            const procedures = await storage.load('procedures') || [];
            if (procedures.length > 0) {
                this.doc.addPage();
                this.y = this.settings.margin;
                this.addHeader('2. Program GHP/GMP');
                this.addTable(
                    ['Lp.', 'Nazwa procedury', 'Status', 'Data'],
                    procedures.map((p, i) => [i + 1, p.name, p.status, p.date || '-'])
                );
            }

            // Hazards
            const hazards = await storage.load('hazards') || [];
            if (hazards.length > 0) {
                this.doc.addPage();
                this.y = this.settings.margin;
                this.addHeader('3. Analiza zagrożeń');
                this.addTable(
                    ['Etap', 'Zagrożenie', 'Typ', 'Ryzyko', 'CCP'],
                    hazards.map(h => [h.stage, h.hazard, h.type, h.risk, h.ccp])
                );
            }

            // Temperature
            const tempLog = await storage.load('temperatureLog') || [];
            if (tempLog.length > 0) {
                this.doc.addPage();
                this.y = this.settings.margin;
                this.addHeader('4. Rejestr temperatury (ostatnie 30 rekordów)');
                this.addTable(
                    ['Data', 'Godzina', 'Urządzenie', 'Temp.', 'Status'],
                    tempLog.slice(-30).map(r => [r.date, r.time, r.device, r.temperature + '°C', r.status])
                );
            }

            // Trainings
            const trainings = await storage.load('trainings') || [];
            if (trainings.length > 0) {
                this.doc.addPage();
                this.y = this.settings.margin;
                this.addHeader('5. Szkolenia pracowników');
                this.addTable(
                    ['Temat', 'Data', 'Prowadzący', 'Status'],
                    trainings.map(t => [t.topic, t.date, t.trainer || '-', t.status])
                );
            }

            // Audits
            const audits = await storage.load('audits') || [];
            if (audits.length > 0) {
                this.doc.addPage();
                this.y = this.settings.margin;
                this.addHeader('6. Audyty');
                this.addTable(
                    ['Typ', 'Data', 'Audytor', 'Wynik'],
                    audits.map(a => [a.type, a.date, a.auditor || '-', a.result])
                );
            }

            // Add footers
            const totalPages = this.doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                this.doc.setPage(i);
                this.addFooter(i, totalPages);
            }

            this.doc.save(`INOVIT_HACCP_Pelna_Dokumentacja_${Utils.getCurrentDate()}.pdf`);
            loading.success('Pełna dokumentacja została wygenerowana');

        } catch (error) {
            console.error('[PDFExport] Error:', error);
            loading.error('Błąd podczas generowania dokumentacji');
        }
    },

    /**
     * Show export dialog
     */
    showExportDialog() {
        Modal.open({
            title: 'Eksport do PDF',
            content: `
                <div class="export-options">
                    <p class="help-text">Wybierz raport do wygenerowania:</p>

                    <div class="export-grid">
                        <button class="export-option" onclick="PDFExport.exportFacility(); Modal.close();">
                            <i class="fas fa-building"></i>
                            <span>Opis zakładu</span>
                        </button>

                        <button class="export-option" onclick="PDFExport.exportProcedures(); Modal.close();">
                            <i class="fas fa-shield-alt"></i>
                            <span>Procedury GHP/GMP</span>
                        </button>

                        <button class="export-option" onclick="PDFExport.exportHazards(); Modal.close();">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>Analiza zagrożeń</span>
                        </button>

                        <button class="export-option" onclick="PDFExport.exportTemperature(); Modal.close();">
                            <i class="fas fa-thermometer-half"></i>
                            <span>Rejestr temperatury</span>
                        </button>

                        <button class="export-option" onclick="PDFExport.exportDeliveries(); Modal.close();">
                            <i class="fas fa-truck"></i>
                            <span>Rejestr dostaw</span>
                        </button>

                        <button class="export-option" onclick="PDFExport.exportTrainings(); Modal.close();">
                            <i class="fas fa-graduation-cap"></i>
                            <span>Szkolenia</span>
                        </button>

                        <button class="export-option" onclick="PDFExport.exportAudits(); Modal.close();">
                            <i class="fas fa-clipboard-check"></i>
                            <span>Audyty</span>
                        </button>

                        <button class="export-option" onclick="PDFExport.exportCorrectiveActions(); Modal.close();">
                            <i class="fas fa-tools"></i>
                            <span>Działania korygujące</span>
                        </button>
                    </div>

                    <div class="export-full">
                        <button class="btn btn-success btn-block" onclick="PDFExport.exportFullDocumentation(); Modal.close();">
                            <i class="fas fa-file-pdf"></i>
                            Eksportuj pełną dokumentację HACCP
                        </button>
                    </div>
                </div>
            `,
            footer: `<button class="btn btn-secondary" onclick="Modal.close()">Anuluj</button>`,
            size: 'medium'
        });
    }
};

// Global function for easy access
function exportToPDF() {
    PDFExport.showExportDialog();
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFExport;
}
