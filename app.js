// app.js - Apps Show IMMEDIATELY, Firebase optional

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

// ========== INITIALIZE IMMEDIATELY ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM Loaded - Showing apps IMMEDIATELY");
    
    // STEP 1: Show apps FIRST (most important)
    renderAppGrid();
    
    // STEP 2: Setup basic functionality
    setupEventListeners();
    initializeScrollAnimations();
    setupPWA();
    
    // STEP 3: Try Firebase in background (optional)
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            console.log("🔥 Trying Firebase in background...");
            initializeFirebase();
        }
    }, 500);
    
    console.log("✅ Apps should be visible NOW");
});

// ========== RENDER APPS (SIMPLIFIED) ==========

function renderAppGrid() {
    const appGrid = document.getElementById('appGrid');
    if (!appGrid) {
        console.error("❌ Cannot find appGrid element!");
        return;
    }
    
    console.log("🎨 Rendering", appsData.length, "apps...");
    
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
        const safeName = escapeHtml(app.name);
        const safeDeveloper = escapeHtml(app.developer);
        const safeDescription = escapeHtml(app.description);
        const safeAlt = `Icon for ${safeName} by ${safeDeveloper}`;
        
        // Add cache-busting to icon
        const iconUrl = app.icon + '?t=' + Date.now();
        
        return `
        <article class="app-card fade-in stagger-${(index % 3) + 1}" aria-label="${safeName}" data-app-id="${app.id}">
            <div class="app-icon-container">
                <img src="${iconUrl}" alt="${safeAlt}" class="app-icon" loading="lazy" width="80" height="80"
                     onerror="this.onerror=null;this.src='https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'">
            </div>
            <div class="app-status">
                <span aria-label="Status fully working">✅ Fully Working</span> • v${app.version}
                <span class="download-count" aria-label="Download count">${app.downloads || 0} downloads</span>
            </div>
            <div class="app-card-content">
                <h3>${safeName}</h3>
                <p><span style="background:var(--card-bg); padding:2px 8px; border-radius:4px; font-size:0.8em;">${app.category}</span></p>
                <p>By <b>${safeDeveloper}</b><br>${safeDescription}</p>
                <p style="font-size:0.8em; opacity:0.7; margin-top:10px;">Size: ${app.size}</p>
                <button class="download-btn" onclick="trackDownload('${app.id}')" aria-label="Download ${safeName} IPA">
                    ⬇️ Download IPA
                </button>
            </div>
        </article>
        `;
    }).join('');

    // Initialize animations
    setTimeout(() => {
        appGrid.querySelectorAll('.app-card').forEach(card => {
            if (observer) observer.observe(card);
        });
    }, 100);
    
    console.log("✅ Apps rendered successfully");
}

// ========== SIMPLE DOWNLOAD FUNCTION ==========

function trackDownload(appId) {
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) {
            showToast('App not found', 'error');
            return;
        }

        // Add timestamp to prevent caching
        const downloadUrl = app.downloadUrl + '?t=' + Date.now();
        
        // Update local count
        app.downloads = (app.downloads || 0) + 1;
        updateAppDownloadCount(appId, app.downloads);
        updateTotalDownloads();
        
        // Try Firebase if available
        if (window.firebaseApp && window.database) {
            trackDownloadToFirebase(appId);
        }
        
        // Open download
        setTimeout(() => {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }, 300);
        
        showToast(`✅ Downloading ${app.name}...`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download failed', 'error');
    }
}

// ========== FIREBASE FUNCTIONS (OPTIONAL) ==========

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.log("Firebase SDK not loaded");
        return;
    }
    
    try {
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
        
        // Initialize
        window.firebaseApp = firebase.initializeApp(firebaseConfig);
        window.database = firebase.database();
        
        console.log("✅ Firebase initialized");
        updateFirebaseStatus(true);
        
        // Load existing counts
        loadFirebaseStats();
        
    } catch (error) {
        console.log("Firebase init failed (optional):", error.message);
        updateFirebaseStatus(false);
    }
}

function updateFirebaseStatus(connected) {
    const statusEl = document.getElementById('firebaseStatus');
    if (!statusEl) return;
    
    statusEl.style.display = 'flex';
    if (connected) {
        statusEl.style.background = 'var(--success-color)';
        statusEl.children[0].textContent = '●';
        statusEl.children[1].textContent = 'Live';
        showToast('✅ Firebase connected', 'success');
    } else {
        statusEl.style.background = 'var(--warning-color)';
        statusEl.children[0].textContent = '○';
        statusEl.children[1].textContent = 'Offline';
    }
}

async function trackDownloadToFirebase(appId) {
    if (!window.database) return;
    
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) return;
        
        const appRef = window.database.ref('downloads/' + appId);
        const snapshot = await appRef.once('value');
        const currentData = snapshot.val() || {};
        const newCount = (parseInt(currentData.count) || 0) + 1;
        
        await appRef.update({
            count: newCount,
            lastDownload: firebase.database.ServerValue.TIMESTAMP,
            appName: app.name,
            lastUpdated: Date.now()
        });
        
        console.log(`✅ Firebase: ${app.name} = ${newCount}`);
        
    } catch (error) {
        console.log("Firebase tracking failed (optional):", error.message);
    }
}

function loadFirebaseStats() {
    if (!window.database) return;
    
    const downloadsRef = window.database.ref('downloads');
    downloadsRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        // Update app counts
        appsData.forEach(app => {
            if (data[app.id] && data[app.id].count !== undefined) {
                app.downloads = parseInt(data[app.id].count) || 0;
            }
        });
        
        // Update UI
        updateAllAppDownloadCounts();
        updateTotalDownloads();
    });
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

// ========== SETUP FUNCTIONS ==========

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
        
        // Keyboard shortcut for search
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchBox) {
                e.preventDefault();
                searchBox.focus();
            }
        });
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