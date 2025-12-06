const Auth = {
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'WaterAdmin@2024',
    isLoggedIn: false,

    init() {
        this.checkSession();
        this.setupEvents();
        this.updateUI();
    },

    checkSession() {
        const session = sessionStorage.getItem('adminAuth');
        if (session) {
            try {
                const data = JSON.parse(session);
                if (data.username === this.ADMIN_USERNAME) {
                    this.isLoggedIn = true;
                }
            } catch (e) {
                sessionStorage.removeItem('adminAuth');
            }
        }
    },

    setupEvents() {
        document.getElementById('adminBtn').onclick = () => {
            if (this.isLoggedIn) {
                this.logout();
            } else {
                const modal = new bootstrap.Modal(document.getElementById('loginModal'));
                modal.show();
            }
        };

        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();
            this.handleLogin();
        };
    },

    handleLogin() {
        const username = document.getElementById('adminUser').value.trim();
        const password = document.getElementById('adminPass').value;

        if (username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
            this.isLoggedIn = true;
            sessionStorage.setItem('adminAuth', JSON.stringify({ username, loginTime: new Date().toISOString() }));
            
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            document.getElementById('loginForm').reset();
            this.updateUI();
            
            if (window.ui) ui.showNotification('Login successful!', 'success');
        } else {
            if (window.ui) ui.showNotification('Invalid credentials!', 'danger');
        }
    },

    logout() {
        if (confirm('Logout?')) {
            this.isLoggedIn = false;
            sessionStorage.removeItem('adminAuth');
            this.updateUI();
            if (window.ui) ui.showNotification('Logged out', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    },

    updateUI() {
        const adminText = document.getElementById('adminText');
        const adminBtn = document.getElementById('adminBtn');
        const adminElements = document.querySelectorAll('.admin-only');

        if (this.isLoggedIn) {
            adminText.textContent = 'Logout';
            adminBtn.classList.remove('btn-outline-light');
            adminBtn.classList.add('btn-light');
            adminElements.forEach(el => el.style.display = 'block');
        } else {
            adminText.textContent = 'Admin';
            adminBtn.classList.remove('btn-light');
            adminBtn.classList.add('btn-outline-light');
            adminElements.forEach(el => el.style.display = 'none');
        }
    }
};

window.Auth = Auth;
window.addEventListener('load', () => Auth.init());
