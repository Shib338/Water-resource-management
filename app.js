/**
 * Water Quality Management System
 * Real production system for water monitoring
 */

const app = {
    readings: [],
    isLoading: false,

    init() {
        this.loadData();
        this.setupEventListeners();
        this.validateBrowser();
        ui.showPage('dashboard');
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
        const fields = ['ph', 'hydrogenSulfide', 'turbidity', 'nitrogen', 'copper', 'dissolvedOxygen', 'temperature'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.validateField(fieldId, field.value));
                field.addEventListener('blur', () => this.validateField(fieldId, field.value));
            }
        });
    },

    validateField(param, value) {
        const field = document.getElementById(param);
        if (!field) return false;

        try {
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
            field.classList.add('is-invalid');
            return false;
        }
    },

    validateAndSaveReading() {
        try {
            const locationElement = document.getElementById('location');
            if (!locationElement) {
                ui.showNotification('Form error: Location field not found', 'error');
                return;
            }
            
            const location = locationElement.value.trim();
            
            if (!location) {
                ui.showNotification('Location is required', 'error');
                locationElement.focus();
                return;
            }

            const fields = ['ph', 'hydrogenSulfide', 'turbidity', 'nitrogen', 'copper', 'dissolvedOxygen', 'temperature'];
            const values = {};
            let hasErrors = false;

            for (const field of fields) {
                const element = document.getElementById(field);
                if (!element) {
                    ui.showNotification(`Form error: ${field} field not found`, 'error');
                    return;
                }
                
                const value = parseFloat(element.value);
                
                if (isNaN(value) || value < 0) {
                    ui.showNotification(`Invalid ${field} value. Please enter a positive number.`, 'error');
                    element.focus();
                    return;
                }
                
                values[field] = value;
                
                if (!this.validateField(field, value)) {
                    hasErrors = true;
                }
            }

            if (hasErrors) {
                ui.showNotification('Some values are outside normal ranges. Data saved with warnings.', 'warning');
            }

            this.addReading(location, values);
        } catch (error) {
            console.error('Validation error:', error);
            ui.showNotification('Error validating form data. Please try again.', 'error');
        }
    },

    loadData() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            this.readings = stored ? JSON.parse(stored) : [];
            
            this.readings = this.readings.filter(reading => {
                return reading && typeof reading === 'object' && reading.id && reading.timestamp;
            });
            
            document.getElementById('totalReadings').textContent = this.readings.length;
            ui.updateDashboard(this.readings);
            
        } catch (error) {
            this.readings = [];
        }
    },

    addReading(location, values) {
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

            this.readings.push(reading);
            
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.readings));
            } catch (storageError) {
                if (storageError.name === 'QuotaExceededError') {
                    ui.showNotification('Storage quota exceeded. Please export and clear old data.', 'warning');
                } else {
                    ui.showNotification('Error saving data. Please try again.', 'error');
                    return;
                }
            }
            
            const form = document.getElementById('readingForm');
            if (form) form.reset();
            
            const totalElement = document.getElementById('totalReadings');
            if (totalElement) totalElement.textContent = this.readings.length;
            
            ui.updateDashboard(this.readings);
            
            document.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });
            
            ui.showNotification('Water quality reading saved successfully', 'success');
        } catch (error) {
            console.error('Error adding reading:', error);
            ui.showNotification('Error saving reading. Please try again.', 'error');
        }
    },

    getStatus(param, value) {
        const range = CONFIG.RANGES[param];
        if (!range) return 'normal';
        return (value >= range.min && value <= range.max) ? 'normal' : 'alert';
    },

    exportData() {
        if (this.readings.length === 0) {
            ui.showNotification('No data available to export', 'warning');
            return;
        }

        const validReadings = this.readings.filter(reading => {
            return reading && typeof reading === 'object' && reading.timestamp;
        });

        if (validReadings.length === 0) {
            ui.showNotification('No valid data to export', 'error');
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
        
        ui.showNotification(`Exported ${validReadings.length} readings successfully`, 'success');
    },

    clearAllData() {
        if (this.readings.length === 0) {
            ui.showNotification('No data to clear', 'info');
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to delete all ${this.readings.length} readings? This cannot be undone.`);
        
        if (confirmed) {
            this.readings = [];
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            document.getElementById('totalReadings').textContent = '0';
            ui.updateDashboard([]);
            
            ui.showNotification('All data cleared', 'info');
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
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.app = app;