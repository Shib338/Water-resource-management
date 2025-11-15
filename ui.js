/**
 * UI Management Functions
 */

const ui = {
    currentPage: 'dashboard',

    // Initialize UI
    init() {
        this.setupNavigation();
        this.updateDashboard([]);
    },

    // Setup navigation
    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });
    },

    // Show specific page
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentPage = pageId;

        // Update page content
        if (pageId === 'output') {
            this.updateReports();
        } else if (pageId === 'analytics') {
            this.updateAnalytics();
        }
    },

    // Update dashboard
    updateDashboard(readings) {
        try {
            this.updateMetricCards(readings);
            this.updateLatestReading(readings);
            this.updateTotalReadings(readings.length);
            
            // Update charts if available
            if (typeof charts !== 'undefined' && charts.updateCharts) {
                setTimeout(() => {
                    charts.updateCharts(readings);
                }, 100);
            }
        } catch (error) {
            console.error('Dashboard update error:', error);
            this.showNotification('Error updating dashboard', 'warning');
        }
    },

    // Update metric cards
    updateMetricCards(readings) {
        const container = document.getElementById('metricCards');
        if (!container) return;

        if (readings.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card shadow hover-lift">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-droplet display-1 text-muted mb-3"></i>
                            <h4 class="text-muted">No Data Available</h4>
                            <p class="text-muted">Add water quality readings to see metrics</p>
                            <button class="btn btn-primary" onclick="ui.showPage('add-data')">
                                <i class="bi bi-plus-circle"></i> Add Data
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const latest = readings[readings.length - 1];
        const metrics = [
            { name: 'pH Level', value: latest.ph, icon: 'droplet', color: 'primary' },
            { name: 'Temperature', value: `${latest.temperature}°C`, icon: 'thermometer', color: 'success' },
            { name: 'Dissolved O₂', value: `${latest.dissolvedOxygen} mg/L`, icon: 'water', color: 'info' },
            { name: 'Turbidity', value: `${latest.turbidity} NTU`, icon: 'cloud-haze', color: 'warning' }
        ];

        container.innerHTML = metrics.map(metric => `
            <div class="col-lg-3 col-md-6">
                <div class="card shadow hover-lift text-white" style="background: var(--${metric.color}-gradient);">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="opacity-75">${metric.name}</h6>
                                <h3 class="mb-0">${metric.value}</h3>
                            </div>
                            <i class="bi bi-${metric.icon} fs-1 opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Update latest reading
    updateLatestReading(readings) {
        const container = document.getElementById('latestDetails');
        if (!container) return;

        if (readings.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">No readings available. Add data to begin monitoring.</p>';
            return;
        }

        const latest = readings[readings.length - 1];
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-geo-alt text-primary me-2"></i>
                        <div>
                            <small class="text-muted">Location</small>
                            <div class="fw-bold">${latest.location}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-clock text-primary me-2"></i>
                        <div>
                            <small class="text-muted">Time</small>
                            <div class="fw-bold">${latest.time}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">pH</small>
                        <div class="fw-bold">${latest.ph}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">Temp</small>
                        <div class="fw-bold">${latest.temperature}°C</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">DO</small>
                        <div class="fw-bold">${latest.dissolvedOxygen}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-2 bg-light rounded">
                        <small class="text-muted">Turbidity</small>
                        <div class="fw-bold">${latest.turbidity}</div>
                    </div>
                </div>
            </div>
        `;
    },

    // Update reports section
    updateReports() {
        const readings = app.readings || [];
        
        // Update summary cards
        document.getElementById('totalRecords').textContent = readings.length;
        document.getElementById('normalRecords').textContent = readings.filter(r => this.isNormal(r)).length;
        document.getElementById('alertRecords').textContent = readings.filter(r => !this.isNormal(r)).length;

        // Update reports list
        const container = document.getElementById('outputList');
        if (!container) return;

        if (readings.length === 0) {
            container.innerHTML = `
                <div class="card shadow hover-lift">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-file-earmark-text display-1 text-muted mb-3"></i>
                        <h4 class="text-muted">No Reports Available</h4>
                        <p class="text-muted">Add water quality data to generate reports</p>
                        <button class="btn btn-primary" onclick="ui.showPage('add-data')">
                            <i class="bi bi-plus-circle"></i> Add Data
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Group readings by location
        const locationGroups = {};
        readings.forEach(reading => {
            if (!locationGroups[reading.location]) {
                locationGroups[reading.location] = [];
            }
            locationGroups[reading.location].push(reading);
        });

        container.innerHTML = `
            <div class="row g-4">
                ${Object.entries(locationGroups).map(([location, locationReadings]) => `
                    <div class="col-lg-6">
                        <div class="card shadow hover-lift">
                            <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: var(--primary-gradient);">
                                <h6 class="mb-0"><i class="bi bi-geo-alt"></i> ${location}</h6>
                                <span class="badge bg-light text-dark">${locationReadings.length} readings</span>
                            </div>
                            <div class="card-body">
                                <div class="row g-2 mb-3">
                                    <div class="col-6">
                                        <div class="text-center p-2 bg-success bg-opacity-10 rounded">
                                            <small class="text-success">Normal</small>
                                            <div class="fw-bold text-success">${locationReadings.filter(r => this.isNormal(r)).length}</div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="text-center p-2 bg-danger bg-opacity-10 rounded">
                                            <small class="text-danger">Alerts</small>
                                            <div class="fw-bold text-danger">${locationReadings.filter(r => !this.isNormal(r)).length}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="latest-reading">
                                    <small class="text-muted">Latest Reading:</small>
                                    <div class="mt-1">
                                        <div class="d-flex justify-content-between">
                                            <span>pH: <strong>${locationReadings[locationReadings.length - 1].ph}</strong></span>
                                            <span>Temp: <strong>${locationReadings[locationReadings.length - 1].temperature}°C</strong></span>
                                        </div>
                                        <div class="d-flex justify-content-between mt-1">
                                            <span>DO: <strong>${locationReadings[locationReadings.length - 1].dissolvedOxygen}</strong></span>
                                            <span>Turbidity: <strong>${locationReadings[locationReadings.length - 1].turbidity}</strong></span>
                                        </div>
                                        <small class="text-muted">${locationReadings[locationReadings.length - 1].date} ${locationReadings[locationReadings.length - 1].time}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="card shadow hover-lift mt-4">
                <div class="card-header text-white" style="background: var(--info-gradient);">
                    <h5 class="mb-0"><i class="bi bi-list-ul"></i> Recent Readings</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Date/Time</th>
                                    <th>Location</th>
                                    <th>pH</th>
                                    <th>Temperature</th>
                                    <th>DO</th>
                                    <th>Turbidity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${readings.slice(-10).reverse().map(reading => `
                                    <tr>
                                        <td>
                                            <small>${reading.date}<br>${reading.time}</small>
                                        </td>
                                        <td>${reading.location}</td>
                                        <td>${reading.ph}</td>
                                        <td>${reading.temperature}°C</td>
                                        <td>${reading.dissolvedOxygen}</td>
                                        <td>${reading.turbidity}</td>
                                        <td>
                                            <span class="badge ${this.isNormal(reading) ? 'bg-success' : 'bg-danger'}">
                                                ${this.isNormal(reading) ? 'Normal' : 'Alert'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // Check if reading is normal
    isNormal(reading) {
        return reading.ph >= 6.5 && reading.ph <= 8.5 &&
               reading.temperature >= 15 && reading.temperature <= 30 &&
               reading.dissolvedOxygen >= 5 && reading.dissolvedOxygen <= 14 &&
               reading.turbidity >= 0 && reading.turbidity <= 5;
    },

    // Update analytics
    updateAnalytics() {
        try {
            const readings = app.readings || [];
            const summaryElement = document.getElementById('statisticalSummary');
            
            if (!summaryElement) return;
            
            if (readings.length === 0) {
                summaryElement.innerHTML = `
                    <div class="text-center py-3">
                        <i class="bi bi-graph-up fs-1 text-muted mb-2"></i>
                        <h6 class="text-muted">No Analytics Available</h6>
                        <small class="text-muted">Add water quality data to see analytics</small>
                    </div>
                `;
                return;
            }

            // Calculate statistics
            const stats = this.calculateStats(readings);
            
            summaryElement.innerHTML = `
                <div class="row g-2">
                    <div class="col-3">
                        <div class="text-center p-2 bg-primary bg-opacity-10 rounded">
                            <h5 class="text-primary mb-0">${readings.length}</h5>
                            <small class="text-muted">Readings</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center p-2 bg-success bg-opacity-10 rounded">
                            <h5 class="text-success mb-0">${stats.avgPH}</h5>
                            <small class="text-muted">Avg pH</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center p-2 bg-info bg-opacity-10 rounded">
                            <h5 class="text-info mb-0">${stats.avgTemp}°C</h5>
                            <small class="text-muted">Avg Temp</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center p-2 bg-warning bg-opacity-10 rounded">
                            <h5 class="text-warning mb-0">${stats.avgDO}</h5>
                            <small class="text-muted">Avg DO</small>
                        </div>
                    </div>
                </div>
            `;
            
            // Update charts if available
            if (typeof charts !== 'undefined' && charts.updateCharts) {
                setTimeout(() => {
                    charts.updateCharts(readings);
                }, 100);
            }
        } catch (error) {
            console.error('Analytics update error:', error);
            const summaryElement = document.getElementById('statisticalSummary');
            if (summaryElement) {
                summaryElement.innerHTML = '<div class="text-center text-danger"><small>Error loading analytics</small></div>';
            }
        }
    },

    // Calculate statistics
    calculateStats(readings) {
        const avgPH = (readings.reduce((sum, r) => sum + r.ph, 0) / readings.length).toFixed(1);
        const avgTemp = (readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length).toFixed(1);
        const avgDO = (readings.reduce((sum, r) => sum + r.dissolvedOxygen, 0) / readings.length).toFixed(1);
        
        return { avgPH, avgTemp, avgDO };
    },

    // Update total readings counter
    updateTotalReadings(count) {
        const element = document.getElementById('totalReadings');
        if (element) {
            element.textContent = count;
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notificationIcon');
        const text = document.getElementById('notificationMessage');
        
        if (!notification || !icon || !text) return;

        const icons = {
            success: 'bi-check-circle-fill text-success',
            error: 'bi-exclamation-triangle-fill text-danger',
            warning: 'bi-exclamation-triangle-fill text-warning',
            info: 'bi-info-circle-fill text-info'
        };
        
        const classes = {
            success: 'alert-success',
            error: 'alert-danger',
            warning: 'alert-warning',
            info: 'alert-info'
        };
        
        icon.className = `bi ${icons[type] || icons.info}`;
        text.textContent = message;
        notification.className = `alert alert-dismissible fade show shadow ${classes[type] || classes.info}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    },

    // Hide notification
    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.style.display = 'none';
        }
    },

    // Show loading
    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('d-none');
        }
    },

    // Hide loading
    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('d-none');
        }
    }
};

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => ui.init());