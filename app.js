// app.js - FIXED VERSION with proper Firebase integration

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
let searchTimeout;
let totalDownloads = 0;

// ========== WAIT FOR FIREBASE TO BE READY ==========
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseDatabase) {
            resolve(true);
        } else {
            // Check every 100ms for up to 5 seconds
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.firebaseDatabase) {
                    clearInterval(interval);
                    resolve(true);
                } else if (attempts >= 50) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        }
    });
}

// ========== INITIALIZE APP ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 DOM Loaded - Initializing...");
    
    // Show apps immediately
    renderAppGrid();
    setupEventListeners();
    
    // Wait for Firebase to be ready
    const firebaseReady = await waitForFirebase();
    
    if (firebaseReady) {
        console.log("✅ Firebase is ready, loading stats...");
        loadFirebaseStats();
    } else {
        console.log("⚠️ Firebase not available, using local data");
        showToast('Using cached data', 'warning');
    }
});

// ========== LOAD FIREBASE STATS ==========
function loadFirebaseStats() {
    if (!window.firebaseDatabase || !window.firebaseRef || !window.firebaseOnValue) {
        console.log("Firebase SDK not available");
        return;
    }
    
    try {
        const downloadsRef = window.firebaseRef(window.firebaseDatabase, 'downloads');
        
        window.firebaseOnValue(downloadsRef, (snapshot) => {
            const data = snapshot.val() || {};
            console.log("📊 Firebase data loaded:", data);
            
            // Update each app's download count
            appsData.forEach(app => {
                if (data[app.id] && data[app.id].count !== undefined) {
                    app.downloads = parseInt(data[app.id].count) || 0;
                } else {
                    app.downloads = 0;
                }
            });
            
            // Update UI
            updateStatsUI();
            updateAllAppDownloadCounts();
        }, (error) => {
            console.error('Firebase error:', error);
            showToast('Failed to load stats', 'error');
        });
        
    } catch (error) {
        console.error('Firebase setup error:', error);
    }
}

// ========== TRACK DOWNLOAD ==========
async function trackDownload(appId) {
    try {
        const app = appsData.find(a => a.id === appId);
        if (!app) {
            showToast('App not found', 'error');
            return;
        }

        // Track in Firebase if available
        if (window.firebaseDatabase && window.firebaseRef && window.firebaseSet && window.firebaseGet) {
            try {
                const appRef = window.firebaseRef(window.firebaseDatabase, 'downloads/' + appId);
                const snapshot = await window.firebaseGet(appRef);
                const currentData = snapshot.val();
                
                let newCount = currentData && currentData.count !== undefined 
                    ? parseInt(currentData.count) + 1 
                    : 1;
                
                await window.firebaseSet(appRef, {
                    count: newCount,
                    lastDownload: window.firebaseServerTimestamp(),
                    appName: app.name,
                    lastUpdated: Date.now()
                });
                
                console.log(`✅ Tracked: ${app.name} = ${newCount}`);
                
                // Update UI
                app.downloads = newCount;
                updateStatsUI();
                updateAppDownloadCount(appId, newCount);
                
            } catch (error) {
                console.error('Firebase tracking error:', error);
                showToast('⚠️ Tracking failed, but download continues', 'warning');
            }
        } else {
            console.log('Firebase not available, download continues without tracking');
            showToast('Download started (offline mode)', 'info');
        }
        
        // Open download
        setTimeout(() => {
            window.open(app.downloadUrl, '_blank', 'noopener,noreferrer');
        }, 300);
        
        showToast(`✅ Downloading ${app.name}...`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download failed', 'error');
    }
}

// ========== UI UPDATE FUNCTIONS ==========
function updateStatsUI() {
    totalDownloads = appsData.reduce((sum, app) => sum + app.downloads, 0);
    const totalEl = document.getElementById('totalDownloads');
    if (totalEl) {
        totalEl.textContent = formatNumber(totalDownloads);
    }
}

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

// ========== RENDER APPS ==========
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
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:#fff;opacity:0.7">
                <h3>No apps found</h3>
                <p>Try different search terms</p>
            </div>
        `;
        return;
    }

    appGrid.innerHTML = filteredApps.map((app) => {
        const safeName = escapeHtml(app.name);
        const safeDeveloper = escapeHtml(app.developer);
        const safeDescription = escapeHtml(app.description);
        
        return `
        <article class="app-card" data-app-id="${app.id}">
            <div style="width:80px;height:80px;margin:0 auto 15px;">
                <img src="${app.icon}" alt="${safeName}" style="width:100%;height:100%;object-fit:contain;border-radius:16px;">
            </div>
            <div style="margin-bottom:12px;font-size:0.85em;color:#1db954;">
                ✅ Fully Working • v${app.version}
                <span class="download-count" style="font-size:0.8em;opacity:0.9;color:#fff;font-weight:600;background:rgba(255,50,50,0.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(255,50,50,0.2);display:inline-block;margin-left:8px;">
                    ${formatNumber(app.downloads)} downloads
                </span>
            </div>
            <h3 style="margin:0 0 12px;font-size:1.2em;">${safeName}</h3>
            <p style="font-size:0.9em;opacity:0.8;margin:0 0 12px;">
                <span style="background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:4px;font-size:0.8em;">${app.category}</span>
            </p>
            <p style="font-size:0.9em;opacity:0.8;margin:0 0 20px;">
                By <b>${safeDeveloper}</b><br>${safeDescription}
            </p>
            <p style="font-size:0.8em;opacity:0.7;margin:0 0 20px;">Size: ${app.size}</p>
            <button class="download-btn" onclick="trackDownload('${app.id}')">
                ⬇️ Download IPA
            </button>
        </article>
        `;
    }).join('');
}

// ========== UTILITY FUNCTIONS ==========
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
    toast.className = 'toast show';
    
    if (type === 'error') toast.style.background = '#ff4444';
    else if (type === 'warning') toast.style.background = '#ffaa00';
    else if (type === 'success') toast.style.background = '#1db954';
    else toast.style.background = '#007AFF';

    setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}

// ========== EVENT LISTENERS ==========
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
    }
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
        
        const url = `${scheme}://add-repo?url=https://oofmini.github.io/Minis-IPA-Repo/${manifestPath}`;
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