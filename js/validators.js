/**
 * INOVIT HACCP - Validators Module
 * @module validators
 * @description Form validation functions
 */

const Validators = {
    /**
     * Validation error messages
     */
    messages: {
        required: 'To pole jest wymagane',
        minLength: (min) => `Minimalna długość to ${min} znaków`,
        maxLength: (max) => `Maksymalna długość to ${max} znaków`,
        email: 'Podaj prawidłowy adres email',
        nip: 'Podaj prawidłowy NIP (format: XXX-XXX-XX-XX)',
        phone: 'Podaj prawidłowy numer telefonu',
        date: 'Podaj prawidłową datę',
        dateRange: 'Data końcowa musi być późniejsza niż początkowa',
        number: 'Podaj prawidłową liczbę',
        temperature: 'Temperatura musi być między -50°C a 150°C',
        positiveNumber: 'Podaj liczbę większą od zera',
        url: 'Podaj prawidłowy adres URL',
        fileSize: (max) => `Maksymalny rozmiar pliku to ${max}`,
        fileType: (types) => `Dozwolone typy plików: ${types.join(', ')}`
    },

    /**
     * Check if value is not empty
     * @param {*} value - Value to check
     * @returns {boolean} Is valid
     */
    required(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    },

    /**
     * Check minimum length
     * @param {string} value - Value to check
     * @param {number} min - Minimum length
     * @returns {boolean} Is valid
     */
    minLength(value, min) {
        return String(value).trim().length >= min;
    },

    /**
     * Check maximum length
     * @param {string} value - Value to check
     * @param {number} max - Maximum length
     * @returns {boolean} Is valid
     */
    maxLength(value, max) {
        return String(value).trim().length <= max;
    },

    /**
     * Validate email format
     * @param {string} value - Value to check
     * @returns {boolean} Is valid
     */
    email(value) {
        if (!value) return true;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    },

    /**
     * Validate Polish NIP
     * @param {string} value - Value to check
     * @returns {boolean} Is valid
     */
    nip(value) {
        if (!value) return true;
        const cleaned = value.replace(/[-\s]/g, '');
        if (!/^\d{10}$/.test(cleaned)) return false;

        const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned[i]) * weights[i];
        }
        const checksum = sum % 11;
        return checksum === parseInt(cleaned[9]);
    },

    /**
     * Validate Polish phone number
     * @param {string} value - Value to check
     * @returns {boolean} Is valid
     */
    phone(value) {
        if (!value) return true;
        const cleaned = value.replace(/[\s-+()]/g, '');
        return /^(\d{9}|48\d{9})$/.test(cleaned);
    },

    /**
     * Validate date format
     * @param {string} value - Value to check
     * @returns {boolean} Is valid
     */
    date(value) {
        if (!value) return true;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
    },

    /**
     * Validate date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {boolean} Is valid
     */
    dateRange(startDate, endDate) {
        if (!startDate || !endDate) return true;
        return new Date(startDate) <= new Date(endDate);
    },

    /**
     * Validate number
     * @param {*} value - Value to check
     * @returns {boolean} Is valid
     */
    number(value) {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * Validate temperature range
     * @param {number} value - Value to check
     * @param {number} min - Minimum temperature
     * @param {number} max - Maximum temperature
     * @returns {boolean} Is valid
     */
    temperature(value, min = -50, max = 150) {
        if (!this.number(value)) return false;
        const temp = parseFloat(value);
        return temp >= min && temp <= max;
    },

    /**
     * Validate positive number
     * @param {*} value - Value to check
     * @returns {boolean} Is valid
     */
    positiveNumber(value) {
        if (!this.number(value)) return false;
        return parseFloat(value) > 0;
    },

    /**
     * Validate URL
     * @param {string} value - Value to check
     * @returns {boolean} Is valid
     */
    url(value) {
        if (!value) return true;
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate file size
     * @param {File} file - File to check
     * @param {number} maxSize - Maximum size in bytes
     * @returns {boolean} Is valid
     */
    fileSize(file, maxSize) {
        if (!file) return true;
        return file.size <= maxSize;
    },

    /**
     * Validate file type
     * @param {File} file - File to check
     * @param {string[]} allowedTypes - Allowed MIME types
     * @returns {boolean} Is valid
     */
    fileType(file, allowedTypes) {
        if (!file) return true;
        return allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });
    },

    /**
     * Validate form fields
     * @param {Object} fields - Object with field values
     * @param {Object} rules - Validation rules
     * @returns {Object} { isValid: boolean, errors: Object }
     */
    validateForm(fields, rules) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const value = fields[fieldName];
            const fieldErrors = [];

            for (const rule of fieldRules) {
                let valid = true;
                let message = '';

                if (typeof rule === 'string') {
                    // Simple rule like 'required', 'email'
                    if (rule === 'required') {
                        valid = this.required(value);
                        message = this.messages.required;
                    } else if (rule === 'email') {
                        valid = this.email(value);
                        message = this.messages.email;
                    } else if (rule === 'nip') {
                        valid = this.nip(value);
                        message = this.messages.nip;
                    } else if (rule === 'date') {
                        valid = this.date(value);
                        message = this.messages.date;
                    } else if (rule === 'number') {
                        valid = this.number(value);
                        message = this.messages.number;
                    }
                } else if (typeof rule === 'object') {
                    // Complex rule like { minLength: 3 }
                    const [ruleName, ruleValue] = Object.entries(rule)[0];

                    if (ruleName === 'minLength') {
                        valid = this.minLength(value, ruleValue);
                        message = this.messages.minLength(ruleValue);
                    } else if (ruleName === 'maxLength') {
                        valid = this.maxLength(value, ruleValue);
                        message = this.messages.maxLength(ruleValue);
                    } else if (ruleName === 'temperature') {
                        valid = this.temperature(value, ruleValue.min, ruleValue.max);
                        message = this.messages.temperature;
                    } else if (ruleName === 'custom') {
                        valid = ruleValue.validator(value, fields);
                        message = ruleValue.message;
                    }
                }

                if (!valid) {
                    fieldErrors.push(message);
                    isValid = false;
                }
            }

            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
            }
        }

        return { isValid, errors };
    },

    /**
     * Show validation errors on form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} errors - Errors object
     */
    showFormErrors(form, errors) {
        // Clear previous errors
        form.querySelectorAll('.form-error').forEach(el => el.remove());
        form.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));

        // Show new errors
        for (const [fieldName, messages] of Object.entries(errors)) {
            const input = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (input) {
                input.classList.add('error');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'form-error';
                errorDiv.setAttribute('role', 'alert');
                errorDiv.textContent = messages[0];
                input.parentNode.appendChild(errorDiv);
            }
        }
    },

    /**
     * Clear form errors
     * @param {HTMLFormElement} form - Form element
     */
    clearFormErrors(form) {
        form.querySelectorAll('.form-error').forEach(el => el.remove());
        form.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    },

    /**
     * Setup real-time validation
     * @param {HTMLFormElement} form - Form element
     * @param {Object} rules - Validation rules
     * @param {Function} onChange - Callback when validation changes
     * @returns {Function} Cleanup function
     */
    setupRealTimeValidation(form, rules, onChange) {
        const validate = Utils.debounce(() => {
            const formData = new FormData(form);
            const fields = Object.fromEntries(formData.entries());
            const result = this.validateForm(fields, rules);
            this.showFormErrors(form, result.errors);
            if (onChange) onChange(result);
        }, 300);

        form.addEventListener('input', validate);
        form.addEventListener('change', validate);

        return () => {
            form.removeEventListener('input', validate);
            form.removeEventListener('change', validate);
        };
    }
};

// Freeze Validators object
Object.freeze(Validators);
Object.freeze(Validators.messages);

// Export for ES6 modules (future use)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
