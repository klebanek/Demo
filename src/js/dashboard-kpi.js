import { CONFIG } from "./config.js";
import { Utils } from "./utils.js";
import { storage } from "./storage.js";
import { Notifications } from "./notifications.js";
import { Modal } from "./modal.js";
/**
 * INOVIT HACCP - Dashboard KPI Module
 * @module dashboard-kpi
 * @description Real-time KPI dashboard with metrics and charts
 */

export const DashboardKPI = {
    /**
     * Initialize KPI dashboard
     */
    async init() {
        console.log('[DashboardKPI] Initializing...');
    },

    /**
     * Render KPI section on dashboard
     */
    async render() {
        const container = document.getElementById('kpi-container');
        if (!container) return;

        const metrics = await this.calculateMetrics();

        container.innerHTML = `
            <div class="kpi-header">
                <h3><i class="fas fa-chart-line" aria-hidden="true"></i> Panel KPI - Przegląd systemu HACCP</h3>
                <button class="btn btn-small btn-secondary" onclick="DashboardKPI.refresh()" aria-label="Odśwież dane">
                    <i class="fas fa-sync-alt"></i> Odśwież
                </button>
            </div>

            <div class="kpi-grid">
                ${this.renderMetricCard('open-actions', 'Otwarte korekty', metrics.openActions, 'fas fa-exclamation-triangle', this.getActionStatus(metrics.openActions))}
                ${this.renderMetricCard('overdue-tests', 'Przeterminowane badania', metrics.overdueTests, 'fas fa-flask', this.getOverdueStatus(metrics.overdueTests))}
                ${this.renderMetricCard('upcoming-audits', 'Nadchodzące audyty', metrics.upcomingAudits, 'fas fa-clipboard-check', 'info')}
                ${this.renderMetricCard('pending-trainings', 'Planowane szkolenia', metrics.pendingTrainings, 'fas fa-graduation-cap', 'info')}
                ${this.renderMetricCard('temp-alerts', 'Alerty temperaturowe', metrics.tempAlerts, 'fas fa-thermometer-half', this.getAlertStatus(metrics.tempAlerts))}
                ${this.renderMetricCard('active-reminders', 'Aktywne przypomnienia', metrics.activeReminders, 'fas fa-bell', 'info')}
            </div>

            <div class="kpi-charts-row">
                <div class="kpi-chart-container">
                    <h4><i class="fas fa-chart-bar"></i> Status działań korygujących</h4>
                    <div class="kpi-chart" id="actions-chart">
                        ${this.renderStatusChart(metrics.actionsBreakdown)}
                    </div>
                </div>
                <div class="kpi-chart-container">
                    <h4><i class="fas fa-chart-pie"></i> Typy zagrożeń</h4>
                    <div class="kpi-chart" id="hazards-chart">
                        ${this.renderHazardsChart(metrics.hazardsBreakdown)}
                    </div>
                </div>
            </div>

            <div class="kpi-alerts-section">
                <h4><i class="fas fa-exclamation-circle"></i> Alerty wymagające uwagi</h4>
                <div class="kpi-alerts-list" id="kpi-alerts-list">
                    ${this.renderAlerts(metrics.alerts)}
                </div>
            </div>
        `;
    },

    /**
     * Render single metric card
     */
    renderMetricCard(id, label, value, icon, status) {
        return `
            <div class="kpi-card kpi-card-${status}" id="kpi-${id}">
                <div class="kpi-icon">
                    <i class="${icon}" aria-hidden="true"></i>
                </div>
                <div class="kpi-content">
                    <span class="kpi-value">${value}</span>
                    <span class="kpi-label">${label}</span>
                </div>
            </div>
        `;
    },

    /**
     * Render status chart (horizontal bar)
     */
    renderStatusChart(breakdown) {
        if (!breakdown || Object.keys(breakdown).length === 0) {
            return '<p class="kpi-no-data">Brak danych</p>';
        }

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        if (total === 0) {
            return '<p class="kpi-no-data">Brak działań korygujących</p>';
        }

        const statusColors = {
            'Otwarte': 'var(--danger-color)',
            'W realizacji': 'var(--warning-color)',
            'Zamknięte': 'var(--success-color)'
        };

        let html = '<div class="kpi-bar-chart">';
        for (const [status, count] of Object.entries(breakdown)) {
            const percentage = Math.round((count / total) * 100);
            const color = statusColors[status] || 'var(--secondary-color)';
            html += `
                <div class="kpi-bar-item">
                    <div class="kpi-bar-label">
                        <span>${status}</span>
                        <span>${count} (${percentage}%)</span>
                    </div>
                    <div class="kpi-bar-track">
                        <div class="kpi-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    },

    /**
     * Render hazards breakdown chart
     */
    renderHazardsChart(breakdown) {
        if (!breakdown || Object.keys(breakdown).length === 0) {
            return '<p class="kpi-no-data">Brak danych o zagrożeniach</p>';
        }

        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        if (total === 0) {
            return '<p class="kpi-no-data">Brak zdefiniowanych zagrożeń</p>';
        }

        const typeColors = {
            'Biologiczne': '#e74c3c',
            'Chemiczne': '#9b59b6',
            'Fizyczne': '#3498db'
        };

        let html = '<div class="kpi-donut-chart">';
        html += '<div class="kpi-donut-legend">';

        for (const [type, count] of Object.entries(breakdown)) {
            const percentage = Math.round((count / total) * 100);
            const color = typeColors[type] || 'var(--secondary-color)';
            html += `
                <div class="kpi-legend-item">
                    <span class="kpi-legend-color" style="background: ${color};"></span>
                    <span class="kpi-legend-label">${type}</span>
                    <span class="kpi-legend-value">${count} (${percentage}%)</span>
                </div>
            `;
        }

        html += '</div>';
        html += `<div class="kpi-donut-total"><span class="kpi-donut-number">${total}</span><span class="kpi-donut-text">Zagrożeń</span></div>`;
        html += '</div>';
        return html;
    },

    /**
     * Render alerts list
     */
    renderAlerts(alerts) {
        if (!alerts || alerts.length === 0) {
            return `
                <div class="kpi-no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <p>Brak alertów - system działa prawidłowo</p>
                </div>
            `;
        }

        return alerts.map(alert => `
            <div class="kpi-alert kpi-alert-${alert.severity}">
                <div class="kpi-alert-icon">
                    <i class="${this.getAlertIcon(alert.type)}" aria-hidden="true"></i>
                </div>
                <div class="kpi-alert-content">
                    <strong>${alert.title}</strong>
                    <p>${alert.message}</p>
                </div>
                <div class="kpi-alert-action">
                    ${alert.action ? `<button class="btn btn-small" onclick="${alert.action.handler}">${alert.action.label}</button>` : ''}
                </div>
            </div>
        `).join('');
    },

    /**
     * Calculate all metrics from stored data
     */
    async calculateMetrics() {
        const metrics = {
            openActions: 0,
            overdueTests: 0,
            upcomingAudits: 0,
            pendingTrainings: 0,
            tempAlerts: 0,
            activeReminders: 0,
            actionsBreakdown: {},
            hazardsBreakdown: {},
            alerts: []
        };

        try {
            // Get all data
            const [
                correctiveActions,
                tests,
                audits,
                trainings,
                temperatureLog,
                hazards,
                reminders
            ] = await Promise.all([
                storage.load('correctiveActions') || [],
                storage.load('tests') || [],
                storage.load('audits') || [],
                storage.load('trainings') || [],
                storage.load('temperatureLog') || [],
                storage.load('hazards') || [],
                storage.load('reminders') || []
            ]);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            // Corrective Actions analysis
            if (Array.isArray(correctiveActions)) {
                metrics.actionsBreakdown = { 'Otwarte': 0, 'W realizacji': 0, 'Zamknięte': 0 };
                correctiveActions.forEach(action => {
                    const status = action.status || 'Otwarte';
                    metrics.actionsBreakdown[status] = (metrics.actionsBreakdown[status] || 0) + 1;
                    if (status === 'Otwarte') {
                        metrics.openActions++;
                    }
                });

                // Alert for open actions
                if (metrics.openActions > 0) {
                    metrics.alerts.push({
                        type: 'action',
                        severity: metrics.openActions > 3 ? 'danger' : 'warning',
                        title: `${metrics.openActions} otwartych działań korygujących`,
                        message: 'Wymagają podjęcia działań naprawczych',
                        action: { label: 'Zobacz', handler: "showPage('korekty')" }
                    });
                }
            }

            // Tests analysis
            if (Array.isArray(tests)) {
                tests.forEach(test => {
                    if (test.nextTest) {
                        const nextTestDate = new Date(test.nextTest);
                        if (nextTestDate < today) {
                            metrics.overdueTests++;
                        }
                    }
                    if (test.status === 'Przeterminowane') {
                        metrics.overdueTests++;
                    }
                });

                if (metrics.overdueTests > 0) {
                    metrics.alerts.push({
                        type: 'test',
                        severity: 'danger',
                        title: `${metrics.overdueTests} przeterminowanych badań`,
                        message: 'Należy pilnie wykonać badania laboratoryjne',
                        action: { label: 'Zobacz', handler: "showPage('badania')" }
                    });
                }
            }

            // Audits analysis
            if (Array.isArray(audits)) {
                audits.forEach(audit => {
                    if (audit.date) {
                        const auditDate = new Date(audit.date);
                        if (auditDate >= today && auditDate <= nextWeek) {
                            metrics.upcomingAudits++;
                        }
                    }
                });

                if (metrics.upcomingAudits > 0) {
                    metrics.alerts.push({
                        type: 'audit',
                        severity: 'info',
                        title: `${metrics.upcomingAudits} audytów w tym tygodniu`,
                        message: 'Przygotuj się do nadchodzących audytów',
                        action: { label: 'Zobacz', handler: "showPage('audyty')" }
                    });
                }
            }

            // Trainings analysis
            if (Array.isArray(trainings)) {
                trainings.forEach(training => {
                    if (training.status === 'Planowane') {
                        metrics.pendingTrainings++;
                    }
                });
            }

            // Temperature alerts
            if (Array.isArray(temperatureLog)) {
                const recentLogs = temperatureLog.slice(-50); // Last 50 records
                recentLogs.forEach(log => {
                    if (log.status === 'Poza normą' || log.status === 'Przekroczenie') {
                        metrics.tempAlerts++;
                    }
                });

                if (metrics.tempAlerts > 0) {
                    metrics.alerts.push({
                        type: 'temperature',
                        severity: 'warning',
                        title: `${metrics.tempAlerts} alertów temperaturowych`,
                        message: 'Wykryto odchylenia w ostatnich pomiarach',
                        action: { label: 'Zobacz', handler: "showPage('rejestry')" }
                    });
                }
            }

            // Hazards breakdown
            if (Array.isArray(hazards)) {
                metrics.hazardsBreakdown = { 'Biologiczne': 0, 'Chemiczne': 0, 'Fizyczne': 0 };
                hazards.forEach(hazard => {
                    const type = hazard.type || 'Biologiczne';
                    metrics.hazardsBreakdown[type] = (metrics.hazardsBreakdown[type] || 0) + 1;
                });
            }

            // Active reminders
            if (Array.isArray(reminders)) {
                reminders.forEach(reminder => {
                    if (reminder.status !== 'completed') {
                        metrics.activeReminders++;

                        // Check for overdue reminders
                        if (reminder.dueDate) {
                            const dueDate = new Date(reminder.dueDate);
                            if (dueDate < today && reminder.status !== 'completed') {
                                // Already counted in activeReminders
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error('[DashboardKPI] Error calculating metrics:', error);
        }

        return metrics;
    },

    /**
     * Get status class based on open actions count
     */
    getActionStatus(count) {
        if (count === 0) return 'success';
        if (count <= 2) return 'warning';
        return 'danger';
    },

    /**
     * Get status class based on overdue count
     */
    getOverdueStatus(count) {
        if (count === 0) return 'success';
        return 'danger';
    },

    /**
     * Get status class based on alerts count
     */
    getAlertStatus(count) {
        if (count === 0) return 'success';
        if (count <= 3) return 'warning';
        return 'danger';
    },

    /**
     * Get icon for alert type
     */
    getAlertIcon(type) {
        const icons = {
            'action': 'fas fa-tools',
            'test': 'fas fa-flask',
            'audit': 'fas fa-clipboard-check',
            'temperature': 'fas fa-thermometer-half',
            'training': 'fas fa-graduation-cap',
            'reminder': 'fas fa-bell'
        };
        return icons[type] || 'fas fa-exclamation-circle';
    },

    /**
     * Refresh KPI data
     */
    async refresh() {
        const refreshBtn = document.querySelector('#kpi-container .btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Odświeżanie...';
            refreshBtn.disabled = true;
        }

        await this.render();

        if (typeof Notifications !== 'undefined') {
            Notifications.success('Panel KPI został odświeżony');
        }
    }
};

// Export
