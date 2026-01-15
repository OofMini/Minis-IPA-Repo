// ========== APP CONFIGURATION ==========
const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    TOAST_DURATION: 3000,
    SKELETON_DELAY: 800,
    API_ENDPOINT: './apps.json',
    RATE_LIMIT_TIME: 300000, // 5 minutes
    RATE_LIMIT_COUNT: 5,
    FALLBACK_ICON: 'https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'
};

// State Management
const AppState = {
    apps: [],
    searchTerm: '',
    isLoading: true,
    error: null,
    downloads: new Map()
};

let deferredPrompt;
let observer = null;

// ========== CORE FUNCTIONS ==========

document.addEventListener('DOMContentLoaded', async function() {
    try {
        setupEventListeners();
        setupGlobalErrorHandling();
        setupPWA();
        initializeScrollAnimations();
        
        // Initial Load
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

        // VALIDATION: Ensure data structure is correct
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid apps.json structure');
        }
        return data;
    } catch (error) {
        console.error('Failed to load app data:', error);
        
        // Fallback: Try to load from cache
        if ('caches' in window) {
            // Note: We blindly look for any cache matching our prefix pattern or just the endpoint
            const keys = await caches.keys();
            for (const key of keys) {
                if (key.includes('minis-ipa-repo')) {
                    const cache = await caches.open(key);
                    const cached = await cache.match(CONFIG.API_ENDPOINT);
                    if (cached) {
                        console.warn('Using cached apps.json due to network failure');
                        return await cached.json();
                    }
                }
            }
        }
        throw error;
    }
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
    
    // Simple Search Filter
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

    // PERFORMANCE: Use DocumentFragment
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
                <img src="${app.icon}" 
                     alt="${safeAlt}" 
                     class="app-icon" 
                     loading="lazy" 
                     decoding="async"
                     width="80" 
                     height="80">
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
        `;
        fragment.appendChild(article);
    });

    appGrid.innerHTML = '';
    appGrid.appendChild(fragment);

    // PERFORMANCE: Event Delegation
    // We only attach one listener to the grid instead of N listeners for N buttons
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
        appGrid.querySelectorAll('.app-card').forEach(card => observer.observe(card));
    }
}

// Rate Limiting & Download
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
    
    // ATOMIC FIX: Push BEFORE returning true to prevent race conditions
    activeDownloads.push(now);
    AppState.downloads.set(appId, activeDownloads);
    
    // UI Feedback: Temporarily disable button
    const btn = document.querySelector(`.action-download[data-id="${appId}"]`);
    if (btn) {
        btn.disabled = true;
        setTimeout(() => btn.disabled = false, 2000);
    }
    
    return true;
}

// Skeleton Loading
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
    
    setTimeout(() => {
        if (observer) {
            document.querySelectorAll('.skeleton-card').forEach(card => observer.observe(card));
        }
    }, 100);
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

// ========== UTILITIES ==========

function sanitizeHtml(dirty) {
    if (!dirty) return '';
    const temp = document.createElement('div');
    temp.textContent = dirty;
    // SECURITY FIX: Handle newlines to prevent attribute injection
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
        return parsed.protocol === 'https:' && 
               (parsed.hostname === 'github.com' || parsed.hostname.endsWith('.github.com'));
    } catch { return false; }
}

function handleError(error) {
    showToast('An error occurred', 'error');
    console.error(error);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.innerHTML = ''; // Clear previous content
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}

// ========== EVENT LISTENERS ==========

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

        // MEMORY LEAK FIX: Clear timeout if page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearTimeout(searchTimeout);
            }
        });
    }

    const btnTroll = document.getElementById('btn-trollapps');
    if(btnTroll) btnTroll.addEventListener('click', () => addToApp('TrollApps', 'trollapps.json'));

    const btnSide = document.getElementById('btn-sidestore');
    if(btnSide) btnSide.addEventListener('click', () => addToApp('SideStore', 'sidestore.json'));

    const btnReset = document.getElementById('btn-reset');
    if(btnReset) btnReset.addEventListener('click', resetLocalData);
}

// Global Capture Listener for Images (CSP Compliant & Robust)
function setupGlobalErrorHandling() {
    // FIX: Use WeakSet to track failed images and prevent infinite loops
    const failedImages = new WeakSet();
    
    document.addEventListener('error', (e) => {
        if (e.target.tagName.toLowerCase() === 'img') {
            if (!failedImages.has(e.target)) {
                failedImages.add(e.target);
                e.target.src = CONFIG.FALLBACK_ICON;
                e.target.alt = 'Default Icon';
                console.warn('Image load failed, switched to fallback:', e.target.closest('.app-card')?.getAttribute('aria-label'));
            } else {
                // Second failure: Use simple data URI to stop network requests
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23333" width="80" height="80"/><text x="40" y="45" text-anchor="middle" fill="white" font-size="30">?</text></svg>';
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
    
    setTimeout(() => {
        showToast(`If ${appName} didn't open, make sure it's installed`, 'info');
    }, 1000);
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
        showToast('Local cache cleared', 'success');
    }
}

// ========== PWA & SCROLL ==========

function initializeScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.fade-in, .fade-in-left').forEach(el => el.classList.add('visible'));
        return;
    }

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
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
                        if (confirm('New version available! Reload to update?')) {
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
    toast.innerHTML = ''; // Clear existing content
    
    const message = document.createTextNode("Install Mini's IPA Repo? ");
    const installButton = document.createElement('button');
    installButton.textContent = 'Install';
    
    // CSP FIX: Use class instead of inline style
    installButton.className = 'toast-install-btn';
    
    installButton.addEventListener('click', installApp);
    
    toast.appendChild(message);
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
