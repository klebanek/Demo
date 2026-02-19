import { CONFIG } from "./config.js";
import { Utils } from "./utils.js";
import { storage } from "./storage.js";
import { Notifications } from "./notifications.js";
import { Modal } from "./modal.js";
/**
 * INOVIT HACCP - Reminders Module
 * @module reminders
 * @description System for managing reminders and notifications
 */

export const Reminders = {
    /**
     * Storage key
     */
    storeName: 'reminders',

    /**
     * Check interval (in milliseconds)
     */
    checkInterval: 60000, // 1 minute

    /**
     * Interval ID
     */
    intervalId: null,

    /**
     * Notification permission
     */
    notificationPermission: 'default',

    /**
     * Reminder types
     */
    types: {
        TEMPERATURE: { id: 'temperature', label: 'Pomiar temperatury', icon: 'fa-thermometer-half', color: '#17a2b8' },
        AUDIT: { id: 'audit', label: 'Audyt', icon: 'fa-clipboard-check', color: '#007380' },
        TRAINING: { id: 'training', label: 'Szkolenie', icon: 'fa-graduation-cap', color: '#28a745' },
        TEST: { id: 'test', label: 'Badanie laboratoryjne', icon: 'fa-flask', color: '#6f42c1' },
        DELIVERY: { id: 'delivery', label: 'Dostawa', icon: 'fa-truck', color: '#fd7e14' },
        CUSTOM: { id: 'custom', label: 'Inne', icon: 'fa-bell', color: '#6c757d' }
    },

    /**
     * Initialize reminders system
     */
    async init() {
        console.log('[Reminders] Initializing...');

        // Request notification permission
        await this.requestNotificationPermission();

        // Start periodic check
        this.startPeriodicCheck();

        // Check immediately
        await this.checkReminders();
        await this.updateBadge();

        console.log('[Reminders] Initialized');
    },

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('[Reminders] Notifications not supported');
            return;
        }

        if (Notification.permission === 'granted') {
            this.notificationPermission = 'granted';
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
        } else {
            this.notificationPermission = 'denied';
        }
    },

    /**
     * Start periodic reminder check
     */
    startPeriodicCheck() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(() => {
            this.checkReminders();
        }, this.checkInterval);
    },

    /**
     * Stop periodic check
     */
    stopPeriodicCheck() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    /**
     * Load all reminders
     * @returns {Promise<Array>}
     */
    async load() {
        const reminders = await storage.load(this.storeName) || [];
        return reminders;
    },

    /**
     * Save reminders
     * @param {Array} reminders
     */
    async save(reminders) {
        await storage.save(this.storeName, reminders);
        await this.updateBadge();
    },

    /**
     * Add new reminder
     * @param {Object} reminder
     */
    async add(reminder) {
        const reminders = await this.load();

        const newReminder = {
            id: Utils.generateId(),
            type: reminder.type || 'custom',
            title: reminder.title,
            description: reminder.description || '',
            datetime: reminder.datetime,
            repeat: reminder.repeat || 'none', // none, daily, weekly, monthly
            enabled: true,
            notified: false,
            createdAt: new Date().toISOString()
        };

        reminders.push(newReminder);
        await this.save(reminders);

        Notifications.success('Przypomnienie zostało dodane');
        return newReminder;
    },

    /**
     * Update reminder
     * @param {string} id
     * @param {Object} updates
     */
    async update(id, updates) {
        const reminders = await this.load();
        const index = reminders.findIndex(r => r.id === id);

        if (index !== -1) {
            reminders[index] = { ...reminders[index], ...updates };
            await this.save(reminders);
            return true;
        }
        return false;
    },

    /**
     * Delete reminder
     * @param {string} id
     */
    async delete(id) {
        let reminders = await this.load();
        reminders = reminders.filter(r => r.id !== id);
        await this.save(reminders);
    },

    /**
     * Toggle reminder enabled state
     * @param {string} id
     */
    async toggle(id) {
        const reminders = await this.load();
        const reminder = reminders.find(r => r.id === id);

        if (reminder) {
            reminder.enabled = !reminder.enabled;
            await this.save(reminders);
        }
    },

    /**
     * Check for due reminders
     */
    async checkReminders() {
        const reminders = await this.load();
        const now = new Date();
        let updated = false;

        for (const reminder of reminders) {
            if (!reminder.enabled || reminder.notified) continue;

            const reminderTime = new Date(reminder.datetime);

            // Check if reminder is due (within last 5 minutes)
            if (reminderTime <= now && (now - reminderTime) < 5 * 60 * 1000) {
                await this.triggerReminder(reminder);
                reminder.notified = true;
                updated = true;

                // Handle repeat
                if (reminder.repeat !== 'none') {
                    const nextTime = this.calculateNextTime(reminderTime, reminder.repeat);
                    reminder.datetime = nextTime.toISOString();
                    reminder.notified = false;
                }
            }
        }

        if (updated) {
            await this.save(reminders);
        }
    },

    /**
     * Calculate next reminder time for repeating reminders
     * @param {Date} currentTime
     * @param {string} repeat
     * @returns {Date}
     */
    calculateNextTime(currentTime, repeat) {
        const next = new Date(currentTime);

        switch (repeat) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
        }

        return next;
    },

    /**
     * Trigger reminder notification
     * @param {Object} reminder
     */
    async triggerReminder(reminder) {
        const typeInfo = this.types[reminder.type.toUpperCase()] || this.types.CUSTOM;

        // In-app notification
        Notifications.show(reminder.title, 'info', {
            title: 'Przypomnienie',
            duration: 0, // Don't auto-dismiss
            icon: `fas ${typeInfo.icon}`,
            actions: [
                {
                    label: 'Odrzuć',
                    handler: () => {}
                },
                {
                    label: 'Odłóż (15 min)',
                    handler: () => this.snooze(reminder.id, 15)
                }
            ]
        });

        // Browser notification
        if (this.notificationPermission === 'granted') {
            try {
                const notification = new Notification('INOVIT HACCP - Przypomnienie', {
                    body: reminder.title,
                    icon: './icons/icon-192x192.svg',
                    badge: './icons/icon-72x72.svg',
                    tag: `reminder-${reminder.id}`,
                    requireInteraction: true,
                    data: { reminderId: reminder.id }
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.warn('[Reminders] Browser notification failed:', error);
            }
        }

        // Play sound (if available)
        this.playNotificationSound();
    },

    /**
     * Snooze reminder
     * @param {string} id
     * @param {number} minutes
     */
    async snooze(id, minutes) {
        const reminders = await this.load();
        const reminder = reminders.find(r => r.id === id);

        if (reminder) {
            const snoozeTime = new Date();
            snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
            reminder.datetime = snoozeTime.toISOString();
            reminder.notified = false;
            await this.save(reminders);
            Notifications.info(`Przypomnienie odłożone o ${minutes} minut`);
        }
    },

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            // Simple beep using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Ignore audio errors
        }
    },

    /**
     * Get upcoming reminders
     * @param {number} days - Number of days to look ahead
     * @returns {Promise<Array>}
     */
    async getUpcoming(days = 7) {
        const reminders = await this.load();
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);

        return reminders
            .filter(r => {
                if (!r.enabled) return false;
                const reminderTime = new Date(r.datetime);
                return reminderTime >= now && reminderTime <= cutoff;
            })
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    },

    /**
     * Get overdue reminders
     * @returns {Promise<Array>}
     */
    async getOverdue() {
        const reminders = await this.load();
        const now = new Date();

        return reminders
            .filter(r => {
                if (!r.enabled) return false;
                const reminderTime = new Date(r.datetime);
                return reminderTime < now && !r.notified;
            })
            .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    },

    /**
     * Auto-generate reminders from data
     */
    async generateFromData() {
        const loading = Notifications.loading('Generowanie przypomnień...');
        let added = 0;

        try {
            // From trainings
            const trainings = await storage.load('trainings') || [];
            for (const training of trainings) {
                if (training.status === 'Planowane' && training.date) {
                    const reminderDate = new Date(training.date);
                    reminderDate.setDate(reminderDate.getDate() - 1); // Day before
                    reminderDate.setHours(9, 0, 0, 0);

                    if (reminderDate > new Date()) {
                        await this.add({
                            type: 'training',
                            title: `Szkolenie: ${training.topic}`,
                            description: `Przypomnienie o planowanym szkoleniu`,
                            datetime: reminderDate.toISOString()
                        });
                        added++;
                    }
                }
            }

            // From audits
            const audits = await storage.load('audits') || [];
            for (const audit of audits) {
                if (audit.result === 'Planowany' && audit.date) {
                    const reminderDate = new Date(audit.date);
                    reminderDate.setDate(reminderDate.getDate() - 3); // 3 days before
                    reminderDate.setHours(9, 0, 0, 0);

                    if (reminderDate > new Date()) {
                        await this.add({
                            type: 'audit',
                            title: `Audyt ${audit.type}: ${audit.area || 'cały zakład'}`,
                            description: `Przypomnienie o planowanym audycie`,
                            datetime: reminderDate.toISOString()
                        });
                        added++;
                    }
                }
            }

            // From tests
            const tests = await storage.load('tests') || [];
            for (const test of tests) {
                if (test.nextTest) {
                    const reminderDate = new Date(test.nextTest);
                    reminderDate.setDate(reminderDate.getDate() - 7); // Week before
                    reminderDate.setHours(9, 0, 0, 0);

                    if (reminderDate > new Date()) {
                        await this.add({
                            type: 'test',
                            title: `Badanie ${test.type}: ${test.material}`,
                            description: `Zbliża się termin badania laboratoryjnego`,
                            datetime: reminderDate.toISOString()
                        });
                        added++;
                    }
                }
            }

            loading.success(`Dodano ${added} przypomnień`);

        } catch (error) {
            console.error('[Reminders] Generation error:', error);
            loading.error('Błąd podczas generowania przypomnień');
        }
    },

    /**
     * Show reminders panel
     */
    async showPanel() {
        const reminders = await this.load();
        const upcoming = await this.getUpcoming(7);
        const overdue = await this.getOverdue();

        const formatDateTime = (datetime) => {
            const d = new Date(datetime);
            return `${Utils.formatDate(d)} ${d.toTimeString().substring(0, 5)}`;
        };

        const renderReminder = (r) => {
            const typeInfo = this.types[r.type.toUpperCase()] || this.types.CUSTOM;
            const isOverdue = new Date(r.datetime) < new Date();

            return `
                <div class="reminder-item ${isOverdue ? 'overdue' : ''} ${!r.enabled ? 'disabled' : ''}">
                    <div class="reminder-icon" style="background-color: ${typeInfo.color}">
                        <i class="fas ${typeInfo.icon}"></i>
                    </div>
                    <div class="reminder-content">
                        <div class="reminder-title">${Utils.escapeHtml(r.title)}</div>
                        <div class="reminder-time">
                            <i class="far fa-clock"></i> ${formatDateTime(r.datetime)}
                            ${r.repeat !== 'none' ? `<span class="reminder-repeat"><i class="fas fa-redo"></i> ${r.repeat}</span>` : ''}
                        </div>
                    </div>
                    <div class="reminder-actions">
                        <button class="btn btn-small" onclick="Reminders.edit('${r.id}')" title="Edytuj">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="Reminders.confirmDelete('${r.id}')" title="Usuń">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        };

        Modal.open({
            title: 'Przypomnienia',
            content: `
                <div class="reminders-panel">
                    <div class="reminders-header">
                        <div class="reminders-stats">
                            <span class="stat"><i class="fas fa-bell"></i> ${reminders.filter(r => r.enabled).length} aktywnych</span>
                            ${overdue.length > 0 ? `<span class="stat overdue"><i class="fas fa-exclamation-circle"></i> ${overdue.length} zaległych</span>` : ''}
                        </div>
                        <div class="reminders-actions">
                            <button class="btn btn-small" onclick="Reminders.showAddForm()">
                                <i class="fas fa-plus"></i> Dodaj
                            </button>
                            <button class="btn btn-small" onclick="Reminders.generateFromData()">
                                <i class="fas fa-magic"></i> Generuj
                            </button>
                        </div>
                    </div>

                    ${overdue.length > 0 ? `
                        <div class="reminders-section">
                            <h4 class="section-title overdue"><i class="fas fa-exclamation-triangle"></i> Zaległe</h4>
                            <div class="reminders-list">
                                ${overdue.map(renderReminder).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="reminders-section">
                        <h4 class="section-title"><i class="fas fa-calendar-alt"></i> Nadchodzące (7 dni)</h4>
                        <div class="reminders-list">
                            ${upcoming.length > 0
                                ? upcoming.map(renderReminder).join('')
                                : '<p class="empty-message">Brak nadchodzących przypomnień</p>'
                            }
                        </div>
                    </div>

                    ${reminders.filter(r => !r.enabled).length > 0 ? `
                        <div class="reminders-section">
                            <h4 class="section-title disabled"><i class="fas fa-pause-circle"></i> Wstrzymane</h4>
                            <div class="reminders-list">
                                ${reminders.filter(r => !r.enabled).map(renderReminder).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `,
            footer: `<button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>`,
            size: 'large'
        });
    },

    /**
     * Show add reminder form
     */
    showAddForm() {
        const typeOptions = Object.values(this.types)
            .map(t => `<option value="${t.id}">${t.label}</option>`)
            .join('');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const defaultDateTime = tomorrow.toISOString().slice(0, 16);

        Modal.open({
            title: 'Nowe przypomnienie',
            content: `
                <form id="reminder-form">
                    <div class="form-group">
                        <label for="reminder-type">Typ przypomnienia</label>
                        <select id="reminder-type" name="type" class="form-control">
                            ${typeOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reminder-title">Tytuł <span class="required">*</span></label>
                        <input type="text" id="reminder-title" name="title" class="form-control"
                            placeholder="np. Pomiar temperatury lodówki" required>
                    </div>
                    <div class="form-group">
                        <label for="reminder-description">Opis</label>
                        <textarea id="reminder-description" name="description" class="form-control" rows="2"
                            placeholder="Dodatkowe informacje..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reminder-datetime">Data i godzina <span class="required">*</span></label>
                            <input type="datetime-local" id="reminder-datetime" name="datetime" class="form-control"
                                value="${defaultDateTime}" required>
                        </div>
                        <div class="form-group">
                            <label for="reminder-repeat">Powtarzaj</label>
                            <select id="reminder-repeat" name="repeat" class="form-control">
                                <option value="none">Nie powtarzaj</option>
                                <option value="daily">Codziennie</option>
                                <option value="weekly">Co tydzień</option>
                                <option value="monthly">Co miesiąc</option>
                            </select>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Reminders.showPanel()">Anuluj</button>
                <button type="submit" form="reminder-form" class="btn btn-success">
                    <i class="fas fa-plus"></i> Dodaj
                </button>
            `,
            onOpen: () => {
                document.getElementById('reminder-form').onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());

                    if (!data.title) {
                        Notifications.warning('Wprowadź tytuł przypomnienia');
                        return;
                    }

                    await this.add(data);
                    this.showPanel();
                };
            }
        });
    },

    /**
     * Edit reminder
     * @param {string} id
     */
    async edit(id) {
        const reminders = await this.load();
        const reminder = reminders.find(r => r.id === id);

        if (!reminder) {
            Notifications.error('Nie znaleziono przypomnienia');
            return;
        }

        const typeOptions = Object.values(this.types)
            .map(t => `<option value="${t.id}" ${reminder.type === t.id ? 'selected' : ''}>${t.label}</option>`)
            .join('');

        const datetime = new Date(reminder.datetime).toISOString().slice(0, 16);

        Modal.open({
            title: 'Edytuj przypomnienie',
            content: `
                <form id="reminder-form">
                    <div class="form-group">
                        <label for="reminder-type">Typ przypomnienia</label>
                        <select id="reminder-type" name="type" class="form-control">
                            ${typeOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reminder-title">Tytuł <span class="required">*</span></label>
                        <input type="text" id="reminder-title" name="title" class="form-control"
                            value="${Utils.escapeHtml(reminder.title)}" required>
                    </div>
                    <div class="form-group">
                        <label for="reminder-description">Opis</label>
                        <textarea id="reminder-description" name="description" class="form-control" rows="2">${Utils.escapeHtml(reminder.description || '')}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reminder-datetime">Data i godzina <span class="required">*</span></label>
                            <input type="datetime-local" id="reminder-datetime" name="datetime" class="form-control"
                                value="${datetime}" required>
                        </div>
                        <div class="form-group">
                            <label for="reminder-repeat">Powtarzaj</label>
                            <select id="reminder-repeat" name="repeat" class="form-control">
                                <option value="none" ${reminder.repeat === 'none' ? 'selected' : ''}>Nie powtarzaj</option>
                                <option value="daily" ${reminder.repeat === 'daily' ? 'selected' : ''}>Codziennie</option>
                                <option value="weekly" ${reminder.repeat === 'weekly' ? 'selected' : ''}>Co tydzień</option>
                                <option value="monthly" ${reminder.repeat === 'monthly' ? 'selected' : ''}>Co miesiąc</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="enabled" ${reminder.enabled ? 'checked' : ''}>
                            Przypomnienie aktywne
                        </label>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Reminders.showPanel()">Anuluj</button>
                <button type="submit" form="reminder-form" class="btn btn-success">
                    <i class="fas fa-save"></i> Zapisz
                </button>
            `,
            onOpen: () => {
                document.getElementById('reminder-form').onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.enabled = formData.get('enabled') === 'on';
                    data.notified = false; // Reset notified status

                    await this.update(id, data);
                    Notifications.success('Przypomnienie zostało zaktualizowane');
                    this.showPanel();
                };
            }
        });
    },

    /**
     * Confirm delete reminder
     * @param {string} id
     */
    async confirmDelete(id) {
        const confirmed = await Modal.confirm('Czy na pewno chcesz usunąć to przypomnienie?');

        if (confirmed) {
            await this.delete(id);
            Notifications.success('Przypomnienie zostało usunięte');
            this.showPanel();
        }
    },

    /**
     * Get reminders count for badge
     * @returns {Promise<number>}
     */
    async getActiveCount() {
        const reminders = await this.load();
        return reminders.filter(r => r.enabled).length;
    },

    /**
     * Update badge in header
     */
    async updateBadge() {
        const count = await this.getActiveCount();
        const badge = document.getElementById('reminders-badge');

        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';

            // Update ARIA label for accessibility
            const btn = badge.closest('button');
            if (btn) {
                const label = count > 0
                    ? `Przypomnienia, ${count} aktywnych`
                    : 'Przypomnienia';
                btn.setAttribute('aria-label', label);
            }
        }
    },

    /**
     * Display reminders in side panel
     */
    async display() {
        const listContainer = document.getElementById('reminders-list');
        if (!listContainer) return;

        const reminders = await this.load();
        const upcoming = await this.getUpcoming(7);
        const overdue = await this.getOverdue();

        // Update badge
        await this.updateBadge();

        const formatDateTime = (datetime) => {
            const d = new Date(datetime);
            return `${Utils.formatDate(d)} ${d.toTimeString().substring(0, 5)}`;
        };

        const renderReminder = (r) => {
            const typeInfo = this.types[r.type.toUpperCase()] || this.types.CUSTOM;
            const isOverdue = new Date(r.datetime) < new Date();

            return `
                <div class="reminder-item ${isOverdue ? 'overdue' : ''} ${!r.enabled ? 'disabled' : ''}">
                    <div class="reminder-icon" style="background-color: ${typeInfo.color}">
                        <i class="fas ${typeInfo.icon}"></i>
                    </div>
                    <div class="reminder-content">
                        <div class="reminder-title">${Utils.escapeHtml(r.title)}</div>
                        <div class="reminder-time">
                            <i class="far fa-clock"></i> ${formatDateTime(r.datetime)}
                        </div>
                    </div>
                    <button class="btn btn-small btn-icon" onclick="Reminders.confirmDelete('${r.id}'); event.stopPropagation();" title="Usuń">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        };

        let html = '';

        if (overdue.length > 0) {
            html += `
                <div class="reminders-section-title overdue">
                    <i class="fas fa-exclamation-triangle"></i> Zaległe (${overdue.length})
                </div>
                ${overdue.map(renderReminder).join('')}
            `;
        }

        if (upcoming.length > 0) {
            html += `
                <div class="reminders-section-title">
                    <i class="fas fa-calendar-alt"></i> Nadchodzące (${upcoming.length})
                </div>
                ${upcoming.map(renderReminder).join('')}
            `;
        }

        if (reminders.length === 0) {
            html = `
                <div class="reminders-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>Brak przypomnień</p>
                    <small>Kliknij "Nowe" aby dodać</small>
                </div>
            `;
        } else if (upcoming.length === 0 && overdue.length === 0) {
            html = `
                <div class="reminders-empty">
                    <i class="fas fa-check-circle"></i>
                    <p>Wszystko zrobione!</p>
                    <small>Brak aktywnych przypomnień</small>
                </div>
            `;
        }

        listContainer.innerHTML = html;
    }
};

// Global function for easy access
function showReminders() {
    Reminders.showPanel();
}

