/**
 * Enhanced Notification System
 * @global
 */

const notifications = {
    queue: [],
    isProcessing: false,

    // Show notification with enhanced features - only for critical messages
    show(message, type = 'info', duration = 5000, actions = []) {
        // Only show critical notifications (errors, warnings, and important success messages)
        if (type !== 'error' && type !== 'warning' && type !== 'danger' && 
            !message.includes('Alert') && !message.includes('saved') && !message.includes('cleared')) {
            return; // Skip non-essential notifications
        }

        const notification = {
            id: Date.now(),
            message: this.sanitizeMessage(message),
            type: this.validateType(type),
            duration,
            actions,
            timestamp: new Date()
        };

        this.queue.push(notification);
        this.processQueue();
    },

    // Process notification queue
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.queue.length > 0) {
            const notification = this.queue.shift();
            await this.displayNotification(notification);
        }
        
        this.isProcessing = false;
    },

    // Display individual notification
    async displayNotification(notification) {
        const container = this.getOrCreateContainer();
        const element = this.createNotificationElement(notification);
        
        container.appendChild(element);
        
        // Animate in
        setTimeout(() => element.classList.add('show'), 100);
        
        // Auto-remove after duration
        if (notification.duration > 0) {
            setTimeout(() => this.removeNotification(element), notification.duration);
        }
        
        return new Promise(resolve => {
            setTimeout(resolve, 300); // Wait for animation
        });
    },

    // Create notification element
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `alert alert-${notification.type} alert-dismissible fade notification-item`;
        element.setAttribute('data-id', notification.id);
        
        const icon = this.getIcon(notification.type);
        
        element.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${icon} me-2"></i>
                <span class="flex-grow-1">${notification.message}</span>
                ${this.createActions(notification.actions)}
                <button type="button" class="btn-close" onclick="notifications.removeNotification(this.parentElement.parentElement)"></button>
            </div>
        `;
        
        return element;
    },

    // Create action buttons
    createActions(actions) {
        if (!actions || actions.length === 0) return '';
        
        return actions.map(action => 
            `<button class="btn btn-sm btn-outline-${action.type || 'primary'} me-2" onclick="${action.onclick}">${action.text}</button>`
        ).join('');
    },

    // Get or create notification container
    getOrCreateContainer() {
        let container = document.getElementById('notificationContainer');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 1050;
                max-width: 400px;
                width: 100%;
            `;
            document.body.appendChild(container);
        }
        
        return container;
    },

    // Remove notification
    removeNotification(element) {
        if (!element) return;
        
        element.classList.remove('show');
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    },

    // Get icon for notification type
    getIcon(type) {
        const icons = {
            success: 'bi bi-check-circle-fill',
            error: 'bi bi-exclamation-triangle-fill',
            warning: 'bi bi-exclamation-circle-fill',
            info: 'bi bi-info-circle-fill',
            danger: 'bi bi-x-circle-fill'
        };
        return icons[type] || icons.info;
    },

    // Validate notification type
    validateType(type) {
        const validTypes = ['success', 'error', 'warning', 'info', 'danger'];
        return validTypes.includes(type) ? type : 'info';
    },

    // Sanitize message
    sanitizeMessage(message) {
        if (typeof message !== 'string') return 'Invalid message';
        return message.substring(0, 200); // Limit length
    },

    // Clear all notifications
    clearAll() {
        const container = document.getElementById('notificationContainer');
        if (container) {
            container.innerHTML = '';
        }
        this.queue = [];
    },

    // Show water quality alert
    showWaterQualityAlert(reading) {
        const warnings = [];
        
        if (reading.ph < 6.5 || reading.ph > 8.5) {
            warnings.push(`pH: ${reading.ph}`);
        }
        
        if (reading.heavyMetal > 500) {
            warnings.push(`Lead: ${reading.heavyMetal} PPM`);
        }
        
        if (warnings.length > 0) {
            this.show(
                `⚠️ Water Quality Alert: ${warnings.join(', ')} - Immediate attention required!`,
                'warning',
                10000,
                [
                    { text: 'View Details', onclick: 'ui.showPage("analytics")', type: 'warning' }
                ]
            );
        }
    }
};

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    .notification-container .notification-item {
        margin-bottom: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border: none;
    }
    
    .notification-item.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .notification-item {
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

window.notifications = notifications;