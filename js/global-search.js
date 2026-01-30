/**
 * INOVIT HACCP - Global Search Module
 * @module global-search
 * @description Global search functionality with Ctrl+K shortcut
 */

const GlobalSearch = {
    isOpen: false,
    searchResults: [],
    selectedIndex: 0,

    /**
     * Initialize global search
     */
    init() {
        this.createSearchOverlay();
        this.bindKeyboardShortcuts();
        console.log('[GlobalSearch] Initialized');
    },

    /**
     * Create search overlay HTML
     */
    createSearchOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'global-search-overlay';
        overlay.className = 'global-search-overlay';
        overlay.innerHTML = `
            <div class="global-search-modal" role="dialog" aria-modal="true" aria-label="Wyszukiwanie globalne">
                <div class="global-search-header">
                    <div class="global-search-input-wrapper">
                        <i class="fas fa-search" aria-hidden="true"></i>
                        <input type="text"
                            id="global-search-input"
                            class="global-search-input"
                            placeholder="Szukaj w dokumentacji HACCP..."
                            autocomplete="off"
                            aria-label="Pole wyszukiwania">
                        <kbd class="global-search-kbd">ESC</kbd>
                    </div>
                </div>
                <div class="global-search-body">
                    <div id="global-search-results" class="global-search-results">
                        <div class="global-search-hint">
                            <p><i class="fas fa-lightbulb"></i> Wpisz frazę, aby wyszukać w:</p>
                            <ul>
                                <li>Procedurach GHP/GMP</li>
                                <li>Zagrożeniach HACCP</li>
                                <li>Szkoleniach</li>
                                <li>Audytach</li>
                                <li>Badaniach</li>
                                <li>Dostawach</li>
                                <li>Działaniach korygujących</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="global-search-footer">
                    <span><kbd>Enter</kbd> wybierz</span>
                    <span><kbd>Esc</kbd> zamknij</span>
                    <span><kbd>Ctrl</kbd>+<kbd>K</kbd> otwórz</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Bind events
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        const input = document.getElementById('global-search-input');
        input.addEventListener('input', Utils.debounce((e) => {
            this.search(e.target.value);
        }, 300));

        input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    /**
     * Bind keyboard shortcuts
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to open
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            // Escape to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    /**
     * Handle keyboard navigation in results
     */
    handleKeyDown(e) {
        const results = this.searchResults;
        if (results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (results[this.selectedIndex]) {
                    this.selectResult(results[this.selectedIndex]);
                }
                break;
        }
    },

    /**
     * Update visual selection
     */
    updateSelection() {
        const items = document.querySelectorAll('.global-search-result-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
            if (index === this.selectedIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    },

    /**
     * Toggle search overlay
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    /**
     * Open search overlay
     */
    open() {
        const overlay = document.getElementById('global-search-overlay');
        overlay.classList.add('active');
        this.isOpen = true;

        const input = document.getElementById('global-search-input');
        input.value = '';
        input.focus();

        // Reset results
        this.searchResults = [];
        this.selectedIndex = 0;
        this.renderHint();

        document.body.style.overflow = 'hidden';
    },

    /**
     * Close search overlay
     */
    close() {
        const overlay = document.getElementById('global-search-overlay');
        overlay.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
    },

    /**
     * Render initial hint
     */
    renderHint() {
        const container = document.getElementById('global-search-results');
        container.innerHTML = `
            <div class="global-search-hint">
                <p><i class="fas fa-lightbulb"></i> Wpisz frazę, aby wyszukać w:</p>
                <ul>
                    <li>Procedurach GHP/GMP</li>
                    <li>Zagrożeniach HACCP</li>
                    <li>Szkoleniach</li>
                    <li>Audytach</li>
                    <li>Badaniach</li>
                    <li>Dostawach</li>
                    <li>Działaniach korygujących</li>
                </ul>
            </div>
        `;
    },

    /**
     * Perform search across all modules
     */
    async search(query) {
        if (!query || query.length < 2) {
            this.renderHint();
            return;
        }

        const container = document.getElementById('global-search-results');
        container.innerHTML = '<div class="global-search-loading"><i class="fas fa-spinner fa-spin"></i> Wyszukiwanie...</div>';

        try {
            const results = await this.performSearch(query.toLowerCase());
            this.searchResults = results;
            this.selectedIndex = 0;
            this.renderResults(results, query);
        } catch (error) {
            console.error('[GlobalSearch] Search error:', error);
            container.innerHTML = '<div class="global-search-error"><i class="fas fa-exclamation-circle"></i> Błąd wyszukiwania</div>';
        }
    },

    /**
     * Search all data stores
     */
    async performSearch(query) {
        const results = [];

        // Define searchable modules
        const modules = [
            { key: 'procedures', name: 'Procedury', page: 'ghp-gmp', icon: 'fas fa-shield-alt', fields: ['name', 'description'] },
            { key: 'hazards', name: 'Zagrożenia', page: 'analiza', icon: 'fas fa-exclamation-triangle', fields: ['stage', 'hazard', 'type', 'controlMeasures'] },
            { key: 'trainings', name: 'Szkolenia', page: 'szkolenia', icon: 'fas fa-graduation-cap', fields: ['topic', 'trainer', 'participants'] },
            { key: 'audits', name: 'Audyty', page: 'audyty', icon: 'fas fa-clipboard-check', fields: ['type', 'auditor', 'area', 'notes'] },
            { key: 'tests', name: 'Badania', page: 'badania', icon: 'fas fa-flask', fields: ['type', 'material', 'lab'] },
            { key: 'deliveries', name: 'Dostawy', page: 'rejestry', icon: 'fas fa-truck', fields: ['supplier', 'product', 'notes'] },
            { key: 'correctiveActions', name: 'Korekty', page: 'korekty', icon: 'fas fa-tools', fields: ['problem', 'action', 'responsible'] },
            { key: 'temperatureLog', name: 'Temperatura', page: 'rejestry', icon: 'fas fa-thermometer-half', fields: ['device', 'notes', 'signature'] }
        ];

        // Search each module
        for (const module of modules) {
            const data = await storage.load(module.key);
            if (!Array.isArray(data)) continue;

            data.forEach((item, index) => {
                const matches = this.matchItem(item, query, module.fields);
                if (matches.length > 0) {
                    results.push({
                        module: module.name,
                        page: module.page,
                        icon: module.icon,
                        id: item.id || index,
                        title: this.getItemTitle(item, module.key),
                        subtitle: this.getItemSubtitle(item, module.key),
                        matches: matches,
                        item: item
                    });
                }
            });
        }

        // Also search facility data
        const facility = await storage.load('facility');
        if (facility) {
            const facilityFields = ['name', 'address', 'city', 'products'];
            const matches = this.matchItem(facility, query, facilityFields);
            if (matches.length > 0) {
                results.push({
                    module: 'Zakład',
                    page: 'opis-zakladu',
                    icon: 'fas fa-building',
                    id: 'facility',
                    title: facility.name || 'Dane zakładu',
                    subtitle: facility.address || '',
                    matches: matches,
                    item: facility
                });
            }
        }

        // Sort by relevance (number of matches)
        results.sort((a, b) => b.matches.length - a.matches.length);

        return results.slice(0, 20); // Limit to 20 results
    },

    /**
     * Match item against query
     */
    matchItem(item, query, fields) {
        const matches = [];
        for (const field of fields) {
            if (item[field] && String(item[field]).toLowerCase().includes(query)) {
                matches.push({
                    field: field,
                    value: String(item[field])
                });
            }
        }
        return matches;
    },

    /**
     * Get display title for item
     */
    getItemTitle(item, moduleKey) {
        switch (moduleKey) {
            case 'procedures':
                return item.name || 'Procedura';
            case 'hazards':
                return item.hazard || item.stage || 'Zagrożenie';
            case 'trainings':
                return item.topic || 'Szkolenie';
            case 'audits':
                return `${item.type || 'Audyt'} - ${item.area || ''}`;
            case 'tests':
                return `${item.type || 'Badanie'} - ${item.material || ''}`;
            case 'deliveries':
                return `${item.supplier || 'Dostawa'} - ${item.product || ''}`;
            case 'correctiveActions':
                return item.problem || 'Działanie korygujące';
            case 'temperatureLog':
                return item.device || 'Pomiar temperatury';
            default:
                return 'Element';
        }
    },

    /**
     * Get subtitle for item
     */
    getItemSubtitle(item, moduleKey) {
        if (item.date) {
            return Utils.formatDate(item.date);
        }
        if (item.status) {
            return item.status;
        }
        return '';
    },

    /**
     * Render search results
     */
    renderResults(results, query) {
        const container = document.getElementById('global-search-results');

        if (results.length === 0) {
            container.innerHTML = `
                <div class="global-search-empty">
                    <i class="fas fa-search"></i>
                    <p>Brak wyników dla "<strong>${Utils.escapeHtml(query)}</strong>"</p>
                    <small>Spróbuj użyć innych słów kluczowych</small>
                </div>
            `;
            return;
        }

        let html = `<div class="global-search-count">${results.length} wyników</div>`;

        // Group by module
        const grouped = {};
        results.forEach(result => {
            if (!grouped[result.module]) {
                grouped[result.module] = [];
            }
            grouped[result.module].push(result);
        });

        for (const [module, items] of Object.entries(grouped)) {
            html += `<div class="global-search-group">
                <div class="global-search-group-header">
                    <i class="${items[0].icon}"></i> ${module}
                </div>`;

            items.forEach((result, index) => {
                const globalIndex = results.indexOf(result);
                html += `
                    <div class="global-search-result-item ${globalIndex === 0 ? 'selected' : ''}"
                         data-index="${globalIndex}"
                         onclick="GlobalSearch.selectResult(GlobalSearch.searchResults[${globalIndex}])">
                        <div class="global-search-result-content">
                            <div class="global-search-result-title">${this.highlightMatch(result.title, query)}</div>
                            <div class="global-search-result-subtitle">${result.subtitle}</div>
                        </div>
                        <div class="global-search-result-action">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        }

        container.innerHTML = html;

        // Add hover effects
        container.querySelectorAll('.global-search-result-item').forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = parseInt(item.dataset.index);
                this.updateSelection();
            });
        });
    },

    /**
     * Highlight matching text
     */
    highlightMatch(text, query) {
        if (!text) return '';
        const escaped = Utils.escapeHtml(text);
        const regex = new RegExp(`(${query})`, 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
    },

    /**
     * Select a result and navigate
     */
    selectResult(result) {
        this.close();
        Navigation.showPage(result.page);

        // Show notification
        if (typeof Notifications !== 'undefined') {
            Notifications.info(`Przejście do: ${result.module}`);
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    GlobalSearch.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalSearch;
}
