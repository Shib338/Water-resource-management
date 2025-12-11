// Simple Firebase Configuration
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
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase error:', error);
        console.log('⚠️ Using localStorage fallback');
    }
} else {
    console.log('⚠️ Firebase SDK not loaded - Using localStorage');
}

// Simple Database Functions
const FirebaseDB = {
    async saveReading(reading) {
        // Always use localStorage for reliability
        try {
            const readings = this.loadFromLocalStorage();
            const newReading = {
                ...reading,
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            };
            readings.push(newReading);
            localStorage.setItem('waterQualityReadings', JSON.stringify(readings));
            console.log('✅ Data saved successfully');
            
            // Try to save to Firebase in background
            if (isFirebaseEnabled && db) {
                try {
                    await db.collection('waterQualityReadings').add(newReading);
                    console.log('✅ Also saved to cloud');
                } catch (e) {
                    console.log('⚠️ Cloud save failed, but localStorage worked');
                }
            }
            return true;
        } catch (error) {
            console.error('Save error:', error);
            return false;
        }
    },

    async loadReadings() {
        return this.loadFromLocalStorage();
    },

    async deleteReading(id) {
        try {
            const readings = this.loadFromLocalStorage();
            const filtered = readings.filter(r => r.id !== id);
            localStorage.setItem('waterQualityReadings', JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    },

    async clearAllData() {
        try {
            localStorage.removeItem('waterQualityReadings');
            console.log('✅ All data cleared');
            return true;
        } catch (error) {
            console.error('Clear error:', error);
            return false;
        }
    },

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('waterQualityReadings');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Load error:', error);
            return [];
        }
    }
};

window.FirebaseDB = FirebaseDB;
window.isFirebaseEnabled = isFirebaseEnabled;