// Admin Panel for Database Management
const admin = {
    isAdminMode: false,
    allData: [],
    filteredData: [],

    async init() {
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => this.toggleAdmin());
        }
        console.log('Admin panel ready');
    },

    async toggleAdmin() {
        this.isAdminMode = !this.isAdminMode;
        const adminElements = document.querySelectorAll('.admin-only');
        const publicElements = document.querySelectorAll('.public-only');
        const adminText = document.getElementById('adminText');
        
        if (this.isAdminMode) {
            adminElements.forEach(el => el.style.display = '');
            publicElements.forEach(el => el.style.display = 'none');
            adminText.textContent = 'Exit Admin';
            await this.refreshData();
            await app.loadData();
        } else {
            adminElements.forEach(el => el.style.display = 'none');
            publicElements.forEach(el => el.style.display = '');
            adminText.textContent = 'Admin';
        }
    },

    async refreshData() {
        try {
            this.allData = await FirebaseDB.loadReadings();
            this.filteredData = [...this.allData];
            this.updateStats();
            this.renderTable();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },

    updateStats() {
        const totalReadingsEl = document.getElementById('totalReadings');
        if (totalReadingsEl) {
            totalReadingsEl.textContent = this.allData.length;
        }

        const storageTypeEl = document.getElementById('storageType');
        if (storageTypeEl) {
            storageTypeEl.textContent = FirebaseDB.isFirebaseEnabled ? 'Firebase' : 'Local';
        }

        const totalLocationsEl = document.getElementById('totalLocations');
        if (totalLocationsEl) {
            const locations = new Set(this.allData.map(r => r.location));
            totalLocationsEl.textContent = locations.size;
        }

        // Update report stats
        const totalRecordsEl = document.getElementById('totalRecords');
        const normalRecordsEl = document.getElementById('normalRecords');
        const alertRecordsEl = document.getElementById('alertRecords');
        
        if (totalRecordsEl) totalRecordsEl.textContent = this.allData.length;
        
        if (normalRecordsEl && alertRecordsEl) {
            let normal = 0, alerts = 0;
            this.allData.forEach(reading => {
                const issues = this.checkIssues(reading);
                if (issues.length === 0) normal++;
                else alerts++;
            });
            normalRecordsEl.textContent = normal;
            alertRecordsEl.textContent = alerts;
        }
    },

    checkIssues(reading) {
        const issues = [];
        if (!CONFIG || !CONFIG.RANGES) return issues;
        
        const ranges = CONFIG.RANGES;
        
        if (ranges.ph && (reading.ph < ranges.ph.min || reading.ph > ranges.ph.max)) issues.push('pH');
        if (ranges.temperature && (reading.temperature < ranges.temperature.min || reading.temperature > ranges.temperature.max)) issues.push('Temp');
        if (ranges.oxygen && (reading.oxygen < ranges.oxygen.min || reading.oxygen > ranges.oxygen.max)) issues.push('O₂');
        if (ranges.turbidity && reading.turbidity > ranges.turbidity.max) issues.push('Turbidity');
        
        return issues;
    },

    renderTable() {
        const tbody = document.getElementById('adminTableBody');
        if (!tbody) return;

        if (this.filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        No data available
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredData.map(reading => {
            const date = new Date(reading.timestamp);
            const issues = this.checkIssues(reading);
            const statusClass = issues.length > 0 ? 'table-warning' : '';
            
            return `
                <tr class="${statusClass}">
                    <td>${date.toLocaleString()}</td>
                    <td>${reading.location}</td>
                    <td>${reading.ph.toFixed(2)}</td>
                    <td>${reading.temperature.toFixed(1)}</td>
                    <td>${reading.oxygen.toFixed(2)}</td>
                    <td>${reading.turbidity.toFixed(2)}</td>
                    <td>${reading.hydrogenSulfide.toFixed(3)}</td>
                    <td>${reading.nitrogen.toFixed(2)}</td>
                    <td>${reading.copper.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="admin.viewDetails('${reading.id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="admin.deleteReading('${reading.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterData() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const query = searchInput.value.toLowerCase();
        
        if (!query) {
            this.filteredData = [...this.allData];
        } else {
            this.filteredData = this.allData.filter(reading => {
                return reading.location.toLowerCase().includes(query) ||
                       reading.timestamp.toLowerCase().includes(query) ||
                       reading.ph.toString().includes(query) ||
                       reading.temperature.toString().includes(query);
            });
        }
        
        this.renderTable();
    },

    viewDetails(id) {
        const reading = this.allData.find(r => r.id === id);
        if (!reading) return;

        const issues = this.checkIssues(reading);
        const issuesText = issues.length > 0 ? 
            `<div class="alert alert-warning"><strong>Issues:</strong> ${issues.join(', ')}</div>` : 
            `<div class="alert alert-success"><strong>Status:</strong> All parameters normal</div>`;

        const modal = `
            <div class="modal fade" id="detailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Reading Details</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${issuesText}
                            <table class="table table-striped">
                                <tr><th>Timestamp</th><td>${new Date(reading.timestamp).toLocaleString()}</td></tr>
                                <tr><th>Location</th><td>${reading.location}</td></tr>
                                <tr><th>pH Level</th><td>${reading.ph.toFixed(2)}</td></tr>
                                <tr><th>Temperature</th><td>${reading.temperature.toFixed(1)}°C</td></tr>
                                <tr><th>Dissolved Oxygen</th><td>${reading.oxygen.toFixed(2)} mg/L</td></tr>
                                <tr><th>Turbidity</th><td>${reading.turbidity.toFixed(2)} NTU</td></tr>
                                <tr><th>Hydrogen Sulfide</th><td>${reading.hydrogenSulfide.toFixed(3)} mg/L</td></tr>
                                <tr><th>Nitrogen</th><td>${reading.nitrogen.toFixed(2)} mg/L</td></tr>
                                <tr><th>Copper</th><td>${reading.copper.toFixed(2)} mg/L</td></tr>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);
        const modalEl = new bootstrap.Modal(document.getElementById('detailsModal'));
        modalEl.show();
        document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },

    async deleteReading(id) {
        if (!confirm('Are you sure you want to delete this reading?')) return;

        try {
            await FirebaseDB.deleteReading(id);
            ui.showNotification('Reading deleted successfully', 'success');
            await this.refreshData();
            app.loadData();
        } catch (error) {
            ui.showNotification('Error deleting reading: ' + error.message, 'danger');
        }
    },

    async clearAllData() {
        if (!confirm('⚠️ WARNING: This will delete ALL water quality readings!\n\nAre you absolutely sure?')) return;
        if (!confirm('This action CANNOT be undone. Type YES in the next prompt to confirm.')) return;
        
        const confirmation = prompt('Type YES to delete all data:');
        if (confirmation !== 'YES') {
            ui.showNotification('Clear operation cancelled', 'info');
            return;
        }

        try {
            await FirebaseDB.clearAllData();
            ui.showNotification('All data cleared successfully', 'success');
            await this.refreshData();
            app.loadData();
        } catch (error) {
            ui.showNotification('Error clearing data: ' + error.message, 'danger');
        }
    },

    exportData() {
        if (this.allData.length === 0) {
            ui.showNotification('No data to export', 'warning');
            return;
        }

        const dataStr = JSON.stringify(this.allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `water-quality-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ui.showNotification(`Exported ${this.allData.length} readings`, 'success');
    }
};

// Initialize admin panel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => admin.init());
} else {
    admin.init();
}
