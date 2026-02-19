import { CONFIG } from "./config.js";
import { Utils } from "./utils.js";
import { PageTemplates } from "./templates.js";
import { Notifications } from "./notifications.js";
import { Modal } from "./modal.js";
import { CrudManager } from "./crud.js";
/**
 * INOVIT HACCP - Navigation Module
 * @module navigation
 * @description Page navigation and routing system
 */

export const Navigation = {
    /**
     * Current page ID
     */
    currentPage: 'welcome',

    /**
     * Navigation history
     */
    history: [],

    /**
     * Page cache for lazy loading
     */
    pageCache: new Map(),

    /**
     * Page load callbacks
     */
    pageLoadCallbacks: new Map(),

    /**
     * Initialize navigation
     */
    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const hash = window.location.hash.substring(1);
            if (hash && this.isValidPage(hash)) {
                this.showPage(hash, false);
            } else {
                this.showPage('welcome', false);
            }
        });

        // Handle hash on load
        const initialHash = window.location.hash.substring(1);
        if (initialHash && this.isValidPage(initialHash)) {
            this.showPage(initialHash, false);
        } else {
            this.showPage('welcome', false);
        }
    },

    /**
     * Check if page ID is valid
     * @param {string} pageId - Page ID to check
     * @returns {boolean} Is valid
     */
    isValidPage(pageId) {
        return CONFIG.VALID_PAGES.includes(pageId);
    },

    /**
     * Show page
     * @param {string} pageId - Page ID to show
     * @param {boolean} updateHistory - Update browser history
     */
    showPage(pageId, updateHistory = true) {
        console.log('[Navigation] Showing page:', pageId);

        if (!this.isValidPage(pageId)) {
            console.warn('[Navigation] Invalid page:', pageId);
            pageId = 'welcome';
        }

        const contentContainer = document.getElementById('content-container');
        const welcomePage = document.getElementById('welcome');
        const dashboardPage = document.getElementById('dashboard');

        // Hide all static pages
        if (welcomePage) welcomePage.classList.add(CONFIG.CSS.PAGE_HIDDEN);
        if (dashboardPage) dashboardPage.classList.add(CONFIG.CSS.PAGE_HIDDEN);

        // Clear dynamic content
        if (contentContainer) contentContainer.innerHTML = '';

        // Show selected page
        if (pageId === 'welcome' || pageId === 'dashboard') {
            this.showStaticPage(pageId);
        } else {
            this.loadDynamicPage(pageId);
        }

        // Update history
        this.history.push(this.currentPage);
        this.currentPage = pageId;

        // Update URL
        if (updateHistory && history.pushState) {
            history.pushState({ page: pageId }, '', '#' + pageId);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Announce page change
        Utils.announce(`Strona: ${this.getPageTitle(pageId)}`);
    },

    /**
     * Show static page
     * @private
     */
    showStaticPage(pageId) {
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.remove(CONFIG.CSS.PAGE_HIDDEN);
            this.restartAnimation(page);

            // Also load page data for static pages (like dashboard KPI)
            this.loadPageData(pageId);
        }
    },

    /**
     * Load dynamic page
     * @private
     */
    loadDynamicPage(pageId) {
        const contentContainer = document.getElementById('content-container');
        const pageContent = PageTemplates.getPage(pageId);

        if (pageContent) {
            contentContainer.innerHTML = pageContent;
            this.restartAnimation(contentContainer.firstElementChild);

            // Load page data
            this.loadPageData(pageId);
        }
    },

    /**
     * Restart CSS animation
     * @private
     */
    restartAnimation(element) {
        if (!element) return;

        const animatedElement = element.querySelector(`.${CONFIG.CSS.FADE_IN_UP}`) || element;
        if (animatedElement.classList.contains(CONFIG.CSS.FADE_IN_UP)) {
            animatedElement.classList.remove(CONFIG.CSS.FADE_IN_UP);
            void animatedElement.offsetWidth; // Force reflow
            animatedElement.classList.add(CONFIG.CSS.FADE_IN_UP);
        }
    },

    /**
     * Load page data
     * @param {string} pageId - Page ID
     */
    async loadPageData(pageId) {
        const callback = this.pageLoadCallbacks.get(pageId);
        if (callback) {
            try {
                await callback();
            } catch (error) {
                console.error('[Navigation] Error loading page data:', error);
                Notifications.error('Błąd podczas ładowania danych strony');
            }
        }
    },

    /**
     * Register page load callback
     * @param {string} pageId - Page ID
     * @param {Function} callback - Load callback
     */
    onPageLoad(pageId, callback) {
        this.pageLoadCallbacks.set(pageId, callback);
    },

    /**
     * Go back to previous page
     */
    goBack() {
        if (this.history.length > 0) {
            const previousPage = this.history.pop();
            this.showPage(previousPage, true);
        } else {
            this.showPage('dashboard', true);
        }
    },

    /**
     * Get page title
     * @param {string} pageId - Page ID
     * @returns {string} Page title
     */
    getPageTitle(pageId) {
        const titles = {
            'welcome': 'Strona główna',
            'dashboard': 'Centrum Dokumentacji',
            'wprowadzenie': 'Wprowadzenie do dokumentacji HACCP',
            'opis-zakladu': 'Opis zakładu',
            'ghp-gmp': 'Program GHP/GMP',
            'schemat': 'Schemat technologiczny',
            'analiza': 'Analiza zagrożeń HACCP',
            'rejestry': 'Rejestry i zapisy',
            'korekty': 'Działania korygujące',
            'szkolenia': 'Szkolenia pracowników',
            'audyty': 'Audyty i weryfikacja',
            'badania': 'Plan i rejestr badań'
        };
        return titles[pageId] || pageId;
    },

    /**
     * Get breadcrumb for current page
     * @returns {Array} Breadcrumb items
     */
    getBreadcrumb() {
        const breadcrumb = [
            { label: 'Strona główna', page: 'welcome' }
        ];

        if (this.currentPage !== 'welcome') {
            breadcrumb.push({ label: 'Centrum', page: 'dashboard' });
        }

        if (this.currentPage !== 'welcome' && this.currentPage !== 'dashboard') {
            breadcrumb.push({
                label: this.getPageTitle(this.currentPage),
                page: this.currentPage,
                active: true
            });
        }

        return breadcrumb;
    },

    /**
     * Render breadcrumb HTML
     * @returns {string} Breadcrumb HTML
     */
    renderBreadcrumb() {
        const items = this.getBreadcrumb();
        return `
            <nav class="breadcrumb" aria-label="Ścieżka nawigacji">
                <ol>
                    ${items.map((item, index) => `
                        <li ${item.active ? 'aria-current="page"' : ''}>
                            ${item.active
                                ? Utils.escapeHtml(item.label)
                                : `<a href="#${item.page}" onclick="Navigation.showPage('${item.page}'); return false;">${Utils.escapeHtml(item.label)}</a>`
                            }
                            ${index < items.length - 1 ? '<span class="breadcrumb-separator" aria-hidden="true">/</span>' : ''}
                        </li>
                    `).join('')}
                </ol>
            </nav>
        `;
    }
};

// Legacy support
function showPage(pageId) {
    Navigation.showPage(pageId);
}

