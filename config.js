/**
 * Configuration Settings
 */

const CONFIG = {
    // Application settings
    APP_NAME: 'Water Resource Management System',
    VERSION: '1.0.0',
    
    // Storage key for localStorage
    STORAGE_KEY: 'waterQualityReadings',
    
    // Parameter ranges for validation
    RANGES: {
        ph: { min: 6.5, max: 8.5, unit: '' },
        hydrogenSulfide: { min: 0.05, max: 0.1, unit: 'mg/L' },
        turbidity: { min: 0, max: 5, unit: 'NTU' },
        nitrogen: { min: 0, max: 10, unit: 'mg/L' },
        copper: { min: 0.05, max: 2.0, unit: 'mg/L' },
        dissolvedOxygen: { min: 5, max: 14, unit: 'mg/L' },
        temperature: { min: 15, max: 30, unit: '°C' }
    },
    
    // Chart colors
    COLORS: {
        primary: '#667eea',
        success: '#38ef7d',
        info: '#00f2fe',
        warning: '#f093fb',
        danger: '#f5576c',
        secondary: '#764ba2',
        dark: '#2c3e50'
    },
    
    // Gradients
    GRADIENTS: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #00f2fe 100%)',
        warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        danger: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    }
};

// Data Manager for localStorage operations
const DataManager = {
    // Save data to localStorage
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Save error:', error);
            return false;
        }
    },
    
    // Load data from localStorage
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
    },
    
    // Remove data from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Remove error:', error);
            return false;
        }
    },
    
    // Clear all data
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Clear error:', error);
            return false;
        }
    }
};

// Utility functions
const Utils = {
    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    },
    
    // Format time
    formatTime(date) {
        return new Date(date).toLocaleTimeString();
    },
    
    // Validate parameter value
    validateParameter(param, value) {
        const range = CONFIG.RANGES[param];
        if (!range) return true;
        
        const numValue = parseFloat(value);
        return numValue >= range.min && numValue <= range.max;
    },
    
    // Get parameter status
    getParameterStatus(param, value) {
        return this.validateParameter(param, value) ? 'normal' : 'alert';
    },
    
    // Calculate water quality index
    calculateWQI(reading) {
        const weights = {
            ph: 0.2,
            dissolvedOxygen: 0.3,
            turbidity: 0.2,
            temperature: 0.1,
            hydrogenSulfide: 0.1,
            nitrogen: 0.05,
            copper: 0.05
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        Object.entries(weights).forEach(([param, weight]) => {
            if (reading[param] !== undefined) {
                const score = this.validateParameter(param, reading[param]) ? 100 : 50;
                totalScore += score * weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    },
    
    // Get WQI status
    getWQIStatus(wqi) {
        if (wqi >= 90) return { status: 'Excellent', color: 'success' };
        if (wqi >= 70) return { status: 'Good', color: 'info' };
        if (wqi >= 50) return { status: 'Fair', color: 'warning' };
        return { status: 'Poor', color: 'danger' };
    }
};