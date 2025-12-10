/**
 * Water Quality Management System - Firebase Cloud Storage
 * @global
 */

/* global CONFIG, ui, charts, sensor, admin, FirebaseDB */
const app = {
    readings: [],
    isLoading: false,

    init() {
        try {
            this.readings = [];
            this.setupEventListeners();
            this.validateBrowser();
            if (typeof ui !== 'undefined') {
                ui.showPage('dashboard');
                ui.updateDashboard([]);
            }
            this.updateReports();
            if (typeof charts !== 'undefined' && charts.updateCharts) {
                charts.updateCharts([]);
            }
            if (typeof sensor !== 'undefined' && sensor.init) {
                sensor.init();
            }
            const totalEl = document.getElementById('totalReadings');
            if (totalEl) totalEl.textContent = '0';
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('App initialization error:', error);
        }
    },

    validateBrowser() {
        if (!('serial' in navigator)) {
            console.log('USB sensor support requires Chrome or Edge browser.');
        }
    },

    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                if (page) ui.showPage(page);
            });
        });

        const form = document.getElementById('readingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateAndSaveReading();
            });
        }

        this.setupFieldValidation();
    },

    setupFieldValidation() {
        const fields = ['ph', 'heavyMetal'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.validateField(fieldId, field.value));
                field.addEventListener('blur', () => this.validateField(fieldId, field.value));
            }
        });
    },

    validateField(param, value) {
        try {
            const field = document.getElementById(param);
            if (!field) return false;

            const numValue = parseFloat(value);
            field.classList.remove('is-valid', 'is-invalid');
            
            if (value === '' || isNaN(numValue) || numValue < 0) {
                if (value !== '') field.classList.add('is-invalid');
                return false;
            }
            
            const range = CONFIG.RANGES[param];
            if (range) {
                const isValid = numValue >= range.min && numValue <= range.max;
                field.classList.toggle('is-valid', isValid);
                field.classList.toggle('is-invalid', !isValid);
                return isValid;
            }
            
            field.classList.add('is-valid');
            return true;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    },

    validateAndSaveReading() {
        try {
            const locationElement = document.getElementById('location');
            if (!locationElement) {
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Form error: Location field not found', 'error');
                }
                return;
            }
            
            const location = locationElement.value.trim();
            
            if (!location) {
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Location is required', 'error');
                }
                locationElement.focus();
                return;
            }

            const fields = ['ph', 'heavyMetal'];
            const values = {};
            let hasErrors = false;

            for (const field of fields) {
                const element = document.getElementById(field);
                if (!element) {
                    if (typeof ui !== 'undefined') {
                        ui.showNotification(`Form error: ${field} field not found`, 'error');
                    }
                    return;
                }
                
                const value = parseFloat(element.value);
                
                if (isNaN(value) || value < 0) {
                    if (typeof ui !== 'undefined') {
                        ui.showNotification(`Invalid ${field} value. Please enter a positive number.`, 'error');
                    }
                    element.focus();
                    return;
                }
                
                values[field] = value;
                
                if (!this.validateField(field, value)) {
                    hasErrors = true;
                }
            }

            if (hasErrors) {
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Some values are outside normal ranges. Data saved with warnings.', 'warning');
                }
            }

            this.addReading(location, values);
        } catch (error) {
            console.error('Validation error:', error);
            if (typeof ui !== 'undefined') {
                ui.showNotification('Error validating form data. Please try again.', 'error');
            }
        }
    },

    async loadData() {
        try {
            this.readings = (typeof FirebaseDB !== 'undefined') ? await FirebaseDB.loadReadings() : [];
            
            this.readings = this.readings.filter(reading => {
                return reading && typeof reading === 'object' && reading.timestamp;
            });
            
            const totalEl = document.getElementById('totalReadings');
            if (totalEl) totalEl.textContent = this.readings.length;
            
            if (typeof ui !== 'undefined') {
                ui.updateDashboard(this.readings);
            }
            this.updateReports();
            if (typeof charts !== 'undefined' && charts.updateCharts) {
                charts.updateCharts(this.readings);
            }
            
            console.log('✅ Loaded', this.readings.length, 'readings from cloud');
        } catch (error) {
            console.error('Load error:', error);
            this.readings = [];
            if (typeof ui !== 'undefined') {
                ui.updateDashboard([]);
            }
        }
    },

    resetDisplay() {
        try {
            this.readings = [];
            const totalEl = document.getElementById('totalReadings');
            if (totalEl) totalEl.textContent = '0';
            if (typeof ui !== 'undefined') {
                ui.updateDashboard([]);
                ui.showPage('dashboard');
                ui.showNotification('Display refreshed successfully', 'success');
            }
            this.updateReports();
            if (typeof charts !== 'undefined' && charts.updateCharts) {
                charts.updateCharts([]);
            }
            console.log('🔄 Display cleared - Firebase data intact');
        } catch (error) {
            console.error('Reset display error:', error);
            if (typeof ui !== 'undefined') {
                ui.showNotification('Error refreshing display', 'error');
            }
        }
    },



    async addReading(location, values) {
        try {
            const reading = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                location: location.trim(),
                ...values,
                source: 'manual'
            };

            const saved = (typeof FirebaseDB !== 'undefined') ? await FirebaseDB.saveReading(reading) : false;
            
            if (saved) {
                this.readings = [reading];
                if (typeof ui !== 'undefined') {
                    ui.updateDashboard(this.readings);
                }
                this.updateReports();
                if (typeof charts !== 'undefined' && charts.updateCharts) {
                    charts.updateCharts(this.readings);
                }
                
                const form = document.getElementById('readingForm');
                if (form) form.reset();
                
                document.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                    el.classList.remove('is-valid', 'is-invalid');
                });
                
                if (typeof ui !== 'undefined') {
                    ui.showNotification('✅ Water quality reading saved to cloud database', 'success');
                }
            } else {
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Error saving reading. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding reading:', error);
            if (typeof ui !== 'undefined') {
                ui.showNotification('Error saving reading. Please try again.', 'error');
            }
        }
    },

    getStatus(param, value) {
        const range = CONFIG.RANGES[param];
        if (!range) return 'normal';
        return (value >= range.min && value <= range.max) ? 'normal' : 'alert';
    },

    exportData() {
        // Check if admin is logged in
        if (typeof admin === 'undefined' || !admin.isLoggedIn) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin login required to export data!', 'error');
            }
            return;
        }

        if (this.readings.length === 0) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('No data available to export', 'warning');
            }
            return;
        }

        const validReadings = this.readings.filter(reading => {
            return reading && typeof reading === 'object' && reading.timestamp;
        });

        if (validReadings.length === 0) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('No valid data to export', 'error');
            }
            return;
        }

        const dataStr = JSON.stringify(validReadings, null, 2);
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
            ui.showNotification(`Exported ${validReadings.length} readings successfully`, 'success');
        }
    },

    async clearAllData() {
        // Check if admin is logged in
        if (typeof admin === 'undefined' || !admin.isLoggedIn) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin login required to delete data!', 'error');
            }
            return;
        }

        const totalInCloud = (typeof FirebaseDB !== 'undefined') ? (await FirebaseDB.loadReadings()).length : 0;
        
        if (totalInCloud === 0) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('No data in cloud database to delete', 'info');
            }
            return;
        }
        
        const confirmed = confirm(`⚠️ WARNING: Delete all ${totalInCloud} readings from Firebase cloud database?\n\nThis will PERMANENTLY delete all data and cannot be undone!`);
        
        if (confirmed) {
            const cleared = (typeof FirebaseDB !== 'undefined') ? await FirebaseDB.clearAllData() : false;
            if (cleared) {
                this.readings = [];
                const totalEl = document.getElementById('totalReadings');
                if (totalEl) totalEl.textContent = '0';
                if (typeof ui !== 'undefined') {
                    ui.updateDashboard([]);
                }
                this.updateReports();
                if (typeof charts !== 'undefined' && charts.updateCharts) {
                    charts.updateCharts([]);
                }
                if (typeof ui !== 'undefined') {
                    ui.showNotification('🗑️ All data permanently deleted from Firebase', 'info');
                }
            } else {
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Error deleting data from Firebase', 'error');
                }
            }
        }
    },

    getStats() {
        return {
            totalReadings: this.readings.length,
            normalReadings: this.readings.filter(r => this.getStatus('ph', r.ph) === 'normal').length,
            alertReadings: this.readings.filter(r => this.getStatus('ph', r.ph) === 'alert').length,
            lastReading: this.readings[this.readings.length - 1],
            dataSize: JSON.stringify(this.readings).length
        };
    },

    showPage(pageId) {
        if (typeof ui !== 'undefined') {
            ui.showPage(pageId);
        }
    },

    updateReports() {
        const outputList = document.getElementById('outputList');
        if (outputList) {
            if (this.readings.length === 0) {
                outputList.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> No readings available. Add data to see reports.</div>';
            } else {
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
                                        <div class="col-6"><small>Heavy Metal: ${reading.heavyMetal?.toFixed(3)} mg/L</small></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                outputList.innerHTML = html;
            }
        }
    },

    updateAnalytics() {
        if (typeof charts !== 'undefined' && charts.updateCharts) {
            charts.updateCharts(this.readings);
        }
        console.log('✅ Analytics updated with', this.readings.length, 'readings');
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;