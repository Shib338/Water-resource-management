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
                if (page) {
                    this.showPage(page);
                }
            });
        });
    },

    showPage(pageId) {
        try {
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });

            // Show target page
            const targetPage = document.getElementById(`${pageId}-page`);
            if (targetPage) {
                targetPage.classList.add('active');
            } else {
                // Fallback to dashboard if page not found
                const dashboardPage = document.getElementById('dashboard-page');
                if (dashboardPage) {
                    dashboardPage.classList.add('active');
                }
                return;
            }

            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[data-page="${pageId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            // Update page content
            if (pageId === 'output' && typeof app !== 'undefined') app.updateReports();
            if (pageId === 'analytics' && typeof app !== 'undefined') app.updateAnalytics();
        } catch (error) {
            // Show dashboard as fallback
            const dashboardPage = document.getElementById('dashboard-page');
            if (dashboardPage) {
                dashboardPage.classList.add('active');
            }
        }
    },

    showNotification(message, type = 'info') {
        // Only show essential notifications
        if (type !== 'error' && type !== 'warning' && type !== 'danger' && 
            !message.includes('Alert') && !message.includes('saved') && !message.includes('cleared')) {
            return; // Skip non-essential notifications
        }

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
        
        if (readings && readings.length > 0) {
            const latest = readings[readings.length - 1];
            

            
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
                                    <h6 class="text-muted mb-2">Heavy Metal Level</h6>
                                    <h3 class="text-danger mb-0">${latest.heavyMetal?.toFixed(0)} PPM</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            

        } else {

            if (latestDetails) {
                latestDetails.innerHTML = `
                    <div class="alert alert-info text-center">
                        <i class="bi bi-info-circle fs-1 mb-3"></i>
                        <h5>No Water Quality Data</h5>
                        <p class="mb-0">Add your first reading to start monitoring water quality parameters.</p>
                    </div>
                `;
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
window.ui = ui;