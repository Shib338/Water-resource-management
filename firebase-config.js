// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCLVGuidDrlvPe_mQzpt-0h7tT6es17WII",
    authDomain: "water-resource-managemen-e9556.firebaseapp.com",
    projectId: "water-resource-managemen-e9556",
    storageBucket: "water-resource-managemen-e9556.appspot.com",
    messagingSenderId: "637624967246",
    appId: "1:637624967246:web:6e3979bbb0931e1f0de31f"
};

let db = null;
let isFirebaseEnabled = false;

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isFirebaseEnabled = true;
    } catch (error) {
        // Firebase failed, use localStorage
    }
}

// Database Functions
const FirebaseDB = {
    async saveReading(reading) {
        if (!reading) return false;
        
        try {
            // Always save to localStorage
            const readings = this.loadFromLocalStorage();
            const sanitizedReading = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                location: reading.location?.trim() || '',
                ph: parseFloat(reading.ph) || 0,
                heavyMetal: parseFloat(reading.heavyMetal) || 0,
                source: 'manual'
            };
            
            readings.push(sanitizedReading);
            localStorage.setItem('waterQualityReadings', JSON.stringify(readings));
            
            // Try Firebase
            if (isFirebaseEnabled && db) {
                try {
                    await db.collection('waterQualityReadings').add(sanitizedReading);
                } catch (e) {
                    // Firebase failed but localStorage worked
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    },

    async loadReadings() {
        return this.loadFromLocalStorage();
    },

    async clearAllData() {
        try {
            localStorage.removeItem('waterQualityReadings');
            return true;
        } catch (error) {
            return false;
        }
    },

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('waterQualityReadings');
            if (!stored) return [];
            
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
};

window.FirebaseDB = FirebaseDB;
window.isFirebaseEnabled = isFirebaseEnabled;