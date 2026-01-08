// ========== APP CONFIGURATION ==========
const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    TOAST_DURATION: 3000,
    SKELETON_DELAY: 800
};

// Utility: Robust HTML Sanitization
function sanitizeHtml(dirty) {
    if (!dirty) return '';
    const temp = document.createElement('div');
    temp.textContent = dirty;
    return temp.innerHTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidDownloadUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && 
               (parsed.hostname === 'github.com' || parsed.hostname.endsWith('.github.com'));
    } catch {
        return false;
    }
}

// Generate timestamp for downloads ONLY to prevent stale binaries
const timestamp = new Date().getTime();

const appsData = [
    {
        id: 'eeveespotify',
        name: 'EeveeSpotify',
        developer: 'whoeevee',
        description: `Tweaked Spotify with premium features unlocked, no ads, and enhanced playback.
Spotify IPA 9.1.0, EeveeSpotify v6.2.2`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/EeveeSpotify.png',
        version: '9.1.0',
        downloadUrl: 'https://github.com/OofMini/eeveespotifyreborn/releases/download/New/EeveeSpotify.ipa?timestamp=' + timestamp,
        category: 'Music',
        size: '150 MB'
    },
    {
        id: 'ytlite',
        name: 'YTLite',
        developer: 'dayanch96',
        description: `Tweaked YouTube with background playback, no ads, and picture-in-picture.
YouTube IPA 20.50.9, YTLite v5.2b4`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/YouTubePlus_5.2b3.PNG',
        version: '20.50.9',
        downloadUrl: 'https://github.com/OofMini/YTLite/releases/download/New/YouTubePlus_5.2b4.ipa?timestamp=' + timestamp,
        category: 'Video',
        size: '180 MB'
    },
    {
        id: 'ytmusicultimate',
        name: 'YTMusicUltimate',
        developer: 'dayanch96',
        description: `Tweaked YouTube Music with premium features unlocked, background playback, and no ads.
Youtube Music IPA 8.47.3, YTMusicUltimate 2.3.1`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/YouTubeMusic.png',
        version: '8.50.2',
        downloadUrl: 'https://github.com/OofMini/YTMusicUltimate/releases/download/New/YTMusicUltimate.ipa?timestamp=' + timestamp,
        category: 'Music',
        size: '120 MB'
    },
    {
        id: 'neofreebird',
        name: 'NeoFreeBird',
        developer: 'NeoFreeBird',
        description: `Tweaked Twitter/X with premium features and more.
X IPA 11.48, NeoFreeBird v5.2`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/NeoFreeBird.png',
        version: '11.48',
        downloadUrl: 'https://github.com/OofMini/tweak/releases/download/New/NeoFreeBird-sideloaded.ipa?timestamp=' + timestamp,
        category: 'Social',
        size: '110 MB'
    },
    {
        id: 'scinsta',
        name: 'SCInsta',
        developer: 'SoCuul',
        description: `Tweaked Instagram premium, Instagram IPA 409.0.0, SCInsta v0.8.0`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/SCInsta.png',
        version: '409.0.0',
        downloadUrl: 'https://github.com/OofMini/SCInsta/releases/download/New/SCInsta_sideloaded_v0.8.0.ipa?timestamp=' + timestamp,
        category: 'Social',
        size: '140 MB'
    },
    {
        id: 'inshot',
        name: 'InShotPro',
        developer: 'IPAOMTK',
        description: `Pro video editor with premium filters, tools, and no watermark.
App v1.91.1.`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/Inshot.png',
        version: '1.91.1',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/New/InShot.ipa?timestamp=' + timestamp,
        category: 'Photo & Video',
        size: '220 MB'
    },
    {
        id: 'appstoreplus',
        name: 'Appstore++',
        developer: 'cokernutx',
        description: `Appstore++ allows users to downgrade apps.`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/appstore.png',
        version: '1.0.3',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/App++/AppStore++_TrollStore_v1.0.3-2.ipa?timestamp=' + timestamp,
        category: 'Utilities',
        size: '15 MB'
    },
    {
        id: 'itorrent',
        name: 'iTorrent',
        developer: 'XITRIX',
        description: `Lightweight torrent client for downloading and managing torrent files on-device.`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/itorrent.png',
        version: '2.1.0',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/Torrent/iTorrent.ipa?timestamp=' + timestamp,
        category: 'Utilities',
        size: '25 MB'
    },
    {
        id: 'livecontainer',
        name: 'LiveContainer',
        developer: 'hugeBlack',
        description: `Runs live production containers for streaming apps and runtime isolation.`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/livecontainer.png',
        version: '3.6.1',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/Live/LiveContainer.ipa?timestamp=' + timestamp,
        category: 'Utilities',
        size: '45 MB'
    },
    {
        id: 'refacepro',
        name: 'RefacePro (IOS 17+)',
        developer: 'IPAOMTK',
        description: `Reface Premium Unlocked.`,
        icon: 'https://OofMini.github.io/Minis-IPA-Repo/apps/refacepro.png',
        version: '5.27.0',
        downloadUrl: 'https://github.com/OofMini/Minis-Heap/releases/download/Reface/Reface.ipa?timestamp=' + timestamp,
        category: 'Entertainment',
        size: '280 MB'
    }
];

let searchTerm = '';
let deferredPrompt;
let searchTimeout;
let observer = null;
let areAppsRendered = false;

// ========== CORE APP FUNCTIONS ==========

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        loadApps();
        setupEventListeners();
        initializeScrollAnimations();
        setupPWA();
        
        // Add global error handler (Point 12)
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
    } catch (error) {
        console.error('Initialization error:', error);
        handleError(error);
        if (!areAppsRendered) {
            loadApps();
        }
    }
});

function handleError(error) {
    showToast('An unexpected error occurred', 'error');
    console.error(error);
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

window.addEventListener('beforeunload', () => {
    if (observer) {
        observer.disconnect();
    }
    localStorage.setItem('lastUpdated', Date.now().toString());
});

function loadApps() {
    renderAppGrid();
    areAppsRendered = true;
}

function renderAppGrid() {
    const appGrid = document.getElementById('appGrid');
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
        setTimeout(() => {
            const element = appGrid.querySelector('.fade-in');
            if (element && observer) observer.observe(element);
        }, 100);
        return;
    }

    // Build HTML safely using sanitizeHtml
    appGrid.innerHTML = filteredApps.map((app, index) => {
        const safeId = sanitizeHtml(app.id);
        const safeName = sanitizeHtml(app.name);
        const safeDeveloper = sanitizeHtml(app.developer);
        const safeDescription = sanitizeHtml(app.description);
        const safeAlt = `Icon for ${safeName} by ${safeDeveloper}`;
        
        return `
        <article class="app-card fade-in stagger-${(index % 3) + 1}" aria-label="${safeName}" data-app-id="${safeId}">
            <div class="app-icon-container">
                <img src="${app.icon}" 
                     alt="${safeAlt}" 
                     class="app-icon" 
                     loading="lazy" 
                     decoding="async"
                     width="80" 
                     height="80"
                     onerror="this.onerror=null;this.src='https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'">
            </div>
            <div class="app-status">
                <span aria-label="Status fully working">✅ Fully Working</span> • v${app.version}
            </div>
            <div class="app-card-content">
                <h3>${safeName}</h3>
                <p><span style="background:var(--card-bg); padding:2px 8px; border-radius:4px; font-size:0.8em;">${app.category}</span></p>
                <p>By <b>${safeDeveloper}</b><br>${safeDescription}</p>
                <p style="font-size:0.8em; opacity:0.7; margin-top:10px;">Size: ${app.size}</p>
                <button class="download-btn action-download" data-id="${safeId}" aria-label="Download ${safeName} IPA">
                    ⬇️ Download IPA
                </button>
            </div>
        </article>
        `;
    }).join('');

    setTimeout(() => {
        document.querySelectorAll('.action-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                trackDownload(id);
            });
        });
        
        appGrid.querySelectorAll('.app-card').forEach(card => {
            if (observer) observer.observe(card);
        });
    }, 100);
}

async function trackDownload(appId) {
    try {
        if (!appId || typeof appId !== 'string') throw new Error('Invalid App ID');
        
        const app = appsData.find(a => a.id === appId);
        if (!app) throw new Error('App not found');
        
        // Strict URL validation
        if (!isValidDownloadUrl(app.downloadUrl)) {
            console.error('Blocked potentially unsafe URL:', app.downloadUrl);
            throw new Error('Invalid download URL security check failed');
        }

        window.open(app.downloadUrl, '_blank', 'noopener,noreferrer');
        showToast(`✅ Downloading ${app.name}`, 'success');
    } catch (error) {
        handleError(error);
    }
}

function addToApp(appName, manifestFile) {
    try {
        const schemes = {
            'TrollApps': 'trollapps',
            'SideStore': 'sidestore'
        };
        const scheme = schemes[appName];
        if (!scheme) throw new Error(`Unknown app: ${appName}`);
        
        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        const fullManifestUrl = `${baseUrl}${manifestFile}?${timestamp}`;
        const url = `${scheme}://add-repo?url=${encodeURIComponent(fullManifestUrl)}`;
        
        window.location.href = url;
        setTimeout(() => {
            showToast(`If ${appName} didn't open, make sure it's installed`, 'info');
        }, 1000);
    } catch (error) {
        handleError(error);
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    if (type === 'error') toast.classList.add('error');
    else if (type === 'warning') toast.classList.add('warning');
    else if (type === 'success') toast.classList.add('success');
    else toast.classList.add('info');

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}

function setupPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then((registration) => {
            console.log('Service Worker registered');
            
            // Check for updates (Point 21)
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showToast('New version available! Refresh to update.', 'info');
                    }
                });
            });
        }).catch((error) => {
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
    
    // Keyboard navigation (Point 20)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.activeElement === searchBox) {
            searchBox.blur();
        }
    });

    // Attach listeners to static buttons
    const btnTroll = document.getElementById('btn-trollapps');
    if(btnTroll) btnTroll.addEventListener('click', () => addToApp('TrollApps', 'trollapps.json'));

    const btnSide = document.getElementById('btn-sidestore');
    if(btnSide) btnSide.addEventListener('click', () => addToApp('SideStore', 'sidestore.json'));

    const btnReset = document.getElementById('btn-reset');
    if(btnReset) btnReset.addEventListener('click', resetLocalData);
}

function resetLocalData() {
    if (confirm('Clear all local data and cache?')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
        showToast('Local cache cleared', 'success');
    }
}
