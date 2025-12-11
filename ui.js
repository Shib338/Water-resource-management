/**
 * UI Management Functions
 * @global
 */

/* global app, Chart */
const ui = {
    init() {
        this.setupNavigation();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                if (page && typeof app !== 'undefined') {
                    app.showPage(page);
                }
            });
        });
    },

    showPage(pageId) {
        try {
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });

            const targetPage = document.getElementById(`${pageId}-page`);
            if (targetPage) {
                targetPage.classList.add('active');
            } else {
                console.warn(`Page not found: ${pageId}-page`);
                return;
            }

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[data-page="${pageId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            if (pageId === 'output' && typeof app !== 'undefined') app.updateReports();
            if (pageId === 'analytics' && typeof app !== 'undefined') app.updateAnalytics();
        } catch (error) {
            console.error('Show page error:', error);
        }
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
        text.textContent = this.escapeHtml(message || '');
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
                    <div class="col-md-6">
                        <div class="card text-white bg-gradient-primary">
                            <div class="card-body text-center">
                                <h3>${latest.ph?.toFixed(2) || 'N/A'}</h3>
                                <p class="mb-0">pH Level</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card text-white bg-gradient-danger">
                            <div class="card-body text-center">
                                <h3>${latest.heavyMetal?.toFixed(0) || 'N/A'}</h3>
                                <p class="mb-0">Lead (PPM)</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (latestDetails && latest) {
                const safeLocation = this.escapeHtml(latest.location || 'Unknown');
                const safeTimestamp = latest.timestamp ? new Date(latest.timestamp).toLocaleString() : 'Unknown';
                
                latestDetails.innerHTML = `
                    <div class="card border-0 bg-light mb-3">
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <h6 class="text-primary"><i class="bi bi-geo-alt"></i> Location</h6>
                                    <p class="fs-5 mb-0">${safeLocation}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary"><i class="bi bi-clock"></i> Time</h6>
                                    <p class="fs-5 mb-0">${safeTimestamp}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="card border-primary">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">pH Level</h6>
                                    <h3 class="text-primary mb-0">${latest.ph?.toFixed(2)}</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-danger">
                                <div class="card-body text-center">
                                    <h6 class="text-muted mb-2">Lead Level</h6>
                                    <h3 class="text-danger mb-0">${latest.heavyMetal?.toFixed(0)} PPM</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Update Heavy Metal Analysis
            if (nutrientBars) {
                nutrientBars.innerHTML = `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><strong>pH Level</strong></span>
                            <span>${latest.ph?.toFixed(2)}</span>
                        </div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-primary" style="width: ${(latest.ph / 14) * 100}%">${latest.ph?.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="mb-0">
                        <div class="d-flex justify-content-between mb-1">
                            <span><strong>Lead Level</strong></span>
                            <span>${latest.heavyMetal?.toFixed(0)} PPM</span>
                        </div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-danger" style="width: ${Math.min((latest.heavyMetal / 500) * 100, 100)}%">${latest.heavyMetal?.toFixed(0)}</div>
                        </div>
                    </div>
                `;
            }
            
            // Update Parameter Trends Chart
            if (trendChart && typeof Chart !== 'undefined') {
                try {
                    const ctx = trendChart.getContext('2d');
                    if (window.dashboardTrendChart) {
                        window.dashboardTrendChart.destroy();
                    }
                    
                    // Show more readings for better trend visualization
                    const chartReadings = readings.length > 15 ? readings.slice(-15) : readings;
                    const labels = chartReadings.map((r, index) => `Reading ${index + 1}`);
                    const phData = chartReadings.map(r => r.ph || 0);
                    const heavyMetalData = chartReadings.map(r => r.heavyMetal || 0);
                    
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
                                    label: 'Lead (PPM)',
                                    data: heavyMetalData,
                                    borderColor: '#dc3545',
                                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
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
                } catch (error) {
                    console.error('Chart creation error:', error);
                }
            }
        } else {
            if (metricCards) {
                metricCards.innerHTML = '<div class="col-12"><div class="alert alert-info">No data available. Add readings to see metrics.</div></div>';
            }
            if (latestDetails) {
                latestDetails.innerHTML = '<p class="text-muted text-center py-3">No readings available. Add data to begin monitoring.</p>';
            }
            if (nutrientBars) {
                nutrientBars.innerHTML = '<p class="text-muted">No parameter data available</p>';
            }
            // Clear existing chart
            if (window.dashboardTrendChart) {
                window.dashboardTrendChart.destroy();
                window.dashboardTrendChart = null;
            }
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => ui.init());