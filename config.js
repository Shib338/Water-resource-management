/**
 * Configuration Settings
 * @global
 */

/* global CONFIG */
const CONFIG = {
    APP_NAME: 'Water Resource Management System',
    VERSION: '1.0.0',
    STORAGE_KEY: 'waterQualityReadings',
    
    RANGES: {
        ph: { min: 6.5, max: 8.5, unit: '' },
        heavyMetal: { min: 0.01, max: 0.5, unit: 'mg/L' }
    }
};