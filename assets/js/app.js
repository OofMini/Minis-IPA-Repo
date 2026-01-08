// ========== APP CONFIGURATION ==========
const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    TOAST_DURATION: 3000,
    SKELETON_DELAY: 800,
    API_ENDPOINT: './apps.json',
    RATE_LIMIT_TIME: 300000, // 5 minutes
    RATE_LIMIT_COUNT: 5
};

// State Management
const AppState = {
    apps: [],
    filteredApps: [],
    searchTerm: '',
    activeCategory: 'all',
    sortBy: 'name',
    isLoading: true,
    error: null,
    
    // Rate limit tracking
    downloads: new Map()
};

let deferredPrompt;
let searchTimeout;
let observer = null;

// ========== CORE FUNCTIONS ==========

document.addEventListener('DOMContentLoaded', async function() {
    try {
        setupEventListeners();
        setupPWA();
        initializeScrollAnimations();
        
        // Initial Load
        showLoadingState();
        AppState.apps = await loadAppData();
        AppState.filteredApps = [...AppState.apps]; // Initialize filtered list
        
        AppState.isLoading = false;
        renderAppGrid();

    } catch (error) {
        console.error('Initialization error:', error);
        handleError(error);
        showErrorState('Failed to initialize application');
    }
});

// Fetch Data from JSON
async function loadAppData() {
    try {
        const response = await fetchWithRetry(CONFIG.API_ENDPOINT);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to load app data:', error);
        throw error;
    }
}

// Robust Fetch with Retry
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

// Render the grid based on current state
function renderAppGrid() {
    const appGrid = document.getElementById('appGrid');
    
    // Filter and Sort
    let result = AppState.apps.filter(app => {
        // Search Filter
        const term = AppState.searchTerm.toLowerCase();
        const matchesSearch = !term || 
               app.name.toLowerCase().includes(term) ||
               app.description.toLowerCase().includes(term) ||
               app.developer.toLowerCase().includes(term);
        
        // Category Filter
        const matchesCategory = AppState.activeCategory === 'all' || 
                                app.category === AppState.activeCategory;
                                
        return matchesSearch && matchesCategory;
    });

    // Sorting
    result = sortApps(result, AppState.sortBy);

    if (result.length === 0) {
        appGrid.innerHTML = `
            <div class="fade-in" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-color);opacity:0.7">
                <h3>No apps found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    appGrid.innerHTML = result.map((app, index) => {
        const safeId = sanitizeHtml(app.id);
        const safeName = sanitizeHtml(app.name);
        const safeDeveloper = sanitizeHtml(app.developer);
        const safeDescription = sanitizeHtml(app.description);
        
        return `
        <article class="app-card fade-in stagger-${(index % 3) + 1}" aria-label="${safeName}" data-app-id="${safeId}">
            <div class="app-icon-container">
                <img src="${app.icon}" 
                     alt="Icon for ${safeName}" 
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
                <p><span class="badge" style="background:var(--card-bg);">${app.category}</span></p>
                <p>By <b>${safeDeveloper}</b><br>${safeDescription}</p>
                <p class="app-size">Size: ${app.size}</p>
                
                <div class="button-group" style="margin-top:auto; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                    <button class="download-btn action-download" data-id="${safeId}" aria-label="Download ${safeName} IPA">
                        ⬇️ Download
                    </button>
                    <button class="icon-btn action-share" data-id="${safeId}" aria-label="Share ${safeName}" title="Share">
                        🔗
                    </button>
                </div>
            </div>
        </article>
        `;
    }).join('');

    // Re-attach listeners
    setTimeout(() => {
        document.querySelectorAll('.action-download').forEach(btn => {
            btn.addEventListener('click', (e) => trackDownload(e.target.dataset.id));
        });
        document.querySelectorAll('.action-share').forEach(btn => {
            btn.addEventListener('click', (e) => shareApp(e.target.dataset.id));
        });
        
        // Re-observe for animations
        if (observer) {
            document.querySelectorAll('.app-card').forEach(el => observer.observe(el));
        }
    }, 50);
}

// Sorting Logic
function sortApps(apps, sortBy) {
    return [...apps].sort((a, b) => {
        switch(sortBy) {
            case 'name': return a.name.localeCompare(b.name);
            case 'recent': return b.version.localeCompare(a.version); // Basic version compare
            case 'size': return parseInt(a.size) - parseInt(b.size);
            default: return 0;
        }
    });
}

// Rate Limiting & Download
async function trackDownload(appId) {
    try {
        // Rate Limit Check
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
    
    // Filter out old downloads
    const activeDownloads = recent.filter(time => time > now - CONFIG.RATE_LIMIT_TIME);
    
    if (activeDownloads.length >= CONFIG.RATE_LIMIT_COUNT) {
        showToast('Too many downloads. Please wait a few minutes.', 'warning');
        return false;
    }
    
    activeDownloads.push(now);
    AppState.downloads.set(appId, activeDownloads);
    return true;
}

// Share Functionality
async function shareApp(appId) {
    const app = AppState.apps.find(a => a.id === appId);
    if (!app) return;

    if (navigator.share) {
        try {
            await navigator.share({
                title: app.name,
                text: `Check out ${app.name} on Mini's IPA Repo!`,
                url: window.location.href
            });
        } catch (err) {
            console.log('Share cancelled');
        }
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(`${app.name} - ${app.downloadUrl}`);
        showToast('Link copied to clipboard!', 'info');
    }
}

// Skeleton Loading
function showLoadingState() {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = Array(6).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-button"></div>
        </div>
    `).join('');
}

function showErrorState(msg) {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = `
        <div class="error-state fade-in">
            <div class="error-emoji">⚠️</div>
            <h3>Something went wrong</h3>
            <p>${sanitizeHtml(msg)}</p>
            <button class="download-btn" onclick="location.reload()">Refresh Page</button>
        </div>
    `;
}

// ========== UTILITIES ==========

function sanitizeHtml(dirty) {
    if (!dirty) return '';
    const temp = document.createElement('div');
    temp.textContent = dirty;
    return temp.innerHTML.replace(/[<>"']/g, (m) => {
        switch (m) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
        }
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
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    // Search
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                AppState.searchTerm = e.target.value.trim();
                renderAppGrid();
            }, CONFIG.SEARCH_DEBOUNCE);
        });
    }

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update State
            AppState.activeCategory = e.target.dataset.category;
            renderAppGrid();
        });
    });

    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            AppState.sortBy = e.target.value;
            renderAppGrid();
        });
    }

    // Keyboard Nav
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchBox) {
            e.preventDefault();
            searchBox?.focus();
        }
    });
    
    // Static Buttons
    document.getElementById('btn-trollapps')?.addEventListener('click', () => addToApp('TrollApps', 'trollapps.json'));
    document.getElementById('btn-sidestore')?.addEventListener('click', () => addToApp('SideStore', 'sidestore.json'));
    document.getElementById('btn-reset')?.addEventListener('click', resetLocalData);
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
    if (confirm('Clear local cache?')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    }
}

// ========== PWA & SCROLL ==========

function initializeScrollAnimations() {
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
    }
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
}
