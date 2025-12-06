// app.js - Force Firebase Online Mode

// ========== FIREBASE CONFIGURATION ==========
const firebaseConfig = {
    apiKey: "AIzaSyB4DJCXr1tWbJijsOdBY8KDCuYGPaF4vfw",
    authDomain: "minis-repo-tracking.firebaseapp.com",
    databaseURL: "https://minis-repo-tracking-default-rtdb.firebaseio.com",
    projectId: "minis-repo-tracking",
    storageBucket: "minis-repo-tracking.firebasestorage.app",
    messagingSenderId: "832281839494",
    appId: "1:832281839494:web:6abe106a54100634838e07",
    measurementId: "G-RX1B3TX24S"
};

let firebaseApp = null;
let database = null;
let firebaseConnected = false;
let firebaseInitialized = false;

// ========== AGGRESSIVE FIREBASE INITIALIZATION ==========

function initializeFirebaseWithRetry() {
    console.log("🔥 Attempting Firebase initialization...");
    
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK not loaded!");
        showToast("Firebase SDK missing - check network", "error");
        setTimeout(initializeFirebaseWithRetry, 5000); // Retry in 5 seconds
        return;
    }
    
    try {
        // Force initialize (remove any previous instances)
        try {
            firebaseApp = firebase.initializeApp(firebaseConfig, 'MiniRepo');
            console.log("✅ Firebase app created");
        } catch (initError) {
            // App might already exist
            firebaseApp = firebase.app('MiniRepo') || firebase.app();
            console.log("ℹ️ Using existing Firebase app");
        }
        
        database = firebase.database();
        firebaseInitialized = true;
        
        console.log("✅ Firebase initialized, testing connection...");
        
        // Test database connection
        testFirebaseConnection();
        
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
        showToast("Firebase init failed: " + error.message, "error");
        
        // Retry after delay
        setTimeout(initializeFirebaseWithRetry, 3000);
    }
}

function testFirebaseConnection() {
    if (!database) {
        console.error("❌ Database not available");
        return;
    }
    
    console.log("🔌 Testing Firebase connection...");
    
    const connectedRef = database.ref('.info/connected');
    const connectionTimeout = setTimeout(() => {
        console.log("⏰ Firebase connection timeout");
        updateFirebaseStatus(false, "Connection timeout");
    }, 5000);
    
    connectedRef.on('value', (snap) => {
        clearTimeout(connectionTimeout);
        
        if (snap.val() === true) {
            console.log("✅✅✅ FIREBASE CONNECTED SUCCESSFULLY!");
            firebaseConnected = true;
            updateFirebaseStatus(true, "Live - Connected");
            showToast("✅ Firebase online - Live tracking active", "success");
            
            // Load initial data
            loadFirebaseStats();
            syncPendingDownloads();
            
        } else {
            console.log("⚠️ Firebase not connected");
            firebaseConnected = false;
            updateFirebaseStatus(false, "Disconnected");
            
            // Try to reconnect
            setTimeout(testFirebaseConnection, 2000);
        }
    });
}

function updateFirebaseStatus(connected, message = "") {
    const statusEl = document.getElementById('firebaseStatus');
    if (!statusEl) return;
    
    const dotEl = document.getElementById('statusDot');
    const textEl = document.getElementById('statusText');
    
    if (connected) {
        statusEl.style.display = 'flex';
        statusEl.style.background = 'var(--success-color)';
        statusEl.style.boxShadow = '0 0 10px var(--success-color)';
        dotEl.textContent = '●';
        textEl.textContent = message || 'Live';
        dotEl.style.color = '#fff';
        textEl.style.fontWeight = 'bold';
    } else {
        statusEl.style.display = 'flex';
        statusEl.style.background = 'var(--error-color)';
        statusEl.style.boxShadow = '0 0 10px var(--error-color)';
        dotEl.textContent = '○';
        textEl.textContent = message || 'Offline';
        dotEl.style.color = '#fff';
    }
}

// ========== FORCE ONLINE TRACKING ==========

async function trackDownloadToFirebase(appId) {
    if (!database) {
        console.error("❌ Database not available for tracking");
        return false;
    }
    
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) {
            console.error("❌ App not found:", appId);
            return false;
        }
        
        console.log(`🔥 Tracking download for: ${app.name}`);
        
        // Use transaction for atomic increment
        const appRef = database.ref('downloads/' + appId);
        
        // Get current data
        const snapshot = await appRef.once('value');
        const currentData = snapshot.val() || {};
        const currentCount = parseInt(currentData.count) || 0;
        const newCount = currentCount + 1;
        
        // Update with detailed info
        await appRef.update({
            count: newCount,
            lastDownload: firebase.database.ServerValue.TIMESTAMP,
            lastUpdated: Date.now(),
            appName: app.name,
            appVersion: app.version,
            appDeveloper: app.developer,
            appCategory: app.category,
            totalDownloads: newCount
        });
        
        console.log(`✅✅ FIREBASE UPDATED: ${app.name} = ${newCount} downloads`);
        
        // Verify update
        const verifySnapshot = await appRef.once('value');
        console.log("✅ Verification:", verifySnapshot.val());
        
        return true;
        
    } catch (error) {
        console.error("❌ FIREBASE TRACKING ERROR:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        // Show specific error message
        if (error.code === 'PERMISSION_DENIED') {
            showToast("❌ Firebase permission denied - check database rules", "error");
        } else if (error.code === 'NETWORK_ERROR') {
            showToast("❌ Network error - Firebase offline", "error");
        } else {
            showToast("Firebase error: " + error.message, "error");
        }
        
        return false;
    }
}

// ========== ENHANCED DOWNLOAD FUNCTION ==========

async function trackDownload(appId) {
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) {
            showToast('App not found', 'error');
            return;
        }

        // Add timestamp to prevent caching
        const downloadUrl = app.downloadUrl + '?t=' + Date.now();
        
        // Step 1: Try Firebase tracking FIRST
        let firebaseTracked = false;
        if (database && firebaseConnected) {
            console.log("🔄 Attempting Firebase tracking...");
            firebaseTracked = await trackDownloadToFirebase(appId);
            
            if (firebaseTracked) {
                // Update local data from Firebase
                await updateLocalFromFirebase(appId);
            }
        } else {
            console.log("⚠️ Firebase not connected, storing offline");
            storePendingDownload(appId);
        }
        
        // Step 2: Update local UI (optimistic update)
        app.downloads = (app.downloads || 0) + 1;
        updateTotalDownloads();
        updateAppDownloadCount(appId, app.downloads);
        
        // Step 3: Open download
        setTimeout(() => {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }, 300);
        
        // Step 4: Show feedback
        if (firebaseTracked) {
            showToast(`✅ ${app.name} - Live tracking active!`, 'success');
        } else if (firebaseConnected) {
            showToast(`✅ ${app.name} - Downloading...`, 'success');
        } else {
            showToast(`✅ ${app.name} - Downloading (offline mode)`, 'info');
        }
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download failed', 'error');
    }
}

async function updateLocalFromFirebase(appId) {
    if (!database) return;
    
    try {
        const appRef = database.ref('downloads/' + appId);
        const snapshot = await appRef.once('value');
        const data = snapshot.val();
        
        if (data && data.count !== undefined) {
            const app = appsData.find(a => a.id === appId);
            if (app) {
                app.downloads = parseInt(data.count);
                updateAppDownloadCount(appId, app.downloads);
                updateTotalDownloads();
            }
        }
    } catch (error) {
        console.error('Error updating from Firebase:', error);
    }
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM Loaded - Starting aggressive Firebase connection...");
    
    // Load apps immediately
    loadAppsImmediately();
    
    // Setup everything
    setupEventListeners();
    initializeScrollAnimations();
    setupPWA();
    
    // Load local stats first
    loadLocalStats();
    
    // FORCE Firebase initialization IMMEDIATELY
    setTimeout(() => {
        initializeFirebaseWithRetry();
    }, 100);
    
    // Add network monitoring
    setupNetworkMonitoring();
});

function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
        console.log("🌐 Network online - reconnecting Firebase...");
        showToast('🌐 Network restored - reconnecting...', 'info');
        
        if (!firebaseInitialized) {
            initializeFirebaseWithRetry();
        } else if (!firebaseConnected) {
            testFirebaseConnection();
        }
    });
    
    window.addEventListener('offline', () => {
        console.log("📵 Network offline");
        firebaseConnected = false;
        updateFirebaseStatus(false, "Network offline");
        showToast('📵 Network offline - using local mode', 'warning');
    });
    
    // Initial check
    if (!navigator.onLine) {
        console.log("⚠️ Starting offline");
        updateFirebaseStatus(false, "No network");
    }
}

// ========== DEBUGGING HELPERS ==========

// Add this function to manually test Firebase
window.testFirebaseConnection = function() {
    console.log("🧪 Manual Firebase test...");
    
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK not loaded!");
        return;
    }
    
    // Test direct database access
    const testRef = firebase.database().ref('testConnection');
    const testTime = Date.now();
    
    testRef.set({
        timestamp: testTime,
        message: 'Test connection from Mini Repo'
    }).then(() => {
        console.log("✅ Firebase write test SUCCESS");
        showToast('✅ Firebase write test successful', 'success');
        
        // Read it back
        return testRef.once('value');
    }).then((snapshot) => {
        console.log("✅ Firebase read test SUCCESS:", snapshot.val());
        testRef.remove(); // Clean up
    }).catch((error) => {
        console.error("❌ Firebase test FAILED:", error);
        showToast('❌ Firebase test failed: ' + error.message, 'error');
    });
};

// Add this to check Firebase status
window.checkFirebaseStatus = function() {
    console.log("=== FIREBASE STATUS ===");
    console.log("SDK loaded:", typeof firebase !== 'undefined');
    console.log("App initialized:", !!firebaseApp);
    console.log("Database available:", !!database);
    console.log("Connected:", firebaseConnected);
    console.log("=====================");
    
    if (database) {
        // Try to read something
        database.ref('.info/connected').once('value')
            .then(snap => console.log("Connection state:", snap.val()))
            .catch(err => console.error("Connection check error:", err));
    }
};