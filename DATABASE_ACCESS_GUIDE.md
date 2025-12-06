# 🔐 Database Access Guide for Developers

## 📍 Where Your Data is Stored

Your water quality data is stored in **Firebase Firestore** (Google Cloud Database):
- **Collection Name**: `waterReadings`
- **Location**: Google Cloud servers (your selected region)
- **Access**: Via Firebase Console or programmatically

---

## 🌐 How to Access Your Database

### **Method 1: Firebase Console (Web Interface)** ⭐ EASIEST

1. **Go to Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **Login** with your Google account

3. **Select your project** (e.g., "water-quality-monitor")

4. **Navigate to Firestore Database**
   - Click "Firestore Database" in left sidebar
   - You'll see your `waterReadings` collection

5. **View All Data**
   - Click on `waterReadings` collection
   - See all documents (each reading is a document)
   - Click any document to view/edit details

6. **Edit Data**
   - Click on any document
   - Click the pencil icon next to any field
   - Modify the value
   - Press Enter to save

7. **Delete Data**
   - Click on a document
   - Click the three dots menu (⋮)
   - Select "Delete document"

8. **Export Data**
   - Click "Import/Export" at top
   - Select "Export"
   - Choose GCS bucket or download

---

### **Method 2: Browser Console (Developer Tools)**

1. **Open your application** in browser
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Run these commands**:

```javascript
// View all readings
FirebaseDB.loadReadings().then(data => console.table(data));

// Count total readings
FirebaseDB.loadReadings().then(data => console.log('Total readings:', data.length));

// View latest reading
FirebaseDB.loadReadings().then(data => console.log('Latest:', data[data.length - 1]));

// Delete specific reading by ID
FirebaseDB.deleteReading('DOCUMENT_ID_HERE');

// Clear all data (CAREFUL!)
FirebaseDB.clearAllData();
```

---

### **Method 3: Admin Panel (Add to Your App)**

I'll create an admin panel for you to manage data directly in your application.

---

## 🔧 Database Structure

### **Collection**: `waterReadings`

Each document contains:
```javascript
{
  id: "auto-generated-id",
  timestamp: "2024-01-15T10:30:00.000Z",
  location: "Lake District",
  ph: 7.2,
  hydrogenSulfide: 0.08,
  turbidity: 2.5,
  nitrogen: 5.2,
  copper: 1.1,
  oxygen: 8.5,
  temperature: 22.3,
  notes: "Morning sample"
}
```

---

## 👨‍💻 Developer Access Methods

### **1. Firebase Admin SDK (Node.js)**

For backend/server access:

```javascript
const admin = require('firebase-admin');

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json')
});

const db = admin.firestore();

// Get all readings
const snapshot = await db.collection('waterReadings').get();
snapshot.forEach(doc => {
  console.log(doc.id, '=>', doc.data());
});

// Query specific data
const query = await db.collection('waterReadings')
  .where('location', '==', 'Lake District')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();

// Update document
await db.collection('waterReadings').doc('DOCUMENT_ID').update({
  ph: 7.5,
  notes: 'Updated value'
});

// Delete document
await db.collection('waterReadings').doc('DOCUMENT_ID').delete();
```

### **2. REST API Access**

Direct HTTP requests to Firestore:

```bash
# Get all documents
curl "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/waterReadings"

# Get specific document
curl "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/waterReadings/DOCUMENT_ID"
```

### **3. Firebase CLI**

Command-line access:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Export data
firebase firestore:export gs://your-bucket/backup

# Import data
firebase firestore:import gs://your-bucket/backup
```

---

## 🔐 Get Service Account Key (For Backend Access)

1. **Go to Firebase Console**
2. **Click Settings ⚙️** (top left) → **Project settings**
3. **Go to "Service accounts" tab**
4. **Click "Generate new private key"**
5. **Download JSON file** (keep it SECRET!)
6. **Use this file** for admin SDK authentication

---

## 📊 Database Security Rules

Current rules (from FIREBASE_SETUP.md):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /waterReadings/{document=**} {
      allow read, write: if true;  // Public access
    }
  }
}
```

### **Secure Rules (Recommended for Production)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /waterReadings/{document=**} {
      // Only authenticated users can read/write
      allow read, write: if request.auth != null;
    }
  }
}
```

To update rules:
1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Edit and publish new rules

---

## 🛠️ Useful Database Operations

### **Backup Your Data**

```javascript
// In browser console
FirebaseDB.loadReadings().then(data => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString()}.json`;
  a.click();
});
```

### **Import Data**

```javascript
// Prepare your data array
const dataToImport = [
  { ph: 7.2, temperature: 22, ... },
  { ph: 7.5, temperature: 23, ... }
];

// Import each reading
for (const reading of dataToImport) {
  await FirebaseDB.saveReading(reading);
}
```

### **Query Specific Data**

```javascript
// Get readings from specific location
const allReadings = await FirebaseDB.loadReadings();
const lakeReadings = allReadings.filter(r => r.location === 'Lake District');

// Get readings from last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const recentReadings = allReadings.filter(r => new Date(r.timestamp) > sevenDaysAgo);
```

---

## 📈 Database Monitoring

### **Check Database Usage**

1. Go to Firebase Console
2. Click "Usage" tab
3. View:
   - Document reads/writes
   - Storage used
   - Network bandwidth

### **Free Tier Limits**

- **Storage**: 1 GB
- **Document Reads**: 50,000/day
- **Document Writes**: 20,000/day
- **Document Deletes**: 20,000/day

---

## 🚨 Troubleshooting

### **Can't See Data?**

1. Check Firebase configuration in `firebase-config.js`
2. Verify Firestore is enabled in Firebase Console
3. Check browser console for errors
4. Verify security rules allow access

### **Permission Denied?**

1. Check Firestore security rules
2. Make sure rules allow read/write
3. Update rules if needed

### **Data Not Syncing?**

1. Check internet connection
2. Verify Firebase SDK loaded (check browser console)
3. Check for JavaScript errors
4. Try clearing browser cache

---

## 🎯 Quick Access Links

- **Firebase Console**: https://console.firebase.google.com/
- **Firestore Documentation**: https://firebase.google.com/docs/firestore
- **Admin SDK Guide**: https://firebase.google.com/docs/admin/setup
- **Security Rules**: https://firebase.google.com/docs/firestore/security/get-started

---

## 💡 Pro Tips

1. **Regular Backups**: Export data weekly
2. **Monitor Usage**: Check Firebase console regularly
3. **Secure Rules**: Use authentication in production
4. **Index Queries**: Add indexes for complex queries
5. **Test First**: Use Firebase emulator for testing

---

**Need Help?** Check Firebase documentation or contact your development team.

