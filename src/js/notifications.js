import { CONFIG } from "./config.js";
import { Utils } from "./utils.js";
/**
 * INOVIT HACCP - Notifications Module
 * @module notifications
 * @description Toast notifications and alert system
 */

export const Notifications = {
    /**
     * Container element for notifications
     */
    container: null,

    /**
     * Active notifications
     */
    active: [],

    /**
     * Initialize notifications system
     */
    init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.className = 'notifications-container';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Powiadomienia');
        this.container.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.container);
    },

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    show(message, type = 'info', options = {}) {
        this.init();

        const {
            duration = CONFIG.UI.NOTIFICATION_DURATION,
            closable = true,
            icon = this.getIcon(type),
            title = null,
            actions = []
        } = options;

        const id = Utils.generateId();
        const notification = this.createNotification(id, message, type, {
            icon,
            title,
            closable,
            actions
        });

        this.container.appendChild(notification);
        this.active.push({ id, element: notification });

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Announce to screen readers
        Utils.announce(message, type === 'error' ? 'assertive' : 'polite');

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }

        return id;
    },

    /**
     * Create notification element
     * @private
     */
    createNotification(id, message, type, options) {
        const { icon, title, closable, actions } = options;

        const notification = Utils.createElement('div', {
            id: `notification-${id}`,
            className: `notification notification-${type}`,
            role: 'alert',
            aria: { atomic: 'true' }
        });

        // Icon
        if (icon) {
            const iconEl = Utils.createElement('div', { className: 'notification-icon' });
            iconEl.innerHTML = `<i class="${icon}"></i>`;
            notification.appendChild(iconEl);
        }

        // Content
        const content = Utils.createElement('div', { className: 'notification-content' });

        if (title) {
            const titleEl = Utils.createElement('div', { className: 'notification-title' }, title);
            content.appendChild(titleEl);
        }

        const messageEl = Utils.createElement('div', { className: 'notification-message' }, message);
        content.appendChild(messageEl);

        // Actions
        if (actions.length > 0) {
            const actionsContainer = Utils.createElement('div', { className: 'notification-actions' });
            actions.forEach(action => {
                const btn = Utils.createElement('button', {
                    className: 'notification-action',
                    onClick: () => {
                        action.handler();
                        if (action.dismiss !== false) this.dismiss(id);
                    }
                }, action.label);
                actionsContainer.appendChild(btn);
            });
            content.appendChild(actionsContainer);
        }

        notification.appendChild(content);

        // Close button
        if (closable) {
            const closeBtn = Utils.createElement('button', {
                className: 'notification-close',
                onClick: () => this.dismiss(id),
                aria: { label: 'Zamknij powiadomienie' }
            });
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            notification.appendChild(closeBtn);
        }

        // Progress bar for timed notifications
        if (CONFIG.UI.NOTIFICATION_DURATION > 0) {
            const progress = Utils.createElement('div', { className: 'notification-progress' });
            progress.style.animationDuration = `${CONFIG.UI.NOTIFICATION_DURATION}ms`;
            notification.appendChild(progress);
        }

        return notification;
    },

    /**
     * Get icon for notification type
     * @private
     */
    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    /**
     * Dismiss notification
     * @param {string} id - Notification ID
     */
    dismiss(id) {
        const index = this.active.findIndex(n => n.id === id);
        if (index === -1) return;

        const { element } = this.active[index];
        element.classList.remove('show');
        element.classList.add('hide');

        setTimeout(() => {
            element.remove();
            this.active.splice(index, 1);
        }, CONFIG.UI.ANIMATION_DURATION);
    },

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        [...this.active].forEach(n => this.dismiss(n.id));
    },

    /**
     * Show success notification
     * @param {string} message - Message
     * @param {Object} options - Options
     * @returns {string} Notification ID
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    },

    /**
     * Show error notification
     * @param {string} message - Message
     * @param {Object} options - Options
     * @returns {string} Notification ID
     */
    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: 5000 });
    },

    /**
     * Show warning notification
     * @param {string} message - Message
     * @param {Object} options - Options
     * @returns {string} Notification ID
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    },

    /**
     * Show info notification
     * @param {string} message - Message
     * @param {Object} options - Options
     * @returns {string} Notification ID
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    },

    /**
     * Show confirmation dialog
     * @param {string} message - Message
     * @param {Object} options - Options
     * @returns {Promise<boolean>} User choice
     */
    confirm(message, options = {}) {
        return new Promise(resolve => {
            const {
                title = 'Potwierdzenie',
                confirmText = 'Tak',
                cancelText = 'Nie',
                type = 'warning'
            } = options;

            this.show(message, type, {
                title,
                duration: 0,
                closable: false,
                actions: [
                    {
                        label: cancelText,
                        handler: () => resolve(false)
                    },
                    {
                        label: confirmText,
                        handler: () => resolve(true)
                    }
                ]
            });
        });
    },

    /**
     * Show loading notification
     * @param {string} message - Message
     * @returns {Object} Control object with dismiss method
     */
    loading(message = 'Ładowanie...') {
        const id = this.show(message, 'info', {
            duration: 0,
            closable: false,
            icon: 'fas fa-spinner fa-spin'
        });

        return {
            id,
            dismiss: () => this.dismiss(id),
            update: (newMessage) => {
                const notification = document.getElementById(`notification-${id}`);
                if (notification) {
                    const messageEl = notification.querySelector('.notification-message');
                    if (messageEl) messageEl.textContent = newMessage;
                }
            },
            success: (message) => {
                this.dismiss(id);
                this.success(message);
            },
            error: (message) => {
                this.dismiss(id);
                this.error(message);
            }
        };
    }
};

// Legacy support - alias for old showNotification function
