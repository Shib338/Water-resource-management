/**
 * Enhanced Validation System
 * @global
 */

const validation = {
    // Water quality parameter ranges
    RANGES: {
        ph: { min: 0, max: 14, safeMin: 6.5, safeMax: 8.5, absoluteMin: 0, absoluteMax: 14 },
        heavyMetal: { min: 0, max: 10000, safeMin: 10, safeMax: 500, absoluteMin: 0, absoluteMax: 10000 },
        location: { minLength: 1, maxLength: 100 }
    },

    // Validate individual reading
    validateReading(reading) {
        const errors = [];
        
        if (!reading || typeof reading !== 'object') {
            errors.push('Invalid reading data');
            return { isValid: false, errors };
        }

        // Validate pH
        if (typeof reading.ph !== 'number' || isNaN(reading.ph)) {
            errors.push('pH must be a valid number');
        } else if (reading.ph < this.RANGES.ph.min || reading.ph > this.RANGES.ph.max) {
            errors.push(`pH must be between ${this.RANGES.ph.min} and ${this.RANGES.ph.max}`);
        }

        // Validate heavy metal
        if (typeof reading.heavyMetal !== 'number' || isNaN(reading.heavyMetal)) {
            errors.push('Heavy metal level must be a valid number');
        } else if (reading.heavyMetal < this.RANGES.heavyMetal.min || reading.heavyMetal > this.RANGES.heavyMetal.max) {
            errors.push(`Heavy metal level must be between ${this.RANGES.heavyMetal.min} and ${this.RANGES.heavyMetal.max} PPM`);
        }

        // Validate location
        if (!reading.location || typeof reading.location !== 'string') {
            errors.push('Location is required');
        } else {
            const location = reading.location.trim();
            if (location.length < this.RANGES.location.minLength) {
                errors.push('Location cannot be empty');
            } else if (location.length > this.RANGES.location.maxLength) {
                errors.push(`Location must be less than ${this.RANGES.location.maxLength} characters`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: this.getWarnings(reading)
        };
    },

    // Get safety warnings
    getWarnings(reading) {
        const warnings = [];
        
        if (reading.ph < this.RANGES.ph.safeMin || reading.ph > this.RANGES.ph.safeMax) {
            warnings.push(`pH level ${reading.ph} is outside safe range (${this.RANGES.ph.safeMin}-${this.RANGES.ph.safeMax})`);
        }
        
        if (reading.heavyMetal > this.RANGES.heavyMetal.safeMax) {
            warnings.push(`Heavy Metal level ${reading.heavyMetal} PPM exceeds safe limit (${this.RANGES.heavyMetal.safeMax} PPM)`);
        }

        return warnings;
    },

    // Sanitize reading data
    sanitizeReading(reading) {
        if (!reading) return null;

        return {
            ph: this.sanitizeNumber(reading.ph, this.RANGES.ph.min, this.RANGES.ph.max),
            heavyMetal: this.sanitizeNumber(reading.heavyMetal, this.RANGES.heavyMetal.min, this.RANGES.heavyMetal.max),
            location: this.sanitizeString(reading.location, this.RANGES.location.maxLength),
            timestamp: reading.timestamp || new Date().toISOString(),
            id: reading.id || Date.now()
        };
    },

    sanitizeNumber(value, min, max) {
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        return Math.max(min, Math.min(max, num));
    },

    sanitizeString(value, maxLength) {
        if (typeof value !== 'string') return '';
        return value.trim().substring(0, maxLength);
    }
};

window.validation = validation;