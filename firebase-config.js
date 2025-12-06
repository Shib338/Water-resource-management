/**
 * Firebase Configuration - Cloud Database
 * Replace with your Firebase project credentials
 */

// Firebase configuration - CONNECTED TO CLOUD DATABASE
const firebaseConfig = {
    apiKey: "AIzaSyCLVGuidDrlvPe_mQzpt-0h7tT6es17WII",
    authDomain: "water-resource-managemen-e9556.firebaseapp.com",
    projectId: "water-resource-managemen-e9556",
    storageBucket: "water-resource-managemen-e9556.firebasestorage.app",
    messagingSenderId: "637624967246",
    appId: "1:637624967246:web:6e3979bbb0931e1f0de31f",
    measurementId: "G-92MZ6DL486"
};

// Initialize Firebase
let db = null;
let isFirebaseEnabled = false;

try {
    // Check if config is set
    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isFirebaseEnabled = true;
        console.log('✅ Firebase connected - Cloud storage active');
    } else {
        console.log('⚠️ Firebase not configured - Using localStorage fallback');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    console.log('⚠️ Using localStorage fallback');
}

// Database helper functions
const FirebaseDB = {
    // Save reading to cloud
    async saveReading(reading) {
        if (!isFirebaseEnabled) {
            return this.saveToLocalStorage(reading);
        }

        try {
            await db.collection('waterQualityReadings').add({
                ...reading,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Data saved to cloud');
            return true;
        } catch (error) {
            console.error('Cloud save error:', error);
            return this.saveToLocalStorage(reading);
        }
    },

    // Load all readings from cloud
    async loadReadings() {
        if (!isFirebaseEnabled) {
            return this.loadFromLocalStorage();
        }

        try {
            const snapshot = await db.collection('waterQualityReadings')
                .orderBy('timestamp', 'desc')
                .limit(1000)
                .get();

            const readings = [];
            snapshot.forEach(doc => {
                readings.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Loaded ${readings.length} readings from cloud`);
            return readings;
        } catch (error) {
            console.error('Cloud load error:', error);
            return this.loadFromLocalStorage();
        }
    },

    // Delete reading from cloud
    async deleteReading(id) {
        if (!isFirebaseEnabled) {
            return false;
        }

        try {
            await db.collection('waterQualityReadings').doc(id).delete();
            console.log('✅ Reading deleted from cloud');
            return true;
        } catch (error) {
            console.error('Cloud delete error:', error);
            return false;
        }
    },

    // Clear all data
    async clearAllData() {
        if (!isFirebaseEnabled) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return true;
        }

        try {
            const snapshot = await db.collection('waterQualityReadings').get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log('✅ All cloud data cleared');
            return true;
        } catch (error) {
            console.error('Cloud clear error:', error);
            return false;
        }
    },

    // Fallback: Save to localStorage
    saveToLocalStorage(reading) {
        try {
            const readings = this.loadFromLocalStorage();
            readings.push(reading);
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(readings));
            return true;
        } catch (error) {
            console.error('localStorage save error:', error);
            return false;
        }
    },

    // Fallback: Load from localStorage
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('localStorage load error:', error);
            return [];
        }
    }
};

// Export for use in app.js
window.FirebaseDB = FirebaseDB;
window.isFirebaseEnabled = isFirebaseEnabled;