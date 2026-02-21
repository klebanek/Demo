import { CONFIG } from "./config.js";
import { Utils } from "./utils.js";
/**
 * INOVIT HACCP - Modal Module
 * @module modal
 * @description Modal dialog system with accessibility support
 */

export const Modal = {
    /**
     * Active modal stack
     */
    stack: [],

    /**
     * Previous focus element
     */
    previousFocus: null,

    /**
     * Focus trap cleanup function
     */
    focusTrapCleanup: null,

    /**
     * Initialize modal system
     */
    init() {
        // Keyboard handler
        document.addEventListener('keydown', (e) => {
            if (e.key === CONFIG.KEYBOARD.ESCAPE && this.stack.length > 0) {
                const topModal = this.stack[this.stack.length - 1];
                if (topModal.closable !== false) {
                    this.close();
                }
            }
        });
    },

    /**
     * Open modal
     * @param {Object} options - Modal options
     * @returns {string} Modal ID
     */
    open(options = {}) {
        const {
            title = '',
            content = '',
            footer = '',
            size = 'medium', // small, medium, large, full
            closable = true,
            onClose = null,
            onOpen = null,
            className = ''
        } = options;

        const id = Utils.generateId();

        // Save current focus
        if (this.stack.length === 0) {
            this.previousFocus = document.activeElement;
        }

        // Get or create overlay
        let overlay = document.getElementById('modal-overlay');
        if (!overlay) {
            overlay = this.createOverlay();
        }

        // Get modal element
        const modal = overlay.querySelector('.modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');

        // Set content
        modalTitle.textContent = title;

        if (typeof content === 'string') {
            modalBody.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            modalBody.innerHTML = '';
            modalBody.appendChild(content);
        }

        if (typeof footer === 'string') {
            modalFooter.innerHTML = footer;
        } else if (footer instanceof HTMLElement) {
            modalFooter.innerHTML = '';
            modalFooter.appendChild(footer);
        }

        // Set size
        modal.className = `modal modal-${size} ${className}`.trim();

        // Configure close button
        const closeBtn = overlay.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.style.display = closable ? 'flex' : 'none';
        }

        // Show modal
        overlay.classList.add(CONFIG.CSS.MODAL_ACTIVE);
        document.body.style.overflow = 'hidden';

        // Set ARIA attributes
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');

        // Setup focus trap
        this.focusTrapCleanup = Utils.trapFocus(modal);

        // Add to stack
        this.stack.push({ id, onClose, closable });

        // Callback
        if (onOpen) {
            requestAnimationFrame(() => onOpen(modal));
        }

        return id;
    },

    /**
     * Create modal overlay if not exists
     * @private
     */
    createOverlay() {
        const overlay = Utils.createElement('div', {
            id: 'modal-overlay',
            className: 'modal-overlay',
            onClick: (e) => {
                if (e.target === e.currentTarget) {
                    const topModal = this.stack[this.stack.length - 1];
                    if (topModal?.closable !== false) {
                        this.close();
                    }
                }
            }
        });

        const modal = Utils.createElement('div', {
            className: 'modal',
            onClick: (e) => e.stopPropagation()
        });

        const header = Utils.createElement('div', { className: 'modal-header' });
        const title = Utils.createElement('h3', { id: 'modal-title' });
        const closeBtn = Utils.createElement('button', {
            className: 'modal-close',
            onClick: () => this.close(),
            aria: { label: 'Zamknij' }
        });
        closeBtn.innerHTML = '&times;';

        header.appendChild(title);
        header.appendChild(closeBtn);

        const body = Utils.createElement('div', {
            id: 'modal-body',
            className: 'modal-body'
        });

        const footer = Utils.createElement('div', {
            id: 'modal-footer',
            className: 'modal-footer'
        });

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        return overlay;
    },

    /**
     * Close modal
     * @param {string} id - Optional modal ID to close
     */
    close(id = null) {
        if (this.stack.length === 0) return;

        const modalData = id
            ? this.stack.find(m => m.id === id)
            : this.stack[this.stack.length - 1];

        if (!modalData) return;

        // Callback
        if (modalData.onClose) {
            modalData.onClose();
        }

        // Remove from stack
        const index = this.stack.indexOf(modalData);
        if (index > -1) {
            this.stack.splice(index, 1);
        }

        // Clean up focus trap
        if (this.focusTrapCleanup) {
            this.focusTrapCleanup();
            this.focusTrapCleanup = null;
        }

        // Hide modal if no more in stack
        if (this.stack.length === 0) {
            const overlay = document.getElementById('modal-overlay');
            if (overlay) {
                overlay.classList.remove(CONFIG.CSS.MODAL_ACTIVE);
            }
            document.body.style.overflow = '';

            // Restore focus
            if (this.previousFocus) {
                this.previousFocus.focus();
                this.previousFocus = null;
            }
        }
    },

    /**
     * Close all modals
     */
    closeAll() {
        while (this.stack.length > 0) {
            this.close();
        }
    },

    /**
     * Update modal content
     * @param {Object} options - Update options
     */
    update(options = {}) {
        const { title, content, footer } = options;

        if (title !== undefined) {
            const modalTitle = document.getElementById('modal-title');
            if (modalTitle) modalTitle.textContent = title;
        }

        if (content !== undefined) {
            const modalBody = document.getElementById('modal-body');
            if (modalBody) {
                if (typeof content === 'string') {
                    modalBody.innerHTML = content;
                } else if (content instanceof HTMLElement) {
                    modalBody.innerHTML = '';
                    modalBody.appendChild(content);
                }
            }
        }

        if (footer !== undefined) {
            const modalFooter = document.getElementById('modal-footer');
            if (modalFooter) {
                if (typeof footer === 'string') {
                    modalFooter.innerHTML = footer;
                } else if (footer instanceof HTMLElement) {
                    modalFooter.innerHTML = '';
                    modalFooter.appendChild(footer);
                }
            }
        }
    },

    /**
     * Show alert modal
     * @param {string} message - Alert message
     * @param {Object} options - Options
     * @returns {Promise<void>}
     */
    alert(message, options = {}) {
        return new Promise(resolve => {
            const { title = 'Informacja', buttonText = 'OK' } = options;

            this.open({
                title,
                content: `<div class="modal-alert-message">${Utils.escapeHtml(message)}</div>`,
                footer: `
                    <button class="btn btn-primary" onclick="Modal.close(); ${options.onClose ? '' : ''}">
                        ${Utils.escapeHtml(buttonText)}
                    </button>
                `,
                size: 'small',
                onClose: resolve
            });
        });
    },

    /**
     * Show confirm modal
     * @param {string} message - Confirm message
     * @param {Object} options - Options
     * @returns {Promise<boolean>}
     */
    confirm(message, options = {}) {
        return new Promise(resolve => {
            const {
                title = 'Potwierdzenie',
                confirmText = 'Tak',
                cancelText = 'Anuluj',
                confirmClass = 'btn-danger',
                icon = 'fas fa-question-circle'
            } = options;

            this.open({
                title,
                content: `
                    <div class="modal-confirm">
                        <i class="${icon} modal-confirm-icon"></i>
                        <p>${Utils.escapeHtml(message)}</p>
                    </div>
                `,
                footer: `
                    <button class="btn btn-secondary" id="modal-cancel">
                        ${Utils.escapeHtml(cancelText)}
                    </button>
                    <button class="btn ${confirmClass}" id="modal-confirm">
                        ${Utils.escapeHtml(confirmText)}
                    </button>
                `,
                size: 'small',
                onOpen: () => {
                    document.getElementById('modal-cancel').onclick = () => {
                        this.close();
                        resolve(false);
                    };
                    document.getElementById('modal-confirm').onclick = () => {
                        this.close();
                        resolve(true);
                    };
                },
                onClose: () => resolve(false)
            });
        });
    },

    /**
     * Show prompt modal
     * @param {string} message - Prompt message
     * @param {Object} options - Options
     * @returns {Promise<string|null>}
     */
    prompt(message, options = {}) {
        return new Promise(resolve => {
            const {
                title = 'Wprowadź wartość',
                placeholder = '',
                defaultValue = '',
                confirmText = 'OK',
                cancelText = 'Anuluj',
                inputType = 'text',
                required = false,
                validation = null
            } = options;

            const inputId = 'modal-prompt-input';

            this.open({
                title,
                content: `
                    <div class="modal-prompt">
                        <label for="${inputId}">${Utils.escapeHtml(message)}</label>
                        <input
                            type="${inputType}"
                            id="${inputId}"
                            class="form-control"
                            placeholder="${Utils.escapeHtml(placeholder)}"
                            value="${Utils.escapeHtml(defaultValue)}"
                            ${required ? 'required' : ''}
                        >
                        <div id="modal-prompt-error" class="form-error" style="display: none;"></div>
                    </div>
                `,
                footer: `
                    <button class="btn btn-secondary" id="modal-cancel">
                        ${Utils.escapeHtml(cancelText)}
                    </button>
                    <button class="btn btn-primary" id="modal-confirm">
                        ${Utils.escapeHtml(confirmText)}
                    </button>
                `,
                size: 'small',
                onOpen: () => {
                    const input = document.getElementById(inputId);
                    const errorEl = document.getElementById('modal-prompt-error');

                    input.focus();
                    input.select();

                    const submit = () => {
                        const value = input.value.trim();

                        if (required && !value) {
                            errorEl.textContent = 'To pole jest wymagane';
                            errorEl.style.display = 'block';
                            input.focus();
                            return;
                        }

                        if (validation) {
                            const error = validation(value);
                            if (error) {
                                errorEl.textContent = error;
                                errorEl.style.display = 'block';
                                input.focus();
                                return;
                            }
                        }

                        this.close();
                        resolve(value);
                    };

                    document.getElementById('modal-cancel').onclick = () => {
                        this.close();
                        resolve(null);
                    };

                    document.getElementById('modal-confirm').onclick = submit;

                    input.onkeydown = (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            submit();
                        }
                    };

                    input.oninput = () => {
                        errorEl.style.display = 'none';
                    };
                },
                onClose: () => resolve(null)
            });
        });
    },

    /**
     * Show form modal
     * @param {string} title - Modal title
     * @param {string} formHtml - Form HTML content
     * @param {Object} options - Options
     * @returns {Promise<Object|null>}
     */
    form(title, formHtml, options = {}) {
        return new Promise(resolve => {
            const {
                confirmText = 'Zapisz',
                cancelText = 'Anuluj',
                size = 'medium',
                validation = null,
                onOpen = null
            } = options;

            this.open({
                title,
                content: `<form id="modal-form">${formHtml}</form>`,
                footer: `
                    <button type="button" class="btn btn-secondary" id="modal-cancel">
                        <i class="fas fa-times"></i> ${Utils.escapeHtml(cancelText)}
                    </button>
                    <button type="submit" form="modal-form" class="btn btn-success" id="modal-submit">
                        <i class="fas fa-save"></i> ${Utils.escapeHtml(confirmText)}
                    </button>
                `,
                size,
                onOpen: (modal) => {
                    const form = document.getElementById('modal-form');

                    document.getElementById('modal-cancel').onclick = () => {
                        this.close();
                        resolve(null);
                    };

                    form.onsubmit = (e) => {
                        e.preventDefault();

                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());

                        // Handle checkboxes
                        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            data[cb.name] = cb.checked;
                        });

                        if (validation) {
                            const result = validation(data);
                            if (result !== true) {
                                Validators.showFormErrors(form, result);
                                return;
                            }
                        }

                        resolve(data);
                        this.close();
                    };

                    if (onOpen) onOpen(form);
                },
                onClose: () => resolve(null)
            });
        });
    },

    /**
     * Show loading modal
     * @param {string} message - Loading message
     * @returns {Object} Control object
     */
    loading(message = 'Ładowanie...') {
        const id = this.open({
            title: '',
            content: `
                <div class="modal-loading">
                    <div class="spinner"></div>
                    <p id="modal-loading-text">${Utils.escapeHtml(message)}</p>
                </div>
            `,
            footer: '',
            size: 'small',
            closable: false
        });

        return {
            update: (newMessage) => {
                const textEl = document.getElementById('modal-loading-text');
                if (textEl) textEl.textContent = newMessage;
            },
            close: () => this.close(id)
        };
    }
};

// Legacy support functions
function openModal(title, bodyContent, footerContent) {
    Modal.open({
        title,
        content: bodyContent,
        footer: footerContent
    });
}

function closeModal() {
    Modal.close();
}

function closeModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        Modal.close();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => Modal.init());

