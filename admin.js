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
        console.log('🔒 Admin init - Starting logged OUT');
        
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
        
        console.log('✅ Admin ready - logged out');
    },

    showLoginModal() {
        console.log('🔐 Showing login modal - isLoggedIn:', this.isLoggedIn);
        
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
        } else {
            console.error('Bootstrap not loaded');
        }
        console.log('📋 Login modal displayed');
    },

    async login(username, password) {
        console.log('🔑 Login attempt for:', username);
        
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
            console.log('✅ Admin logged in');
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
        console.log('❌ Login failed');
    },

    logout() {
        console.log('🚪 Logging out');
        
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
            console.log('📊 Admin data loaded:', this.allData.length, 'readings');
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.allData = [];
            this.filteredData = [];
        }
    }
};

// Initialize ONLY when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM ready - initializing admin');
    admin.init();
});

window.admin = admin;
