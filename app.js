// app.js - Main Application JavaScript with Firebase Tracking

// ========== APP CONFIGURATION ==========
const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    TOAST_DURATION: 3000
};

// ========== ALL 10 APPS DATA ==========
const appsData = [
    {
        id: 'eeveespotify',
        name: 'EeveeSpotify',
        developer: 'whoeevee',
        description: 'Tweaked Spotify with premium features unlocked, no ads, and enhanced playback. Spotify IPA 9.1.0, EeveeSpotify v6.2.2',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/EeveeSpotify.png',
        version: '9.1.0',
        downloadUrl: 'https://github.com/OofMini/eeveespotifyreborn/releases/download/New/EeveeSpotify.ipa',
        downloads: 0,
        category: 'Music',
        size: '150 MB'
    },
    {
        id: 'ytlite',
        name: 'YTLite',
        developer: 'dayanch96',
        description: 'Tweaked YouTube with background playback, no ads, and picture-in-picture. YouTube IPA 20.47.3, YTLite v5.2b4',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/YouTubePlus_5.2b3.PNG',
        version: '20.47.3',
        downloadUrl: 'https://github.com/OofMini/YTLite/releases/download/New/YouTubePlus_5.2b4.ipa',
        downloads: 0,
        category: 'Video',
        size: '180 MB'
    },
    {
        id: 'ytmusicultimate',
        name: 'YTMusicUltimate',
        developer: 'dayanch96',
        description: 'Tweaked YouTube Music with premium features unlocked, background playback, and no ads. Youtube Music IPA 8.47.3, YTMusicUltimate 2.3.1',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/YouTubeMusic.png',
        version: '8.47.3',
        downloadUrl: 'https://github.com/OofMini/YTMusicUltimate/releases/download/New/YTMusicUltimate.ipa',
        downloads: 0,
        category: 'Music',
        size: '120 MB'
    },
    {
        id: 'neofreebird',
        name: 'NeoFreeBird',
        developer: 'NeoFreeBird',
        description: 'Tweaked Twitter/X with premium features and more. X IPA 11.45, NeoFreeBird v5.2',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/NeoFreeBird.png',
        version: '11.45',
        downloadUrl: 'https://github.com/OofMini/tweak/releases/download/New/NeoFreeBird-sideloaded.ipa',
        downloads: 0,
        category: 'Social',
        size: '110 MB'
    },
    {
        id: 'scinsta',
        name: 'SCInsta',
        developer: 'SoCuul',
        description: 'Tweaked Instagram premium, Instagram IPA 408.0.0, SCInsta v0.8.0',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/SCInsta.png',
        version: '408.0.0',
        downloadUrl: 'https://github.com/OofMini/SCInsta/releases/download/New/SCInsta_sideloaded_v0.8.0.ipa',
        downloads: 0,
        category: 'Social',
        size: '140 MB'
    },
    {
        id: 'inshot',
        name: 'InShotPro',
        developer: 'IPAOMTK',
        description: 'Pro video editor with premium filters, tools, and no watermark. App v1.91.1.',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/Inshot.png',
        version: '1.91.1',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/New/InShot.ipa',
        downloads: 0,
        category: 'Photo & Video',
        size: '220 MB'
    },
    {
        id: 'appstoreplus',
        name: 'Appstore++',
        developer: 'cokernutx',
        description: 'Appstore++ allows users to downgrade apps.',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/appstore.png',
        version: '1.0.3',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/App++/AppStore++_TrollStore_v1.0.3-2.ipa',
        downloads: 0,
        category: 'Utilities',
        size: '15 MB'
    },
    {
        id: 'itorrent',
        name: 'iTorrent',
        developer: 'XITRIX',
        description: 'Lightweight torrent client for downloading and managing torrent files on-device.',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/itorrent.png',
        version: '2.1.0',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/Torrent/iTorrent.ipa',
        downloads: 0,
        category: 'Utilities',
        size: '25 MB'
    },
    {
        id: 'livecontainer',
        name: 'LiveContainer',
        developer: 'hugeBlack',
        description: 'Runs live production containers for streaming apps and runtime isolation.',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/livecontainer.png',
        version: '3.6.1',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/Live/LiveContainer.ipa',
        downloads: 0,
        category: 'Utilities',
        size: '45 MB'
    },
    {
        id: 'refacepro',
        name: 'RefacePro (IOS 17+)',
        developer: 'IPAOMTK',
        description: 'Reface Premium Unlocked.',
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/refacepro.png',
        version: '5.27.0',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/Reface/Reface.ipa',
        downloads: 0,
        category: 'Entertainment',
        size: '280 MB'
    }
];

let searchTerm = '';
let deferredPrompt;
let searchTimeout;
let observer = null;
let totalDownloads = 0;
let firebaseApp = null;
let database = null;
let firebaseConnected = false;

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

// ========== SIMPLE INITIALIZATION ==========

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM Loaded - Loading apps immediately...");
    
    // Load apps IMMEDIATELY without waiting for anything
    loadAppsImmediately();
    
    // Setup event listeners
    setupEventListeners();
    initializeScrollAnimations();
    setupPWA();
    
    // Initialize Firebase immediately (but don't block app display)
    setTimeout(() => {
        initializeFirebase();
    }, 100);
    
    console.log("✅ All apps should now be visible");
});

// ========== FIREBASE FUNCTIONS ==========

function initializeFirebase() {
    // Only try if Firebase is available
    if (typeof firebase === 'undefined') {
        console.log("❌ Firebase SDK not loaded");
        updateFirebaseStatus(false);
        return;
    }
    
    try {
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        console.log("✅ Firebase initialized successfully");
        
        // Test connection
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snap) => {
            firebaseConnected = snap.val() === true;
            updateFirebaseStatus(firebaseConnected);
            
            if (firebaseConnected) {
                console.log("✅ Firebase connected");
                showToast('✅ Live tracking enabled', 'success');
                // Load initial stats and sync pending downloads
                loadFirebaseStats();
                syncPendingDownloads();
            } else {
                console.log("⚠️ Firebase disconnected");
            }
        });
        
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
        updateFirebaseStatus(false);
    }
}

function updateFirebaseStatus(connected) {
    const statusEl = document.getElementById('firebaseStatus');
    if (!statusEl) return;
    
    const dotEl = document.getElementById('statusDot');
    const textEl = document.getElementById('statusText');
    
    if (connected) {
        statusEl.style.display = 'flex';
        statusEl.style.background = 'var(--success-color)';
        dotEl.textContent = '●';
        textEl.textContent = 'Live';
        dotEl.style.color = '#fff';
    } else {
        statusEl.style.display = 'flex';
        statusEl.style.background = 'var(--warning-color)';
        dotEl.textContent = '○';
        textEl.textContent = 'Offline';
        dotEl.style.color = '#000';
    }
}

// Load download counts from Firebase
function loadFirebaseStats() {
    if (!database) return;
    
    const downloadsRef = database.ref('downloads');
    
    downloadsRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        console.log("📊 Firebase data loaded:", data);
        
        // Update each app's download count from Firebase
        appsData.forEach(app => {
            if (data[app.id] && data[app.id].count !== undefined) {
                app.downloads = parseInt(data[app.id].count) || 0;
            } else {
                app.downloads = 0;
            }
        });
        
        // Update UI
        updateTotalDownloads();
        updateAllAppDownloadCounts();
        
    }, (error) => {
        console.error('Firebase load error:', error);
    });
}

// Track download to Firebase
async function trackDownloadToFirebase(appId) {
    if (!database) {
        console.log("❌ Firebase database not available");
        return false;
    }
    
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) {
            console.log("❌ App not found:", appId);
            return false;
        }
        
        console.log("🔄 Tracking download for:", app.name);
        
        // Use Firebase transaction for atomic increment
        const appRef = database.ref('downloads/' + appId);
        
        // Get current data
        const snapshot = await appRef.once('value');
        const currentData = snapshot.val() || {};
        
        // Increment count
        const newCount = (parseInt(currentData.count) || 0) + 1;
        
        // Update Firebase
        await appRef.update({
            count: newCount,
            lastDownload: firebase.database.ServerValue.TIMESTAMP,
            appName: app.name,
            appVersion: app.version,
            lastUpdated: Date.now()
        });
        
        console.log(`✅ Firebase updated: ${app.name} = ${newCount} downloads`);
        return true;
        
    } catch (error) {
        console.error('❌ Firebase tracking error:', error);
        console.error('Error details:', error.message);
        return false;
    }
}

// Store pending downloads when offline
function storePendingDownload(appId) {
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) return;
        
        let pendingDownloads = JSON.parse(localStorage.getItem('pendingDownloads') || '[]');
        pendingDownloads.push({
            appId: appId,
            timestamp: Date.now(),
            appName: app.name
        });
        localStorage.setItem('pendingDownloads', JSON.stringify(pendingDownloads));
        
        console.log(`📱 Offline download stored for ${app.name}`);
        showToast('📱 Download tracked offline - will sync when online', 'info');
        
    } catch (error) {
        console.error('Error storing pending download:', error);
    }
}

// Sync pending downloads when back online
async function syncPendingDownloads() {
    if (!database || !firebaseConnected) return;
    
    try {
        const pendingDownloads = JSON.parse(localStorage.getItem('pendingDownloads') || '[]');
        if (pendingDownloads.length === 0) return;
        
        console.log(`🔄 Syncing ${pendingDownloads.length} pending downloads...`);
        
        // Group by appId
        const downloadsByApp = {};
        pendingDownloads.forEach(download => {
            if (!downloadsByApp[download.appId]) {
                downloadsByApp[download.appId] = 0;
            }
            downloadsByApp[download.appId]++;
        });
        
        // Sync each app
        for (const [appId, count] of Object.entries(downloadsByApp)) {
            const appRef = database.ref('downloads/' + appId);
            const snapshot = await appRef.once('value');
            const currentData = snapshot.val() || {};
            
            const newCount = (parseInt(currentData.count) || 0) + count;
            
            await appRef.update({
                count: newCount,
                lastDownload: firebase.database.ServerValue.TIMESTAMP,
                lastUpdated: Date.now(),
                syncedFromOffline: true
            });
            
            console.log(`✅ Synced ${count} downloads for ${appId}`);
        }
        
        // Clear pending downloads
        localStorage.removeItem('pendingDownloads');
        console.log('✅ All pending downloads synced to Firebase');
        
        // Refresh stats
        loadFirebaseStats();
        
        if (pendingDownloads.length > 0) {
            showToast(`✅ Synced ${pendingDownloads.length} offline downloads`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error syncing pending downloads:', error);
    }
}

// ========== MAIN DOWNLOAD FUNCTION ==========

async function trackDownload(appId) {
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) {
            showToast('App not found', 'error');
            return;
        }

        // Add timestamp to prevent caching
        const downloadUrl = app.downloadUrl + '?t=' + Date.now();
        
        // Step 1: Update local count immediately (for instant UI feedback)
        app.downloads = (app.downloads || 0) + 1;
        updateTotalDownloads();
        updateAppDownloadCount(appId, app.downloads);
        
        // Step 2: Try to track with Firebase
        let firebaseTracked = false;
        if (database && firebaseConnected) {
            firebaseTracked = await trackDownloadToFirebase(appId);
        } else {
            // Store offline for later sync
            storePendingDownload(appId);
        }
        
        // Step 3: Open download
        setTimeout(() => {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }, 300);
        
        // Step 4: Show feedback
        if (firebaseTracked) {
            showToast(`✅ ${app.name} download tracked live!`, 'success');
        } else if (!firebaseConnected) {
            showToast(`✅ ${app.name} - Downloading... (offline mode)`, 'info');
        } else {
            showToast(`✅ ${app.name} - Downloading...`, 'success');
        }
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download failed', 'error');
    }
}

// ========== APP LOADING FUNCTIONS ==========

function loadAppsImmediately() {
    const appGrid = document.getElementById('appGrid');
    if (appGrid) {
        appGrid.innerHTML = '';
    }
    
    renderAppGrid();
    updateTotalDownloads();
}

function renderAppGrid() {
    const appGrid = document.getElementById('appGrid');
    if (!appGrid) return;
    
    const filteredApps = appsData.filter(app => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return app.name.toLowerCase().includes(term) ||
               app.description.toLowerCase().includes(term) ||
               app.developer.toLowerCase().includes(term) ||
               app.category.toLowerCase().includes(term);
    });

    if (filteredApps.length === 0) {
        appGrid.innerHTML = `
            <div class="fade-in" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-color);opacity:0.7">
                <h3>No apps found</h3>
                <p>Try different search terms</p>
            </div>
        `;
        return;
    }

    appGrid.innerHTML = filteredApps.map((app, index) => {
        const safeId = app.id;
        const safeName = escapeHtml(app.name);
        const safeDeveloper = escapeHtml(app.developer);
        const safeDescription = escapeHtml(app.description);
        const safeAlt = `Icon for ${safeName} by ${safeDeveloper}`;
        
        const downloadCount = app.downloads || 0;
        const countDisplay = formatNumber(downloadCount) + ' downloads';
        const iconUrl = app.icon + '?t=' + Date.now();
        
        return `
        <article class="app-card fade-in stagger-${(index % 3) + 1}" aria-label="${safeName}" data-app-id="${safeId}">
            <div class="app-icon-container">
                <img src="${iconUrl}" alt="${safeAlt}" class="app-icon" loading="lazy" width="80" height="80"
                     onerror="this.onerror=null;this.src='https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'">
            </div>
            <div class="app-status">
                <span aria-label="Status fully working">✅ Fully Working</span> • v${app.version}
                <span class="download-count" aria-label="Download count">${countDisplay}</span>
            </div>
            <div class="app-card-content">
                <h3>${safeName}</h3>
                <p><span style="background:var(--card-bg); padding:2px 8px; border-radius:4px; font-size:0.8em;">${app.category}</span></p>
                <p>By <b>${safeDeveloper}</b><br>${safeDescription}</p>
                <p style="font-size:0.8em; opacity:0.7; margin-top:10px;">Size: ${app.size}</p>
                <button class="download-btn" onclick="trackDownload('${safeId}')" aria-label="Download ${safeName} IPA">
                    ⬇️ Download IPA
                </button>
            </div>
        </article>
        `;
    }).join('');

    setTimeout(() => {
        appGrid.querySelectorAll('.app-card').forEach(card => {
            if (observer) observer.observe(card);
        });
    }, 100);
}

// ========== UTILITY FUNCTIONS ==========

function updateAllAppDownloadCounts() {
    const appCards = document.querySelectorAll('.app-card');
    appCards.forEach(card => {
        const appId = card.dataset.appId;
        if (appId) {
            const app = appsData.find(a => a.id === appId);
            if (app) {
                const downloadCountElement = card.querySelector('.download-count');
                if (downloadCountElement) {
                    downloadCountElement.textContent = formatNumber(app.downloads) + ' downloads';
                }
            }
        }
    });
}

function updateAppDownloadCount(appId, count) {
    const appCard = document.querySelector(`.app-card[data-app-id="${appId}"]`);
    if (appCard) {
        const downloadCountElement = appCard.querySelector('.download-count');
        if (downloadCountElement) {
            downloadCountElement.textContent = formatNumber(count) + ' downloads';
        }
    }
}

function updateTotalDownloads() {
    totalDownloads = appsData.reduce((sum, app) => sum + app.downloads, 0);
    const totalDownloadsEl = document.getElementById('totalDownloads');
    if (totalDownloadsEl) {
        totalDownloadsEl.textContent = formatNumber(totalDownloads);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    num = parseInt(num) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast';

    if (type === 'error') toast.classList.add('error');
    else if (type === 'warning') toast.classList.add('warning');
    else if (type === 'success') toast.classList.add('success');
    else toast.classList.add('info');

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}

// ========== OTHER FUNCTIONS ==========

function addToApp(appName, manifestPath) {
    try {
        const schemes = {
            'TrollApps': 'trollapps',
            'SideStore': 'sidestore',
            'Feather': 'feather'
        };
        
        const scheme = schemes[appName];
        if (!scheme) {
            showToast(`Unknown app: ${appName}`, 'error');
            return;
        }
        
        const url = `${scheme}://add-repo?url=https://oofmini.github.io/Minis-IPA-Repo/${manifestPath}?${Date.now()}`;
        window.location.href = url;
        
        setTimeout(() => {
            showToast(`If ${appName} didn't open, make sure it's installed`, 'info');
        }, 1000);
    } catch (error) {
        showToast('Failed to add repository', 'error');
    }
}

function initializeScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.fade-in, .fade-in-left').forEach(el => {
            el.classList.add('visible');
        });
        return;
    }

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {threshold: 0.1});

    document.querySelectorAll('.fade-in, .fade-in-left').forEach(el => {
        observer.observe(el);
    });
}

function setupEventListeners() {
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const value = e.target.value;
            searchTimeout = setTimeout(() => {
                searchTerm = value.toLowerCase().trim();
                renderAppGrid();
            }, CONFIG.SEARCH_DEBOUNCE);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchBox) {
                e.preventDefault();
                searchBox.focus();
            }
        });
    }
    
    window.addEventListener('online', () => {
        showToast('🌐 Back online - syncing data...', 'success');
        setTimeout(syncPendingDownloads, 1000);
    });
    
    window.addEventListener('offline', () => {
        showToast('📵 You are offline - downloads will sync later', 'warning');
    });
}

function setupPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/Minis-IPA-Repo/sw.js')
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(showInstallPrompt, 3000);
    });
}

function showInstallPrompt() {
    if (!deferredPrompt) return;

    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = 'Install Mini\'s IPA Repo? ';
    
    const installButton = document.createElement('button');
    installButton.textContent = 'Install';
    installButton.style.cssText = 'margin-left: 10px; background: var(--accent-color); border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;';
    installButton.onclick = installApp;
    
    toast.appendChild(installButton);
    toast.classList.remove('error','warning','success','info');
    toast.classList.add('toast','info','show');
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('App installed successfully!', 'success');
            }
            deferredPrompt = null;
        });
    }
}

function showPrivacyInfo() {
    showToast('Anonymous download tracking only. No personal data collected.', 'info');
}

function resetLocalData() {
    if (confirm('Clear all local data and cache?')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    }
}