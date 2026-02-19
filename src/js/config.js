/**
 * INOVIT HACCP - Configuration Module
 * @module config
 * @description Centralized configuration and constants
 */

export const CONFIG = {
    // Application info
    APP: {
        NAME: 'INOVIT e-Segregator HACCP',
        SHORT_NAME: 'INOVIT HACCP',
        VERSION: '2.1.0',
        AUTHOR: 'INOVIT',
        CONTACT: {
            PHONE: '+48 575-757-638',
            EMAIL: 'kontakt@inovit.com.pl',
            WEBSITE: 'www.inovit.com.pl'
        }
    },

    // Storage configuration
    STORAGE: {
        DB_NAME: 'inovit-haccp-db',
        DB_VERSION: 2,
        LOCAL_STORAGE_KEY: 'inovit-haccp-data',
        STORES: [
            'facility',
            'procedures',
            'hazards',
            'temperatureLog',
            'trainings',
            'audits',
            'tests',
            'deliveries',
            'correctiveActions',
            'flowChart',
            'reminders',
            'auditLog'
        ]
    },

    // UI Configuration
    UI: {
        NOTIFICATION_DURATION: 3000,
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 300,
        ITEMS_PER_PAGE: 10,
        MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
    },

    // Validation rules
    VALIDATION: {
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 1000,
        NIP_REGEX: /^\d{3}-?\d{3}-?\d{2}-?\d{2}$/,
        TEMPERATURE_RANGE: { MIN: -50, MAX: 150 },
        DATE_FORMAT: 'YYYY-MM-DD'
    },

    // Status options
    STATUS: {
        PROCEDURE: ['W trakcie', 'Ukończone', 'Opóźnione'],
        TRAINING: ['Planowane', 'Zrealizowane', 'Anulowane'],
        AUDIT: ['Planowany', 'Pozytywny', 'Warunkowo pozytywny', 'Negatywny'],
        TEST: ['Aktualne', 'Do wykonania', 'Przeterminowane'],
        CORRECTIVE_ACTION: ['Otwarte', 'W realizacji', 'Zamknięte'],
        DELIVERY_QUALITY: ['Przyjęto', 'Przyjęto warunkowo', 'Odrzucono']
    },

    // Hazard types
    HAZARD: {
        TYPES: ['Biologiczne', 'Chemiczne', 'Fizyczne'],
        PROBABILITIES: ['Niskie', 'Średnie', 'Wysokie'],
        IMPACTS: ['Niskie', 'Średnie', 'Wysokie'],
        RISKS: ['Niskie', 'Średnie', 'Wysokie', 'Krytyczne'],
        CCP_OPTIONS: ['NIE', 'TAK']
    },

    // Audit types
    AUDIT_TYPES: ['Wewnętrzny', 'Zewnętrzny', 'Certyfikacyjny'],

    // Test types
    TEST_TYPES: ['Mikrobiologiczne', 'Fizykochemiczne', 'Wody', 'Powierzchni'],

    // Test frequencies
    TEST_FREQUENCIES: ['Codziennie', 'Tygodniowo', 'Miesięcznie', 'Kwartalnie', 'Rocznie'],

    // Facility types
    FACILITY_TYPES: [
        'Produkcja żywności',
        'Handel detaliczny',
        'Handel hurtowy',
        'Gastronomia',
        'Catering'
    ],

    // Default flowchart steps
    DEFAULT_FLOWCHART: [
        'PRZYJĘCIE SUROWCA',
        'PRZECHOWYWANIE',
        'PRZYGOTOWANIE',
        'OBRÓBKA TERMICZNA (CCP)',
        'CHŁODZENIE',
        'PAKOWANIE',
        'WYDANIE PRODUKTU'
    ],

    // Default procedures
    DEFAULT_PROCEDURES: [
        { id: 1, name: 'Higiena personelu', status: 'Ukończone', date: '', description: '' },
        { id: 2, name: 'Mycie i dezynfekcja', status: 'W trakcie', date: '', description: '' },
        { id: 3, name: 'Kontrola szkodników', status: 'W trakcie', date: '', description: '' },
        { id: 4, name: 'Jakość wody', status: 'Ukończone', date: '', description: '' },
        { id: 5, name: 'Gospodarowanie odpadami', status: 'W trakcie', date: '', description: '' }
    ],

    // Default hazards
    DEFAULT_HAZARDS: [
        { id: 1, stage: 'Przyjęcie surowca', hazard: 'Zanieczyszczenie mikrobiologiczne', type: 'Biologiczne', probability: 'Średnie', impact: 'Wysokie', risk: 'Wysokie', ccp: 'TAK', control: '' },
        { id: 2, stage: 'Obróbka termiczna', hazard: 'Niedogotowanie', type: 'Biologiczne', probability: 'Niskie', impact: 'Wysokie', risk: 'Krytyczne', ccp: 'TAK', control: '' },
        { id: 3, stage: 'Przechowywanie', hazard: 'Wzrost temperatury', type: 'Fizyczne', probability: 'Średnie', impact: 'Średnie', risk: 'Średnie', ccp: 'NIE', control: '' }
    ],

    // Valid pages for navigation
    VALID_PAGES: [
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
    ],

    // CSS Classes
    CSS: {
        PAGE_HIDDEN: 'page-hidden',
        FADE_IN_UP: 'fade-in-up',
        MODAL_ACTIVE: 'active',
        STATUS_COMPLETED: 'status-completed',
        STATUS_PENDING: 'status-pending',
        STATUS_OVERDUE: 'status-overdue',
        STATUS_WARNING: 'status-warning'
    },

    // Keyboard shortcuts
    KEYBOARD: {
        ESCAPE: 'Escape',
        ENTER: 'Enter',
        TAB: 'Tab'
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.STORAGE);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.VALIDATION);
Object.freeze(CONFIG.STATUS);
Object.freeze(CONFIG.HAZARD);
Object.freeze(CONFIG.CSS);
Object.freeze(CONFIG.KEYBOARD);

// Export for ES6 modules (future use)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
