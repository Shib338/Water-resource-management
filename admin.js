/**
 * Admin Panel - NO AUTO-LOGIN - Version 2025-01-21
 * @global
 */

/* global ui, FirebaseDB, app, bootstrap */
const admin = {
    isAdminMode: false,
    isLoggedIn: false,
    allData: [],
    filteredData: [],
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'WaterAdmin@2024',
    MAX_LOGIN_ATTEMPTS: 3,
    loginAttempts: 0,
    lockoutTime: null,

    init() {
        
        // Force logout state
        this.isLoggedIn = false;
        this.isAdminMode = false;
        
        // Hide admin elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show public elements
        document.querySelectorAll('.public-only').forEach(el => {
            el.style.display = '';
        });
        
        // Set button text
        const adminText = document.getElementById('adminText');
        if (adminText) adminText.textContent = 'Admin';
        
        // Setup admin button click
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        // Setup login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('adminUser').value;
                const password = document.getElementById('adminPass').value;
                this.login(username, password);
            });
        }
        
    },

    showLoginModal() {
        
        if (this.isLoggedIn) {
            // Logout
            this.logout();
            return;
        }
        
        // Show modal
        const modalEl = document.getElementById('loginModal');
        if (!modalEl) {
            alert('Login modal not found');
            return;
        }
        
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    },

    async login(username, password) {
        
        // Check for lockout
        if (this.lockoutTime && Date.now() < this.lockoutTime) {
            const remainingTime = Math.ceil((this.lockoutTime - Date.now()) / 1000);
            if (typeof ui !== 'undefined') {
                ui.showNotification(`Account locked. Try again in ${remainingTime} seconds.`, 'error');
            }
            return;
        }
        
        // Input validation
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            this.handleFailedLogin();
            return;
        }
        
        if (username.trim() === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
            this.loginAttempts = 0;
            this.lockoutTime = null;
            this.isLoggedIn = true;
            this.isAdminMode = true;
            
            // Show admin elements
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
            });
            
            // Hide public elements
            document.querySelectorAll('.public-only').forEach(el => {
                el.style.display = 'none';
            });
            
            // Update button
            const adminText = document.getElementById('adminText');
            if (adminText) adminText.textContent = 'Logout';
            
            // Close modal
            const modalEl = document.getElementById('loginModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            
            // Load data
            await this.loadAdminData();
            
            if (typeof ui !== 'undefined') {
                ui.showNotification('✅ Admin login successful!', 'success');
            }
        } else {
            this.handleFailedLogin();
        }
    },
    
    handleFailedLogin() {
        this.loginAttempts++;
        
        if (this.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
            this.lockoutTime = Date.now() + (5 * 60 * 1000); // 5 minute lockout
            if (typeof ui !== 'undefined') {
                ui.showNotification('❌ Too many failed attempts. Account locked for 5 minutes.', 'error');
            }
        } else {
            const remaining = this.MAX_LOGIN_ATTEMPTS - this.loginAttempts;
            if (typeof ui !== 'undefined') {
                ui.showNotification(`❌ Invalid credentials! ${remaining} attempts remaining.`, 'error');
            }
        }
    },

    logout() {
        
        this.isLoggedIn = false;
        this.isAdminMode = false;
        this.loginAttempts = 0;
        this.lockoutTime = null;
        
        // Hide admin elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show public elements
        document.querySelectorAll('.public-only').forEach(el => {
            el.style.display = '';
        });
        
        // Update button
        const adminText = document.getElementById('adminText');
        if (adminText) adminText.textContent = 'Admin';
        
        if (typeof ui !== 'undefined') {
            ui.showNotification('Logged out', 'info');
        }
    },

    async loadAdminData() {
        try {
            if (typeof FirebaseDB !== 'undefined') {
                this.allData = await FirebaseDB.loadReadings();
                this.filteredData = [...this.allData];
            }
            if (typeof app !== 'undefined' && app.loadData) {
                await app.loadData();
            }
            
            // Update admin statistics
            this.updateAdminStats();
            

        } catch (error) {
            this.allData = [];
            this.filteredData = [];
        }
    },
    
    updateAdminStats() {
        const totalEl = document.getElementById('totalRecords');
        const normalEl = document.getElementById('normalRecords');
        const alertEl = document.getElementById('alertRecords');
        
        if (totalEl) totalEl.textContent = this.allData.length;
        
        if (normalEl && alertEl) {
            const normal = this.allData.filter(r => 
                r.ph >= 6.5 && r.ph <= 8.5 && r.heavyMetal >= 50 && r.heavyMetal <= 300
            ).length;
            const alert = this.allData.length - normal;
            
            normalEl.textContent = normal;
            alertEl.textContent = alert;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    admin.init();
});

window.admin = admin;
