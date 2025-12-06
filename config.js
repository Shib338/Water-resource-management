/**
 * Configuration Settings
 */

const CONFIG = {
    APP_NAME: 'Water Resource Management System',
    VERSION: '1.0.0',
    STORAGE_KEY: 'waterQualityReadings',
    
    RANGES: {
        ph: { min: 6.5, max: 8.5, unit: '' },
        hydrogenSulfide: { min: 0.05, max: 0.1, unit: 'mg/L' },
        turbidity: { min: 0, max: 5, unit: 'NTU' },
        nitrogen: { min: 0, max: 10, unit: 'mg/L' },
        copper: { min: 0.05, max: 2.0, unit: 'mg/L' },
        oxygen: { min: 5, max: 14, unit: 'mg/L' },
        dissolvedOxygen: { min: 5, max: 14, unit: 'mg/L' },
        temperature: { min: 15, max: 30, unit: '°C' }
    }
};