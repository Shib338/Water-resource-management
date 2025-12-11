/**
 * Configuration Settings - Secure Implementation
 * @global
 */

/* global CONFIG */
const CONFIG = Object.freeze({
    APP_NAME: 'Water Resource Management System',
    VERSION: '1.0.1',
    STORAGE_KEY: 'waterQualityReadings',
    MAX_READINGS: 1000,
    MAX_LOCATION_LENGTH: 100,
    
    RANGES: Object.freeze({
        ph: Object.freeze({ min: 6.5, max: 8.5, unit: '', absoluteMin: 0, absoluteMax: 14 }),
        heavyMetal: Object.freeze({ min: 10, max: 500, unit: 'PPM', absoluteMin: 0, absoluteMax: 10000 })
    }),
    
    VALIDATION: Object.freeze({
        validateReading(reading) {
            if (!reading || typeof reading !== 'object') return false;
            
            const ph = parseFloat(reading.ph);
            const heavyMetal = parseFloat(reading.heavyMetal);
            const location = reading.location;
            
            return (
                !isNaN(ph) && ph >= 0 && ph <= 14 &&
                !isNaN(heavyMetal) && heavyMetal >= 0 && heavyMetal <= 1000 &&
                typeof location === 'string' && location.trim().length > 0 && location.length <= 100
            );
        },
        
        sanitizeReading(reading) {
            if (!this.validateReading(reading)) return null;
            
            return {
                ph: Math.round(parseFloat(reading.ph) * 100) / 100,
                heavyMetal: Math.round(parseFloat(reading.heavyMetal) * 1000) / 1000,
                location: reading.location.trim().substring(0, 100)
            };
        }
    })
});

window.CONFIG = CONFIG;