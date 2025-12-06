/**
 * UI Management Functions
 */

const ui = {
    init() {
        this.setupNavigation();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                if (page) {
                    app.showPage(page);
                }
            });
        });
    },

    showPage(pageId) {
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });

        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (pageId === 'output') app.updateReports();
        if (pageId === 'analytics') app.updateAnalytics();
    },

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
        
        icon.className = `bi ${icons[type] || icons.info}`;
        text.textContent = message;
        notification.className = `alert alert-dismissible fade show shadow alert-${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    },

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.style.display = 'none';
        }
    },

    updateDashboard(readings) {
        const metricCards = document.getElementById('metricCards');
        const latestDetails = document.getElementById('latestDetails');
        const nutrientBars = document.getElementById('nutrientBars');
        const trendChart = document.getElementById('trendChart');
        
        if (readings && readings.length > 0) {
            const latest = readings[readings.length - 1];
            
            if (metricCards) {
                metricCards.innerHTML = `
                    <div class="col-md-3">
                        <div class="card text-white bg-gradient-primary">
                            <div class="card-body text-center">
                                <h3>${latest.ph?.toFixed(2) || 'N/A'}</h3>
                                <p class="mb-0">pH Level</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-gradient-success">
                            <div class="card-body text-center">
                                <h3>${latest.temperature?.toFixed(1) || 'N/A'}°C</h3>
                                <p class="mb-0">Temperature</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-gradient-info">
                            <div class="card-body text-center">
                                <h3>${latest.dissolvedOxygen?.toFixed(2) || 'N/A'}</h3>
                                <p class="mb-0">Dissolved O₂ (mg/L)</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-gradient-warning">
                            <div class="card-body text-center">
                                <h3>${latest.turbidity?.toFixed(2) || 'N/A'}</h3>
                                <p class="mb-0">Turbidity (NTU)</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (latestDetails && latest) {
                latestDetails.innerHTML = `
                    <div class="card border-0 bg-light mb-3">
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6 class="text-primary"><i class="bi bi-geo-alt"></i> Location</h6>
                                    <p class="fs-5 mb-0">${latest.location}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary"><i class="bi bi-clock"></i> Time</h6>
                                    <p class="fs-5 mb-0">${new Date(latest.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="card border-primary">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">pH Level</h6>
                                    <h3 class="text-primary mb-0">${latest.ph?.toFixed(2)}</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-success">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">Temperature</h6>
                                    <h3 class="text-success mb-0">${latest.temperature?.toFixed(1)}°C</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-info">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">Dissolved Oxygen</h6>
                                    <h3 class="text-info mb-0">${latest.dissolvedOxygen?.toFixed(2)} mg/L</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-danger">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">Turbidity</h6>
                                    <h3 class="text-danger mb-0">${latest.turbidity?.toFixed(2)} NTU</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-warning">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">Hydrogen Sulfide</h6>
                                    <h3 class="text-warning mb-0">${latest.hydrogenSulfide?.toFixed(3)} mg/L</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-secondary">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">Nitrogen</h6>
                                    <h3 class="text-secondary mb-0">${latest.nitrogen?.toFixed(2)} mg/L</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-dark">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">Copper</h6>
                                    <h3 class="text-dark mb-0">${latest.copper?.toFixed(2)} mg/L</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Update Nutrient Analysis
            if (nutrientBars) {
                nutrientBars.innerHTML = `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><strong>Nitrogen</strong></span>
                            <span>${latest.nitrogen?.toFixed(2)} mg/L</span>
                        </div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-success" style="width: ${(latest.nitrogen / 10) * 100}%">${latest.nitrogen?.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><strong>Copper</strong></span>
                            <span>${latest.copper?.toFixed(2)} mg/L</span>
                        </div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-warning" style="width: ${(latest.copper / 2) * 100}%">${latest.copper?.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="mb-0">
                        <div class="d-flex justify-content-between mb-1">
                            <span><strong>Hydrogen Sulfide</strong></span>
                            <span>${latest.hydrogenSulfide?.toFixed(3)} mg/L</span>
                        </div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-danger" style="width: ${(latest.hydrogenSulfide / 0.1) * 100}%">${latest.hydrogenSulfide?.toFixed(3)}</div>
                        </div>
                    </div>
                `;
            }
            
            // Update Parameter Trends Chart
            if (trendChart && typeof Chart !== 'undefined') {
                const ctx = trendChart.getContext('2d');
                if (window.dashboardTrendChart) {
                    window.dashboardTrendChart.destroy();
                }
                
                const labels = readings.slice(-10).map(r => new Date(r.timestamp).toLocaleTimeString());
                const phData = readings.slice(-10).map(r => r.ph);
                const tempData = readings.slice(-10).map(r => r.temperature);
                
                window.dashboardTrendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'pH Level',
                                data: phData,
                                borderColor: '#667eea',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                tension: 0.4,
                                fill: true
                            },
                            {
                                label: 'Temperature',
                                data: tempData,
                                borderColor: '#38ef7d',
                                backgroundColor: 'rgba(56, 239, 125, 0.1)',
                                tension: 0.4,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true }
                        },
                        scales: {
                            y: { beginAtZero: false }
                        }
                    }
                });
            }
        } else {
            if (metricCards) {
                metricCards.innerHTML = '<div class="col-12"><div class="alert alert-info">No data available. Add readings to see metrics.</div></div>';
            }
            if (latestDetails) {
                latestDetails.innerHTML = '<p class="text-muted text-center py-3">No readings available. Add data to begin monitoring.</p>';
            }
            if (nutrientBars) {
                nutrientBars.innerHTML = '<p class="text-muted">No nutrient data available</p>';
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ui.init());