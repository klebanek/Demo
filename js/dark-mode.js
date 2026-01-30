/**
 * INOVIT HACCP - Dark Mode Module
 * @module dark-mode
 * @description Toggle between light and dark themes
 */

const DarkMode = {
    STORAGE_KEY: 'darkMode',
    isEnabled: false,

    /**
     * Initialize dark mode
     */
    init() {
        // Check saved preference
        const saved = localStorage.getItem(this.STORAGE_KEY);

        if (saved !== null) {
            this.isEnabled = saved === 'true';
        } else {
            // Check system preference
            this.isEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Apply initial state
        this.apply();

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem(this.STORAGE_KEY) === null) {
                this.isEnabled = e.matches;
                this.apply();
            }
        });

        // Create toggle button
        this.createToggleButton();

        console.log('[DarkMode] Initialized, enabled:', this.isEnabled);
    },

    /**
     * Create floating toggle button
     */
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'dark-mode-toggle';
        button.className = 'dark-mode-toggle';
        button.setAttribute('aria-label', 'Przełącz tryb ciemny');
        button.innerHTML = `
            <i class="fas fa-moon dark-mode-icon-dark"></i>
            <i class="fas fa-sun dark-mode-icon-light"></i>
        `;
        button.onclick = () => this.toggle();
        document.body.appendChild(button);
    },

    /**
     * Toggle dark mode
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem(this.STORAGE_KEY, this.isEnabled);
        this.apply();

        // Animate toggle button
        const btn = document.getElementById('dark-mode-toggle');
        if (btn) {
            btn.classList.add('animate');
            setTimeout(() => btn.classList.remove('animate'), 300);
        }

        // Show notification
        if (typeof Notifications !== 'undefined') {
            Notifications.info(this.isEnabled ? 'Tryb ciemny włączony' : 'Tryb jasny włączony');
        }
    },

    /**
     * Apply current theme
     */
    apply() {
        if (this.isEnabled) {
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.body.classList.remove('dark-mode');
        }

        // Update meta theme color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', this.isEnabled ? '#1a1a2e' : '#004F5D');
        }
    },

    /**
     * Enable dark mode
     */
    enable() {
        this.isEnabled = true;
        localStorage.setItem(this.STORAGE_KEY, 'true');
        this.apply();
    },

    /**
     * Disable dark mode
     */
    disable() {
        this.isEnabled = false;
        localStorage.setItem(this.STORAGE_KEY, 'false');
        this.apply();
    },

    /**
     * Check if dark mode is enabled
     */
    isDark() {
        return this.isEnabled;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkMode;
}
