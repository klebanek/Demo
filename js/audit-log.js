/**
 * INOVIT HACCP - Audit Log Module
 * @module audit-log
 * @description Track all changes made in the application
 */

const AuditLog = {
    STORAGE_KEY: 'auditLog',
    MAX_ENTRIES: 500,

    /**
     * Initialize audit log system
     */
    init() {
        this.wrapStorageMethods();
        console.log('[AuditLog] Initialized');
    },

    /**
     * Wrap storage methods to automatically log changes
     */
    wrapStorageMethods() {
        // Store original methods
        const originalSave = storage.save.bind(storage);
        const originalDelete = storage.delete?.bind(storage);

        // Override save method
        storage.save = async (key, data) => {
            const oldData = await storage.load(key);
            const result = await originalSave(key, data);

            // Log the change
            if (key !== this.STORAGE_KEY) {
                this.logChange({
                    action: oldData ? 'update' : 'create',
                    module: key,
                    data: this.summarizeData(data, key),
                    previousData: oldData ? this.summarizeData(oldData, key) : null
                });
            }

            return result;
        };

        // Override delete method if exists
        if (originalDelete) {
            storage.delete = async (key, id) => {
                const oldData = await storage.load(key);
                const result = await originalDelete(key, id);

                if (key !== this.STORAGE_KEY) {
                    this.logChange({
                        action: 'delete',
                        module: key,
                        data: { id: id },
                        previousData: oldData ? this.summarizeData(oldData, key) : null
                    });
                }

                return result;
            };
        }
    },

    /**
     * Log a change
     */
    async logChange(entry) {
        try {
            const logs = await this.getLogs();

            const logEntry = {
                id: Utils.generateId(),
                timestamp: new Date().toISOString(),
                action: entry.action,
                module: entry.module,
                moduleName: this.getModuleName(entry.module),
                summary: this.createSummary(entry),
                details: entry.data,
                user: 'System' // Can be extended for multi-user support
            };

            logs.unshift(logEntry);

            // Keep only last MAX_ENTRIES
            if (logs.length > this.MAX_ENTRIES) {
                logs.splice(this.MAX_ENTRIES);
            }

            // Save directly to localStorage to avoid recursion
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));

        } catch (error) {
            console.error('[AuditLog] Error logging change:', error);
        }
    },

    /**
     * Get all logs
     */
    async getLogs() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    },

    /**
     * Get module display name
     */
    getModuleName(key) {
        const names = {
            facility: 'Dane zakładu',
            procedures: 'Procedury GHP/GMP',
            hazards: 'Zagrożenia HACCP',
            temperatureLog: 'Rejestr temperatury',
            trainings: 'Szkolenia',
            audits: 'Audyty',
            tests: 'Badania',
            deliveries: 'Dostawy',
            correctiveActions: 'Działania korygujące',
            flowChart: 'Schemat technologiczny',
            reminders: 'Przypomnienia'
        };
        return names[key] || key;
    },

    /**
     * Get action display name
     */
    getActionName(action) {
        const names = {
            create: 'Utworzono',
            update: 'Zaktualizowano',
            delete: 'Usunięto'
        };
        return names[action] || action;
    },

    /**
     * Get action icon
     */
    getActionIcon(action) {
        const icons = {
            create: 'fas fa-plus-circle',
            update: 'fas fa-edit',
            delete: 'fas fa-trash-alt'
        };
        return icons[action] || 'fas fa-circle';
    },

    /**
     * Get action color class
     */
    getActionColor(action) {
        const colors = {
            create: 'success',
            update: 'info',
            delete: 'danger'
        };
        return colors[action] || 'secondary';
    },

    /**
     * Summarize data for logging
     */
    summarizeData(data, module) {
        if (!data) return null;

        // For arrays, return count
        if (Array.isArray(data)) {
            return { count: data.length };
        }

        // For objects, extract key fields
        const summary = {};

        switch (module) {
            case 'facility':
                summary.name = data.name;
                summary.type = data.type;
                break;
            case 'procedures':
            case 'hazards':
            case 'trainings':
            case 'audits':
            case 'tests':
            case 'deliveries':
            case 'correctiveActions':
                if (Array.isArray(data)) {
                    summary.count = data.length;
                } else {
                    summary.id = data.id;
                    summary.name = data.name || data.topic || data.type || data.supplier || data.problem;
                }
                break;
            default:
                summary.type = typeof data;
        }

        return summary;
    },

    /**
     * Create human-readable summary
     */
    createSummary(entry) {
        const action = this.getActionName(entry.action);
        const module = this.getModuleName(entry.module);

        if (entry.data && entry.data.count !== undefined) {
            return `${action} dane w module "${module}" (${entry.data.count} elementów)`;
        }

        if (entry.data && entry.data.name) {
            return `${action}: "${entry.data.name}" w module "${module}"`;
        }

        return `${action} dane w module "${module}"`;
    },

    /**
     * Show audit log modal
     */
    async showLog() {
        const logs = await this.getLogs();

        Modal.open({
            title: 'Historia zmian',
            content: this.renderLogList(logs),
            footer: `
                <button class="btn btn-danger btn-small" onclick="AuditLog.confirmClear()">
                    <i class="fas fa-trash"></i> Wyczyść historię
                </button>
                <button class="btn btn-secondary" onclick="Modal.close()">Zamknij</button>
            `,
            size: 'large'
        });
    },

    /**
     * Render log list HTML
     */
    renderLogList(logs) {
        if (!logs || logs.length === 0) {
            return `
                <div class="audit-log-empty">
                    <i class="fas fa-history"></i>
                    <p>Brak zapisanych zmian</p>
                    <small>Historia zmian będzie tutaj wyświetlana</small>
                </div>
            `;
        }

        // Group by date
        const grouped = {};
        logs.forEach(log => {
            const date = Utils.formatDate(log.timestamp);
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(log);
        });

        let html = '<div class="audit-log-container">';

        for (const [date, dateLogs] of Object.entries(grouped)) {
            html += `
                <div class="audit-log-date-group">
                    <div class="audit-log-date-header">
                        <i class="fas fa-calendar"></i> ${date}
                        <span class="audit-log-count">${dateLogs.length} zmian</span>
                    </div>
                    <div class="audit-log-entries">
            `;

            dateLogs.forEach(log => {
                const time = new Date(log.timestamp).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const actionColor = this.getActionColor(log.action);
                const actionIcon = this.getActionIcon(log.action);

                html += `
                    <div class="audit-log-entry">
                        <div class="audit-log-time">${time}</div>
                        <div class="audit-log-icon audit-log-icon-${actionColor}">
                            <i class="${actionIcon}"></i>
                        </div>
                        <div class="audit-log-content">
                            <div class="audit-log-action">
                                <span class="audit-log-badge audit-log-badge-${actionColor}">
                                    ${this.getActionName(log.action)}
                                </span>
                                <span class="audit-log-module">${log.moduleName}</span>
                            </div>
                            <div class="audit-log-summary">${log.summary}</div>
                        </div>
                    </div>
                `;
            });

            html += '</div></div>';
        }

        html += '</div>';
        return html;
    },

    /**
     * Confirm and clear log
     */
    async confirmClear() {
        const confirmed = await Modal.confirm(
            'Czy na pewno chcesz wyczyścić całą historię zmian? Ta operacja jest nieodwracalna.',
            {
                title: 'Potwierdź usunięcie',
                confirmText: 'Wyczyść',
                confirmClass: 'btn-danger',
                icon: 'fas fa-exclamation-triangle'
            }
        );

        if (confirmed) {
            await this.clearLog();
            Modal.close();
            Notifications.success('Historia zmian została wyczyszczona');
        }
    },

    /**
     * Clear all logs
     */
    async clearLog() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * Export logs to JSON
     */
    async exportLogs() {
        const logs = await this.getLogs();
        const json = JSON.stringify(logs, null, 2);
        const filename = `audit-log-${Utils.getCurrentDate()}.json`;
        Utils.downloadFile(json, filename, 'application/json');
        Notifications.success('Historia zmian została wyeksportowana');
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    AuditLog.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditLog;
}
