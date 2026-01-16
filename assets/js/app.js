// ========== APP CONFIGURATION ==========
const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    TOAST_DURATION: 3000,
    SKELETON_DELAY: 800,
    API_ENDPOINT: './sidestore.json', // Updated endpoint
    RATE_LIMIT_TIME: 300000, // 5 minutes
    RATE_LIMIT_COUNT: 5,
    FALLBACK_ICON: 'https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'
};

const AppState = {
    apps: [],
    searchTerm: '',
    isLoading: true,
    error: null,
    downloads: new Map()
};

let deferredPrompt;
let observer = null;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        setupEventListeners();
        setupGlobalErrorHandling();
        setupPWA();
        initializeScrollAnimations();
        
        showLoadingState();
        AppState.apps = await loadAppData();
        AppState.isLoading = false;
        renderAppGrid();

    } catch (error) {
        console.error('Initialization error:', error);
        handleError(error);
        showErrorState('Failed to initialize application');
    }
});

async function loadAppData() {
    try {
        const response = await fetchWithRetry(CONFIG.API_ENDPOINT);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        // Validation: Ensure basic structure exists
        if (!data.apps || !Array.isArray(data.apps)) {
            throw new Error('Invalid sidestore.json structure');
        }

        // Map SideStore structure to flat AppState format
        return data.apps.map(app => {
            const latestVersion = app.versions && app.versions.length > 0 ? app.versions[0] : {};
            const bundleId = app.bundleIdentifier || '';

            return {
                id: generateId(bundleId),
                name: app.name,
                developer: app.developerName, // Renamed from developerName
                description: app.localizedDescription, // Renamed from localizedDescription
                icon: app.iconURL, // Renamed from iconURL
                version: latestVersion.version || 'Unknown',
                date: latestVersion.date || '',
                downloadUrl: latestVersion.downloadURL || '',
                category: inferCategory(bundleId),
                size: formatSize(latestVersion.size)
            };
        });

    } catch (error) {
        console.error('Failed to load app data:', error);
        throw error;
    }
}

// Helper: Generate ID from bundle identifier
function generateId(bundleIdentifier) {
    if (!bundleIdentifier) return 'unknown';
    const parts = bundleIdentifier.split('.');
    return parts[parts.length - 1].toLowerCase();
}

// Helper: Infer category based on bundle ID patterns
function inferCategory(bundleIdentifier) {
    const bid = bundleIdentifier.toLowerCase();
    if (bid.includes('spotify') || bid.includes('youtubemusic')) return 'Music';
    if (bid.includes('youtube')) return 'Video';
    if (bid.includes('instagram') || bid.includes('tweetie2')) return 'Social';
    if (bid.includes('instashot')) return 'Photo & Video';
    if (bid.includes('reface')) return 'Entertainment';
    return 'Utilities';
}

// Helper: Convert bytes to MB
function formatSize(bytes) {
    if (!bytes || isNaN(bytes)) return 'Unknown';
    const mb = (bytes / (1024 * 1024)).toFixed(0);
    return `${mb} MB`;
}

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

function renderAppGrid() {
    const appGrid = document.getElementById('appGrid');
    
    const filteredApps = AppState.apps.filter(app => {
        if (!AppState.searchTerm) return true;
        const term = AppState.searchTerm.toLowerCase();
        return app.name.toLowerCase().includes(term) ||
               app.description.toLowerCase().includes(term) ||
               app.developer.toLowerCase().includes(term) ||
               app.category.toLowerCase().includes(term);
    });

    if (filteredApps.length === 0) {
        appGrid.innerHTML = `
            <div class="fade-in no-results">
                <h3>No apps found</h3>
                <p>Try different search terms</p>
            </div>
        `;
        if (observer) {
            appGrid.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
        }
        return;
    }

    const fragment = document.createDocumentFragment();

    filteredApps.forEach((app, index) => {
        const safeId = sanitizeHtml(app.id);
        const safeName = sanitizeHtml(app.name);
        const safeDeveloper = sanitizeHtml(app.developer);
        const safeDescription = sanitizeHtml(app.description);
        const safeAlt = `Icon for ${safeName} by ${safeDeveloper}`;
        
        const article = document.createElement('article');
        article.className = `app-card fade-in stagger-${(index % 3) + 1}`;
        article.setAttribute('aria-label', safeName);
        article.setAttribute('data-app-id', safeId);
        
        article.innerHTML = `
            <div class="app-icon-container">
                <img src="${app.icon}" alt="${safeAlt}" class="app-icon" loading="lazy" decoding="async" width="80" height="80">
            </div>
            <div class="app-status">
                <span aria-label="Status fully working">✅ Fully Working</span> • v${app.version}
            </div>
            <div class="app-card-content">
                <h3>${safeName}</h3>
                <p><span class="app-category-tag">${app.category}</span></p>
                <p>By <b>${safeDeveloper}</b><br>${safeDescription}</p>
                <p class="app-meta-size">Size: ${app.size}</p>
                <button class="download-btn action-download" data-id="${safeId}" aria-label="Download ${safeName} IPA">
                    ⬇️ Download IPA
                </button>
            </div>
        `;
        fragment.appendChild(article);
    });

    appGrid.innerHTML = '';
    appGrid.appendChild(fragment);

    if (!appGrid.hasAttribute('data-listening')) {
        appGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-download')) {
                const id = e.target.getAttribute('data-id');
                trackDownload(id);
            }
        });
        appGrid.setAttribute('data-listening', 'true');
    }
        
    if (observer) {
        appGrid.querySelectorAll('.fade-in').forEach(card => observer.observe(card));
    }
}

async function trackDownload(appId) {
    try {
        if (!checkRateLimit(appId)) return;

        const app = AppState.apps.find(a => a.id === appId);
        if (!app) throw new Error('App not found');
        
        if (!isValidDownloadUrl(app.downloadUrl)) {
            throw new Error('Security Check: Invalid Download URL');
        }

        window.open(app.downloadUrl, '_blank', 'noopener,noreferrer');
        showToast(`✅ Downloading ${app.name}`, 'success');
    } catch (error) {
        handleError(error);
    }
}

function checkRateLimit(appId) {
    const now = Date.now();
    const recent = AppState.downloads.get(appId) || [];
    const activeDownloads = recent.filter(time => time > now - CONFIG.RATE_LIMIT_TIME);
    
    if (activeDownloads.length >= CONFIG.RATE_LIMIT_COUNT) {
        showToast('Too many downloads. Please wait a few minutes.', 'warning');
        return false;
    }
    
    activeDownloads.push(now);
    AppState.downloads.set(appId, activeDownloads);
    
    const btn = document.querySelector(`.action-download[data-id="${appId}"]`);
    if (btn) {
        btn.disabled = true;
        setTimeout(() => btn.disabled = false, 2000);
    }
    
    return true;
}

function showLoadingState() {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = Array(6).fill(0).map(() => `
        <div class="skeleton-card fade-in">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-button"></div>
        </div>
    `).join('');
    if (observer) {
        grid.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }
}

function showErrorState(msg) {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = `
        <div class="error-state fade-in">
            <div class="error-emoji">⚠️</div>
            <h3>Something went wrong</h3>
            <p>${sanitizeHtml(msg)}</p>
            <button class="download-btn" id="btn-refresh-error">Refresh Page</button>
        </div>
    `;
    setTimeout(() => {
        const btn = document.getElementById('btn-refresh-error');
        if (btn) btn.addEventListener('click', () => location.reload());
    }, 0);
}

function sanitizeHtml(dirty) {
    if (!dirty) return '';
    const temp = document.createElement('div');
    temp.textContent = dirty;
    return temp.innerHTML.replace(/[<>"'\n\r]/g, (m) => {
        const map = {
            '<': '&lt;', '>': '&gt;', '"': '&quot;',
            "'": '&#039;', '\n': '&#10;', '\r': '&#13;'
        };
        return map[m];
    });
}

function isValidDownloadUrl(url) {
    try {
        const parsed = new URL(url);
        const trustedHosts = ['github.com', 'raw.githubusercontent.com', 'archive.org'];
        return parsed.protocol === 'https:' && 
               (trustedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)));
    } catch { return false; }
}

function handleError(error) {
    showToast('An error occurred', 'error');
    console.error(error);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.innerHTML = ''; 
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}

function setupEventListeners() {
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        let searchTimeout;
        const handleSearch = (e) => {
            clearTimeout(searchTimeout);
            const value = e.target.value;
            searchTimeout = setTimeout(() => {
                AppState.searchTerm = value.toLowerCase().trim();
                renderAppGrid();
            }, CONFIG.SEARCH_DEBOUNCE);
        };
        
        searchBox.addEventListener('input', handleSearch);
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchBox) {
                e.preventDefault();
                searchBox.focus();
            }
            if (e.key === 'Escape' && document.activeElement === searchBox) {
                searchBox.blur();
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) clearTimeout(searchTimeout);
        });
    }

    const btnTroll = document.getElementById('btn-trollapps');
    if(btnTroll) btnTroll.addEventListener('click', () => addToApp('TrollApps', 'trollapps.json'));

    const btnSide = document.getElementById('btn-sidestore');
    if(btnSide) btnSide.addEventListener('click', () => addToApp('SideStore', 'sidestore.json'));

    const btnReset = document.getElementById('btn-reset');
    if(btnReset) btnReset.addEventListener('click', resetLocalData);
}

function setupGlobalErrorHandling() {
    const failedImages = new WeakSet();
    document.addEventListener('error', (e) => {
        if (e.target.tagName.toLowerCase() === 'img') {
            if (!failedImages.has(e.target)) {
                failedImages.add(e.target);
                e.target.src = CONFIG.FALLBACK_ICON;
                e.target.alt = 'Default Icon';
            } else {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
            }
        }
    }, true);
}

function addToApp(appName, manifestFile) {
    const schemes = { 'TrollApps': 'trollapps', 'SideStore': 'sidestore' };
    const scheme = schemes[appName];
    if (!scheme) return;
    
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const url = `${scheme}://add-repo?url=${encodeURIComponent(baseUrl + manifestFile)}`;
    window.location.href = url;
}

function resetLocalData() {
    if (confirm('Clear all local data and cache?')) {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        location.reload();
    }
}

function initializeScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.fade-in, .fade-in-left').forEach(el => el.classList.add('visible'));
        return;
    }
    
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in, .fade-in-left').forEach(el => observer.observe(el));
}

function setupPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (confirm('New version available! Reload?')) {
                            newWorker.postMessage({ action: 'skipWaiting' });
                            window.location.reload();
                        }
                    }
                });
            });
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
    toast.innerHTML = ''; 
    
    const message = document.createTextNode("Install Mini's IPA Repo? ");
    const installButton = document.createElement('button');
    installButton.textContent = 'Install';
    installButton.className = 'toast-install-btn';
    
    installButton.addEventListener('click', installApp);
    
    toast.appendChild(message);
    toast.appendChild(installButton);
    toast.className = 'toast info show';
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    }
}