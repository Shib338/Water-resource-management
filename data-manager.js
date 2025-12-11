/**
 * Data Management System - Import/Export/Backup
 * @global
 */

const dataManager = {
    // Export data in multiple formats
    async exportData(format = 'json') {
        if (typeof admin === 'undefined' || !admin.isLoggedIn) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin login required to export data!', 'error');
            }
            return;
        }

        const readings = (typeof FirebaseDB !== 'undefined') ? await FirebaseDB.loadReadings() : [];
        if (readings.length === 0) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('No data available to export', 'warning');
            }
            return;
        }

        try {
            switch (format.toLowerCase()) {
                case 'json':
                    this.exportJSON(readings);
                    break;
                case 'csv':
                    this.exportCSV(readings);
                    break;
                case 'excel':
                    this.exportExcel(readings);
                    break;
                default:
                    this.exportJSON(readings);
            }
        } catch (error) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Export failed: ' + error.message, 'error');
            }
        }
    },

    // Export as JSON
    exportJSON(readings) {
        const data = {
            exportDate: new Date().toISOString(),
            totalReadings: readings.length,
            readings: readings,
            metadata: {
                version: '1.0',
                source: 'Water Resource Management System'
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `water-quality-data-${this.getDateString()}.json`);
        if (typeof ui !== 'undefined') {
            ui.showNotification(`Exported ${readings.length} readings as JSON`, 'success');
        }
    },

    // Export as CSV
    exportCSV(readings) {
        const headers = ['Date', 'Time', 'Location', 'pH Level', 'Heavy Metal (PPM)', 'pH Status', 'Heavy Metal Status'];
        const rows = readings.map(reading => [
            new Date(reading.timestamp).toLocaleDateString(),
            new Date(reading.timestamp).toLocaleTimeString(),
            reading.location,
            reading.ph?.toFixed(2) || 'N/A',
            reading.heavyMetal?.toFixed(0) || 'N/A',
            this.getPHStatus(reading.ph),
            this.getHeavyMetalStatus(reading.heavyMetal)
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadFile(blob, `water-quality-data-${this.getDateString()}.csv`);
        if (typeof ui !== 'undefined') {
            ui.showNotification(`Exported ${readings.length} readings as CSV`, 'success');
        }
    },

    // Import data from file
    async importData() {
        if (typeof admin === 'undefined' || !admin.isLoggedIn) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin login required to import data!', 'error');
            }
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const text = await this.readFile(file);
                const data = this.parseImportData(text, file.name);
                
                if (data && data.length > 0) {
                    await this.processImportedData(data);
                } else {
                    if (typeof ui !== 'undefined') {
                        ui.showNotification('No valid data found in file', 'warning');
                    }
                }
            } catch (error) {
                if (typeof ui !== 'undefined') {
                    ui.showNotification('Import failed: ' + error.message, 'error');
                }
            }
        };

        input.click();
    },

    // Parse imported data
    parseImportData(text, filename) {
        const isJSON = filename.toLowerCase().endsWith('.json');
        const isCSV = filename.toLowerCase().endsWith('.csv');

        if (isJSON) {
            const parsed = JSON.parse(text);
            return parsed.readings || parsed;
        } else if (isCSV) {
            return this.parseCSV(text);
        } else {
            throw new Error('Unsupported file format');
        }
    },

    // Parse CSV data
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
            
            if (values.length >= 5) {
                const reading = {
                    id: Date.now() + i,
                    timestamp: new Date(`${values[0]} ${values[1]}`).toISOString(),
                    location: values[2],
                    ph: parseFloat(values[3]),
                    heavyMetal: parseFloat(values[4]),
                    source: 'imported'
                };

                if (!isNaN(reading.ph) && !isNaN(reading.heavyMetal)) {
                    data.push(reading);
                }
            }
        }

        return data;
    },

    // Process imported data
    async processImportedData(data) {
        const validReadings = data.filter(reading => {
            const validation = window.validation?.validateReading(reading);
            return validation?.isValid;
        });

        if (validReadings.length === 0) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('No valid readings found in import data', 'warning');
            }
            return;
        }

        const confirmed = confirm(`Import ${validReadings.length} readings? This will add to existing data.`);
        if (!confirmed) return;

        let successCount = 0;
        for (const reading of validReadings) {
            const saved = (typeof FirebaseDB !== 'undefined') ? await FirebaseDB.saveReading(reading) : false;
            if (saved) successCount++;
        }

        if (successCount > 0) {
            if (typeof app !== 'undefined' && app.loadData) {
                await app.loadData();
            }
            if (typeof ui !== 'undefined') {
                ui.showNotification(`Successfully imported ${successCount} readings`, 'success');
            }
        } else {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Failed to import data', 'error');
            }
        }
    },

    // Create backup
    async createBackup() {
        if (typeof admin === 'undefined' || !admin.isLoggedIn) {
            if (typeof ui !== 'undefined') {
                ui.showNotification('Admin login required for backup!', 'error');
            }
            return;
        }

        const readings = (typeof FirebaseDB !== 'undefined') ? await FirebaseDB.loadReadings() : [];
        const backup = {
            backupDate: new Date().toISOString(),
            version: '1.0',
            totalReadings: readings.length,
            readings: readings,
            systemInfo: {
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `water-quality-backup-${this.getDateString()}.json`);
        if (typeof ui !== 'undefined') {
            ui.showNotification(`Backup created with ${readings.length} readings`, 'success');
        }
    },

    // Utility functions
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    getDateString() {
        return new Date().toISOString().split('T')[0];
    },

    getPHStatus(ph) {
        if (ph >= 6.5 && ph <= 8.5) return 'Normal';
        if (ph < 6.5) return 'Acidic';
        return 'Alkaline';
    },

    getHeavyMetalStatus(heavyMetal) {
        if (heavyMetal <= 500) return 'Safe';
        return 'High';
    }
};

window.dataManager = dataManager;