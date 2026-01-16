// ========== APP CONFIGURATION ==========
const CONFIG = {
    SEARCH_DEBOUNCE: 300,
    TOAST_DURATION: 4000,
    SKELETON_DELAY: 500,
    API_ENDPOINT: './sidestore.json',
    RATE_LIMIT_TIME: 300000, // 5 minutes
    RATE_LIMIT_COUNT: 5,
    FALLBACK_ICON: 'https://OofMini.github.io/Minis-IPA-Repo/apps/repo-icon.png'
};

const AppState = {
    apps: [],
    searchTerm: '',
    isLoading: true,
    error: null,
    downloads: new Map(),
    version: '3.2.0'
};

// ========== TEMPLATE DEFINITION (Performance & Security) ==========
const AppCardTemplate = document.createElement('template');
AppCardTemplate.innerHTML = `
    <article class="app-card fade-in" role="article">
        <div class="app-icon-container">
            <img class="app-icon" loading="lazy" decoding="async" width="80" height="80">
        </div>
        <div class="app-status"></div>
        <div class="app-card-content">
            <h3></h3>
            <p class="app-category-wrapper"><span class="app-category-tag"></span></p>
            <p class="app-description-text"></p>
            <p class="app-meta-size"></p>
            <button class="download-btn action-download"></button>
        </div>
    </article>
`;

let deferredPrompt;
let observer = null;

// ========== INITIALIZATION ==========
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
        
        logProfessionalSignature();

    } catch (error) {
        console.error('Initialization error:', error);
        handleError(error);
        showErrorState('Failed to initialize application');
    }
});

// ========== DATA MANAGEMENT ==========
async function loadAppData() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(CONFIG.API_ENDPOINT, { 
            signal: controller.signal,
            cache: 'no-cache' 
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        if (!data?.apps || !Array.isArray(data.apps)) {
            throw new Error('Invalid sidestore.json structure');
        }

        return data.apps.map(app => {
            const latestVersion = app.versions?.[0] ?? {};
            const bundleId = app.bundleIdentifier || '';

            return {
                id: generateId(bundleId),
                name: app.name,
                developer: app.developerName ?? 'Unknown',
                description: app.localizedDescription ?? '',
                icon: app.iconURL ?? CONFIG.FALLBACK_ICON,
                version: latestVersion.version || 'Unknown',
                date: latestVersion.date || '',
                downloadUrl: latestVersion.downloadURL || '',
                category: inferCategory(bundleId),
                size: formatSize(latestVersion.size)
            };
        });

    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Network request timed out');
            throw new Error('Request timed out. Please check your connection.');
        }
        console.error('Failed to load app data:', error);
        throw error;
    }
}

// ========== RENDERING ENGINE ==========
function createAppCard(app, index) {
    const cardFragment = AppCardTemplate.content.cloneNode(true);
    const article = cardFragment.querySelector('article');
    
    // Accessibility & Animation
    article.setAttribute('data-app-id', app.id);
    article.setAttribute('aria-label', app.name);
    article.classList.add(`stagger-${(index % 3) + 1}`);
    
    // Content Injection (Secure via textContent)
    const img = article.querySelector('.app-icon');
    img.src = app.icon;
    img.alt = `Icon for ${app.name} by ${app.developer}`;
    
    article.querySelector('.app-status').textContent = `✅ Fully Working • v${app.version}`;
    article.querySelector('h3').textContent = app.name;
    article.querySelector('.app-category-tag').textContent = app.category;
    
    // HTML is safe here only if we trust the source, but purely for layout fidelity
    // we use innerHTML for description to allow the <b> tag from the original design
    const descEl = article.querySelector('.app-description-text');
    descEl.innerHTML = `By <b>${sanitizeHtml(app.developer)}</b><br>${sanitizeHtml(app.description)}`;
    
    article.querySelector('.app-meta-size').textContent = `Size: ${app.size}`;
    
    const btn = article.querySelector('.download-btn');
    btn.setAttribute('data-id', app.id);
    btn.setAttribute('aria-label', `Download ${app.name} IPA`);
    btn.textContent = '⬇️ Download IPA';
    
    return cardFragment;
}

function renderAppGrid() {
    const appGrid = document.getElementById('appGrid');
    
    // 1. Fade out existing skeletons/content
    const existing = appGrid.querySelectorAll('.app-card, .skeleton-card');
    if (existing.length > 0) {
        existing.forEach(el => el.classList.remove('visible'));
    }

    // 2. Prepare new content
    const filteredApps = AppState.apps.filter(app => {
        if (!AppState.searchTerm) return true;
        return fuzzyMatch(app.name, AppState.searchTerm) ||
               fuzzyMatch(app.description, AppState.searchTerm) ||
               fuzzyMatch(app.developer, AppState.searchTerm);
    });

    // 3. Render (using requestAnimationFrame for smooth UI)
    requestAnimationFrame(() => {
        appGrid.innerHTML = '';
        
        if (filteredApps.length === 0) {
            appGrid.innerHTML = `
                <div class="fade-in no-results">
                    <h3>No apps found</h3>
                    <p>Try different search terms</p>
                </div>
            `;
        } else {
            const fragment = document.createDocumentFragment();
            filteredApps.forEach((app, index) => {
                fragment.appendChild(createAppCard(app, index));
            });
            appGrid.appendChild(fragment);
        }

        // 4. Re-attach observers and listeners
        if (observer) {
            appGrid.querySelectorAll('.fade-in').forEach(card => observer.observe(card));
        }

        if (!appGrid.hasAttribute('data-listening')) {
            appGrid.addEventListener('click', handleGridClick);
            appGrid.setAttribute('data-listening', 'true');
        }
    });
}

function handleGridClick(e) {
    if (e.target.classList.contains('action-download')) {
        const id = e.target.getAttribute('data-id');
        trackDownload(id);
    }
}

// ========== UTILITIES ==========
function fuzzyMatch(text, query) {
    if (!query) return true;
    if (!text) return false;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Priority: Exact substring match
    if (textLower.includes(queryLower)) return true;
    
    // Fallback: Fuzzy sequence match
    let textIndex = 0;
    for (let char of queryLower) {
        textIndex = textLower.indexOf(char, textIndex);
        if (textIndex === -1) return false;
        textIndex++;
    }
    return true;
}

function sanitizeHtml(dirty) {
    if (!dirty) return '';
    const temp = document.createElement('div');
    temp.textContent = dirty;
    return temp.innerHTML.replace(/[<>"'\n\r]/g, (m) => {
        const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '\n': '&#10;', '\r': '&#13;' };
        return map[m];
    });
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

function formatSize(bytes) {
    if (!bytes || isNaN(bytes)) return 'Unknown';
    const mb = (bytes / (1024 * 1024)).toFixed(0);
    return `${mb} MB`;
}

// ========== ACTIONS & EVENTS ==========
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
    
    // UI Feedback
    const btn = document.querySelector(`.action-download[data-id="${appId}"]`);
    if (btn) {
        btn.disabled = true;
        setTimeout(() => btn.disabled = false, 2000);
    }
    return true;
}

function isValidDownloadUrl(url) {
    try {
        const parsed = new URL(url);
        const trustedHosts = ['github.com', 'raw.githubusercontent.com', 'archive.org'];
        return parsed.protocol === 'https:' && 
               (trustedHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)));
    } catch { return false; }
}

function setupEventListeners() {
    const searchBox = document.getElementById('searchBox');
    
    // Search with Debounce
    if (searchBox) {
        let searchTimeout;
        searchBox.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                AppState.searchTerm = e.target.value.toLowerCase().trim();
                renderAppGrid();
            }, CONFIG.SEARCH_DEBOUNCE);
        });
    }

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        // Focus search with '/'
        if (e.key === '/' && document.activeElement !== searchBox) {
            e.preventDefault();
            searchBox.focus();
            return;
        }
        
        // Grid Navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const cards = Array.from(document.querySelectorAll('.app-card, .download-btn'));
            const focused = document.activeElement;
            // Only handle if we aren't in search box
            if (focused === searchBox) return;

            // Simple focus logic for download buttons
            const btns = Array.from(document.querySelectorAll('.download-btn'));
            const currentIndex = btns.indexOf(focused);
            
            if (currentIndex === -1 && btns.length > 0) {
                btns[0].focus();
                e.preventDefault();
                return;
            }

            let nextIndex = currentIndex;
            const cols = window.innerWidth > 768 ? 3 : 1; 

            switch(e.key) {
                case 'ArrowRight': nextIndex = currentIndex + 1; break;
                case 'ArrowLeft': nextIndex = currentIndex - 1; break;
                case 'ArrowDown': nextIndex = currentIndex + cols; break;
                case 'ArrowUp': nextIndex = currentIndex - cols; break;
            }

            if (nextIndex >= 0 && nextIndex < btns.length) {
                btns[nextIndex].focus();
                e.preventDefault();
            }
        }
    });

    // Buttons
    document.getElementById('btn-trollapps')?.addEventListener('click', () => addToApp('TrollApps', 'trollapps.json'));
    document.getElementById('btn-sidestore')?.addEventListener('click', () => addToApp('SideStore', 'sidestore.json'));
    document.getElementById('btn-reset')?.addEventListener('click', resetLocalData);
}

function setupPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            // Check for updates periodically
            setInterval(() => reg.update(), 30 * 60 * 1000);

            // Listen for SW messages
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SW_UPDATED') {
                    showUpdateToast();
                }
            });
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(showInstallPrompt, 3000);
    });
}

function showUpdateToast() {
    const toast = document.getElementById('toast');
    toast.innerHTML = ''; 
    
    const message = document.createTextNode('New version available! ');
    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = 'Reload';
    reloadBtn.className = 'toast-install-btn';
    reloadBtn.onclick = () => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
        }
        window.location.reload();
    };
    
    toast.appendChild(message);
    toast.appendChild(reloadBtn);
    toast.className = 'toast info show';
}

function showInstallPrompt() {
    if (!deferredPrompt) return;
    const toast = document.getElementById('toast');
    toast.innerHTML = ''; 
    
    const message = document.createTextNode("Install Mini's IPA Repo? ");
    const installButton = document.createElement('button');
    installButton.textContent = 'Install';
    installButton.className = 'toast-install-btn';
    
    installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    });
    
    toast.appendChild(message);
    toast.appendChild(installButton);
    toast.className = 'toast info show';
}

function showLoadingState() {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = Array(6).fill(0).map((_, i) => `
        <div class="skeleton-card fade-in stagger-${(i % 3) + 1}">
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
            <button class="download-btn" onclick="location.reload()">Refresh Page</button>
        </div>
    `;
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

function addToApp(appName, manifestFile) {
    const schemes = { 'TrollApps': 'trollapps', 'SideStore': 'sidestore' };
    const scheme = schemes[appName];
    if (!scheme) return;
    const url = `${scheme}://add-repo?url=${encodeURIComponent(window.location.href.replace('index.html','') + manifestFile)}`;
    window.location.href = url;
}

function resetLocalData() {
    if (confirm('Clear all local data and cache?')) {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) caches.keys().then(names => names.forEach(n => caches.delete(n)));
        location.reload();
    }
}

function setupGlobalErrorHandling() {
    const failedImages = new WeakSet();
    document.addEventListener('error', (e) => {
        if (e.target.tagName.toLowerCase() === 'img') {
            if (!failedImages.has(e.target)) {
                failedImages.add(e.target);
                e.target.src = CONFIG.FALLBACK_ICON;
                e.target.alt = 'Default Icon';
            }
        }
    }, true);
}

function logProfessionalSignature() {
    if (typeof console !== 'undefined') {
        const styles = 'color: #8a2be2; font-size: 14px; font-weight: bold; padding: 4px;';
        console.log('%cMini\'s IPA Repo', styles);
        console.log(`%cVersion ${AppState.version} | Built with Vanilla JS`, 'color: #888; font-style: italic');
    }
}
