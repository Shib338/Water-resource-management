/**
 * Water Quality Management System - Simple Working Version
 */

const app = {
    readings: [],

    init() {
        this.setupEventListeners();
        this.loadData();
        if (typeof ui !== 'undefined') {
            ui.showPage('dashboard');
        }
        if (typeof sensor !== 'undefined' && sensor.init) {
            sensor.init();
        }
    },

    setupEventListeners() {
        const form = document.getElementById('readingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateAndSaveReading();
            });
        }
    },

    validateAndSaveReading() {
        const location = document.getElementById('location').value.trim();
        const ph = parseFloat(document.getElementById('ph').value);
        const heavyMetal = parseFloat(document.getElementById('heavyMetal').value);

        if (!location || isNaN(ph) || isNaN(heavyMetal)) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Please fill all fields correctly', 'error');
            }
            return;
        }

        this.addReading(location, { ph, heavyMetal });
    },

    async addReading(location, values) {
        const reading = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            location: location,
            ph: values.ph,
            heavyMetal: values.heavyMetal,
            source: 'manual'
        };

        // Save to session storage for immediate display
        const sessionData = sessionStorage.getItem('userSessionReadings');
        const sessionReadings = sessionData ? JSON.parse(sessionData) : [];
        sessionReadings.push(reading);
        sessionStorage.setItem('userSessionReadings', JSON.stringify(sessionReadings));

        // Save to Firebase
        if (typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.saveReading(reading);
        }

        // Update display
        this.readings = [...sessionReadings];
        this.updateUI();

        // Reset form
        document.getElementById('readingForm').reset();
        
        if (typeof ui !== 'undefined') {
            ui.showNotification('✅ Data saved successfully', 'success');
            ui.showPage('dashboard');
        }
    },

    loadData() {
        const isAdmin = typeof admin !== 'undefined' && admin.isLoggedIn;
        
        if (isAdmin) {
            // Admin sees all Firebase data
            this.loadFirebaseData();
        } else {
            // Regular user sees session data
            const sessionData = sessionStorage.getItem('userSessionReadings');
            this.readings = sessionData ? JSON.parse(sessionData) : [];
            this.updateUI();
        }
    },

    async loadFirebaseData() {
        if (typeof FirebaseDB !== 'undefined') {
            this.readings = await FirebaseDB.loadReadings();
            this.updateUI();
        }
    },

    updateUI() {
        const totalEl = document.getElementById('totalReadings');
        if (totalEl) totalEl.textContent = this.readings.length;

        if (typeof ui !== 'undefined') {
            ui.updateDashboard(this.readings);
        }
        this.updateReports();
        if (typeof charts !== 'undefined') {
            charts.updateCharts(this.readings);
        }
    },

    resetDisplay() {
        const isAdmin = typeof admin !== 'undefined' && admin.isLoggedIn;
        
        if (isAdmin) {
            this.loadData();
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin data refreshed', 'success');
            }
        } else {
            sessionStorage.removeItem('userSessionReadings');
            this.readings = [];
            this.updateUI();
            if (typeof ui !== 'undefined') {
                ui.showNotification('Session data cleared', 'success');
            }
        }
    },

    updateReports() {
        const outputList = document.getElementById('outputList');
        if (!outputList) return;

        if (this.readings.length === 0) {
            outputList.innerHTML = '<div class="alert alert-info">No readings available. Add data to see reports.</div>';
            return;
        }

        let html = `<div class="alert alert-success mb-4"><strong>Total Readings:</strong> ${this.readings.length}</div>`;
        html += '<div class="row g-3">';
        
        this.readings.slice().reverse().forEach(reading => {
            html += `
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${reading.location}</h6>
                            <p class="text-muted small">${new Date(reading.timestamp).toLocaleString()}</p>
                            <div class="row">
                                <div class="col-6"><small>pH: ${reading.ph?.toFixed(2)}</small></div>
                                <div class="col-6"><small>Heavy Metal: ${reading.heavyMetal?.toFixed(0)} PPM</small></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        outputList.innerHTML = html;
    },

    updateAnalytics() {
        if (typeof charts !== 'undefined') {
            charts.updateCharts(this.readings);
        }
    },

    exportData() {
        if (typeof admin === 'undefined' || !admin.isLoggedIn) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin login required', 'error');
            }
            return;
        }

        if (this.readings.length === 0) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('No data to export', 'warning');
            }
            return;
        }

        const dataStr = JSON.stringify(this.readings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `water-quality-data-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        if (typeof ui !== 'undefined') {
            ui.showNotification(`Exported ${this.readings.length} readings`, 'success');
        }
    },

    async clearAllData() {
        if (typeof admin === 'undefined' || !admin.isLoggedIn) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin login required', 'error');
            }
            return;
        }

        const confirmed = confirm('Delete all data permanently?');
        if (confirmed && typeof FirebaseDB !== 'undefined') {
            await FirebaseDB.clearAllData();
            this.readings = [];
            this.updateUI();
            if (typeof ui !== 'undefined') {
                ui.showNotification('All data deleted', 'info');
            }
        }
    },

    showPage(pageId) {
        if (typeof ui !== 'undefined') {
            ui.showPage(pageId);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;