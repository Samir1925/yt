/**
 * NepalTools - Complete Application Script (Improved)
 * All-in-one SPA with tool management
 */

// Global application state
const AppState = {
    currentPage: 'home',
    isPremium: false,
    theme: localStorage.getItem('nepaltools-theme') || 'light',
    language: localStorage.getItem('nepaltools-language') || 'en',
    tools: [
        {
            id: 'pdf',
            name: 'PDF Tools',
            icon: 'file-pdf',
            description: 'Compress, merge, split, rotate, and extract pages from PDF files.',
            color: '#DC143C',
            page: 'pdf'
        },
        {
            id: 'image',
            name: 'Image Tools',
            icon: 'image',
            description: 'Resize, compress, and convert images to WebP format. Batch processing.',
            color: '#2E8B57',
            page: 'image'
        },
        {
            id: 'date',
            name: 'Date Converter',
            icon: 'calendar-alt',
            description: 'Convert between Bikram Sambat (BS) and Gregorian (AD) calendars.',
            color: '#FF9800',
            page: 'date'
        },
        {
            id: 'gpa',
            name: 'GPA Calculator',
            icon: 'calculator',
            description: 'Calculate GPA for NEB, HISSAN, or custom grading systems.',
            color: '#2196F3',
            page: 'gpa'
        },
        {
            id: 'youtube',
            name: 'YouTube Tools',
            icon: 'youtube',
            description: 'Create thumbnails and generate scripts for YouTube Shorts.',
            color: '#FF0000',
            page: 'youtube'
        },
        {
            id: 'pdf-image',
            name: 'PDF ↔ Image',
            icon: 'exchange-alt',
            description: 'Convert PDF pages to images and images to PDF documents.',
            color: '#9C27B0',
            page: 'pdf-image'
        },
        {
            id: 'spin',
            name: 'Spin Wheel',
            icon: 'redo-alt',
            description: 'Interactive spin wheel for entertainment (no real rewards).',
            color: '#FF5722',
            page: 'spin'
        },
        {
            id: 'offers',
            name: 'Nepal Offers',
            icon: 'tag',
            description: 'Find curated deals and discounts from popular platforms in Nepal.',
            color: '#4CAF50',
            page: 'offers'
        }
    ]
};

// DOM Elements cache
const DOM = {
    body: null,
    toolsGrid: null,
    pages: null,
    navLinks: null,
    mobileMenuToggle: null,
    themeToggle: null,
    premiumToggle: null,
    loadingOverlay: null
};

// Utility functions
const Utils = {
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, duration);
    },
    
    getToastIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    },
    
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        const messageEl = overlay.querySelector('p');
        if (messageEl) messageEl.textContent = message;
    },
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    },
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    sanitizeFilename(name) {
        return name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    }
};

// Tool modules
const Tools = {
    // Initialize all tools
    init() {
        // Tool modules will be initialized when their pages are loaded
    },
    
    // PDF Tools Module
    pdf: {
        init() {
            console.log('Initializing PDF tools');
            this.setupEventListeners();
            Utils.showToast('PDF tools ready', 'success');
        },
        
        setupEventListeners() {
            const uploadArea = document.getElementById('pdf-upload-area');
            if (uploadArea) {
                uploadArea.addEventListener('click', () => {
                    document.getElementById('pdf-file-input').click();
                });
                
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadArea.classList.add('drag-over');
                });
                
                uploadArea.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('drag-over');
                });
                
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('drag-over');
                    this.handleFiles(e.dataTransfer.files);
                });
            }
            
            document.getElementById('pdf-file-input')?.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
            
            // Tab switching
            document.querySelectorAll('[data-tab]').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabId = e.target.dataset.tab;
                    this.switchTab(tabId);
                });
            });
        },
        
        handleFiles(files) {
            if (!files.length) return;
            
            const fileList = document.getElementById('pdf-file-list');
            if (!fileList) return;
            
            fileList.innerHTML = '';
            Array.from(files).forEach(file => {
                if (file.type !== 'application/pdf') {
                    Utils.showToast(`Skipped ${file.name}: Not a PDF file`, 'warning');
                    return;
                }
                
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <div class="file-info">
                        <i class="fas fa-file-pdf"></i>
                        <div>
                            <div class="file-name">${file.name}</div>
                            <div class="file-size">${Utils.formatFileSize(file.size)}</div>
                        </div>
                    </div>
                    <button class="file-remove">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                fileList.appendChild(fileItem);
            });
            
            document.getElementById('pdf-controls')?.classList.remove('hidden');
        },
        
        switchTab(tabId) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tool-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(`${tabId}-tab`)?.classList.add('active');
            document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
            
            Utils.showToast(`Switched to ${tabId} tool`, 'info');
        }
    },
    
    // Image Tools Module
    image: {
        init() {
            console.log('Initializing Image tools');
            this.setupUI();
            Utils.showToast('Image tools ready', 'success');
        },
        
        setupUI() {
            const container = document.getElementById('image-tools-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="tool-actions">
                    <button class="tool-tab active" data-tab="resize">Resize</button>
                    <button class="tool-tab" data-tab="compress">Compress</button>
                    <button class="tool-tab" data-tab="convert">Convert to WebP</button>
                </div>
                <div class="tool-content">
                    <div id="resize-tab" class="tab-content active">
                        <div class="upload-area" id="image-upload-area">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <h3>Drop images here or click to upload</h3>
                            <p>Supports JPG, PNG, WebP. Maximum file size: 25MB</p>
                            <input type="file" id="image-file-input" accept="image/*" multiple hidden>
                            <label for="image-file-input" class="btn btn-primary">Choose Images</label>
                        </div>
                        <div class="tool-controls">
                            <div class="control-group">
                                <label for="width">Width (pixels):</label>
                                <input type="number" id="width" min="1" max="10000" value="1920">
                            </div>
                            <div class="control-group">
                                <label for="height">Height (pixels):</label>
                                <input type="number" id="height" min="1" max="10000" value="1080">
                            </div>
                            <div class="control-group">
                                <label>
                                    <input type="checkbox" id="maintain-aspect" checked> Maintain aspect ratio
                                </label>
                            </div>
                            <button class="btn btn-primary">Resize Images</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('image-upload-area')?.addEventListener('click', () => {
                document.getElementById('image-file-input').click();
            });
            
            document.querySelectorAll('[data-tab]').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabId = e.target.dataset.tab;
                    Tools.pdf.switchTab(tabId); // Reuse PDF tab switching
                });
            });
        }
    },
    
    // Date Converter Module
    date: {
        init() {
            console.log('Initializing Date Converter');
            this.setupUI();
            Utils.showToast('Date converter ready', 'success');
        },
        
        setupUI() {
            const container = document.getElementById('date-converter-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="tool-controls">
                    <div class="control-group">
                        <label>Convert from:</label>
                        <select id="from-calendar">
                            <option value="ad">Gregorian (AD)</option>
                            <option value="bs">Bikram Sambat (BS)</option>
                        </select>
                    </div>
                    
                    <div class="control-group">
                        <label>Date to convert:</label>
                        <input type="date" id="date-input" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="control-group">
                        <label>Convert to:</label>
                        <select id="to-calendar">
                            <option value="bs">Bikram Sambat (BS)</option>
                            <option value="ad">Gregorian (AD)</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-primary" onclick="Tools.date.convert()">Convert Date</button>
                    
                    <div class="result-area hidden" id="date-result">
                        <h4>Conversion Result</h4>
                        <div class="result-info">
                            <p>Original: <span id="original-date">-</span></p>
                            <p>Converted: <strong id="converted-date">-</strong></p>
                        </div>
                    </div>
                    
                    <div class="note">
                        <p><strong>Note:</strong> This is a simplified conversion. For precise historical dates, use specialized software.</p>
                    </div>
                </div>
            `;
        },
        
        convert() {
            const from = document.getElementById('from-calendar').value;
            const to = document.getElementById('to-calendar').value;
            const dateInput = document.getElementById('date-input').value;
            
            if (!dateInput) {
                Utils.showToast('Please select a date', 'warning');
                return;
            }
            
            // Simplified conversion (for demo)
            let result = '';
            if (from === 'ad' && to === 'bs') {
                // AD to BS: Add 57 years (simplified)
                const date = new Date(dateInput);
                const bsYear = date.getFullYear() + 57;
                result = `${bsYear}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            } else if (from === 'bs' && to === 'ad') {
                // BS to AD: Subtract 57 years (simplified)
                const [year, month, day] = dateInput.split('-');
                const adYear = parseInt(year) - 57;
                result = `${adYear}-${month}-${day}`;
            }
            
            // Show result
            document.getElementById('original-date').textContent = `${dateInput} (${from.toUpperCase()})`;
            document.getElementById('converted-date').textContent = `${result} (${to.toUpperCase()})`;
            document.getElementById('date-result').classList.remove('hidden');
            
            Utils.showToast('Date converted successfully', 'success');
        }
    },
    
    // GPA Calculator Module
    gpa: {
        init() {
            console.log('Initializing GPA Calculator');
            this.setupUI();
            Utils.showToast('GPA calculator ready', 'success');
        },
        
        setupUI() {
            const container = document.getElementById('gpa-calculator-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="tool-controls">
                    <div class="control-group">
                        <label>Grading System:</label>
                        <select id="grading-system">
                            <option value="neb">NEB (National Examination Board)</option>
                            <option value="hiss">HISSAN (Higher Secondary School Association)</option>
                            <option value="custom">Custom Grading</option>
                        </select>
                    </div>
                    
                    <div id="subjects-container">
                        <div class="subject-row">
                            <input type="text" placeholder="Subject Name" value="Mathematics">
                            <input type="number" placeholder="Credit Hours" min="1" max="10" value="3">
                            <select>
                                <option value="4.0">A (4.0)</option>
                                <option value="3.6">B+ (3.6)</option>
                                <option value="3.2">B (3.2)</option>
                                <option value="2.8">C+ (2.8)</option>
                                <option value="2.4">C (2.4)</option>
                                <option value="2.0">D (2.0)</option>
                                <option value="0.0">F (0.0)</option>
                            </select>
                            <button class="btn btn-small btn-danger" onclick="this.parentElement.remove()">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-secondary" onclick="Tools.gpa.addSubject()">
                            <i class="fas fa-plus"></i> Add Subject
                        </button>
                        <button class="btn btn-primary" onclick="Tools.gpa.calculate()">
                            <i class="fas fa-calculator"></i> Calculate GPA
                        </button>
                    </div>
                    
                    <div class="result-area hidden" id="gpa-result">
                        <h4>GPA Result</h4>
                        <div class="result-info">
                            <p>Total Credits: <span id="total-credits">0</span></p>
                            <p>Total Grade Points: <span id="total-points">0</span></p>
                            <p><strong>GPA: <span id="final-gpa">0.00</span></strong></p>
                        </div>
                        <button class="btn btn-success" onclick="Tools.gpa.saveResult()">
                            <i class="fas fa-download"></i> Save as PNG
                        </button>
                    </div>
                </div>
            `;
        },
        
        addSubject() {
            const container = document.getElementById('subjects-container');
            const newRow = document.createElement('div');
            newRow.className = 'subject-row';
            newRow.innerHTML = `
                <input type="text" placeholder="Subject Name">
                <input type="number" placeholder="Credit Hours" min="1" max="10" value="3">
                <select>
                    <option value="4.0">A (4.0)</option>
                    <option value="3.6">B+ (3.6)</option>
                    <option value="3.2">B (3.2)</option>
                    <option value="2.8">C+ (2.8)</option>
                    <option value="2.4">C (2.4)</option>
                    <option value="2.0">D (2.0)</option>
                    <option value="0.0">F (0.0)</option>
                </select>
                <button class="btn btn-small btn-danger" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(newRow);
        },
        
        calculate() {
            const rows = document.querySelectorAll('.subject-row');
            if (rows.length === 0) {
                Utils.showToast('Add at least one subject', 'warning');
                return;
            }
            
            let totalCredits = 0;
            let totalPoints = 0;
            
            rows.forEach(row => {
                const creditInput = row.querySelector('input[type="number"]');
                const gradeSelect = row.querySelector('select');
                
                if (creditInput && gradeSelect) {
                    const credits = parseFloat(creditInput.value) || 0;
                    const grade = parseFloat(gradeSelect.value) || 0;
                    
                    totalCredits += credits;
                    totalPoints += credits * grade;
                }
            });
            
            const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
            
            document.getElementById('total-credits').textContent = totalCredits;
            document.getElementById('total-points').textContent = totalPoints.toFixed(2);
            document.getElementById('final-gpa').textContent = gpa;
            document.getElementById('gpa-result').classList.remove('hidden');
            
            Utils.showToast(`GPA calculated: ${gpa}`, 'success');
        },
        
        saveResult() {
            Utils.showToast('Saving result as PNG... (demo)', 'info');
            // In real implementation, use html2canvas library
        }
    }
};

// Main application
const App = {
    // Initialize the application
    init() {
        console.log('Initializing NepalTools...');
        this.cacheDOM();
        this.setupEventListeners();
        this.setupRouting();
        this.renderHomepage();
        this.applyTheme();
        this.updateYear();
        
        // Initialize tool modules
        Tools.init();
        
        console.log('NepalTools initialized successfully');
        Utils.showToast('Welcome to NepalTools!', 'success');
    },
    
    // Cache DOM elements
    cacheDOM() {
        DOM.body = document.body;
        DOM.toolsGrid = document.getElementById('tools-grid');
        DOM.pages = document.querySelectorAll('.page');
        DOM.navLinks = document.querySelectorAll('.nav-link');
        DOM.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        DOM.themeToggle = document.querySelector('.theme-toggle');
        DOM.premiumToggle = document.querySelector('.premium-toggle');
        DOM.loadingOverlay = document.getElementById('loading-overlay');
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Mobile menu toggle
        DOM.mobileMenuToggle?.addEventListener('click', () => {
            const nav = document.querySelector('.nav');
            nav?.classList.toggle('active');
            DOM.mobileMenuToggle.setAttribute('aria-expanded', 
                nav?.classList.contains('active') ? 'true' : 'false'
            );
        });
        
        // Theme toggle
        DOM.themeToggle?.addEventListener('click', () => {
            AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
            this.applyTheme();
            localStorage.setItem('nepaltools-theme', AppState.theme);
            
            // Update icon
            const icon = DOM.themeToggle.querySelector('i');
            icon.className = AppState.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            
            Utils.showToast(`Switched to ${AppState.theme} mode`, 'success');
        });
        
        // Premium toggle
        DOM.premiumToggle?.addEventListener('click', () => {
            AppState.isPremium = !AppState.isPremium;
            DOM.premiumToggle.classList.toggle('active', AppState.isPremium);
            
            // Simulate ad removal
            const ads = document.querySelectorAll('.ad-placeholder');
            ads.forEach(ad => {
                ad.style.display = AppState.isPremium ? 'none' : 'block';
            });
            
            const message = AppState.isPremium 
                ? 'Ads removed (simulated premium mode)'
                : 'Ads restored (simulated free mode)';
            Utils.showToast(message, 'success');
        });
        
        // Navigation links
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                if (page) {
                    this.navigateTo(page);
                }
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav') && !e.target.closest('.mobile-menu-toggle')) {
                document.querySelector('.nav')?.classList.remove('active');
                DOM.mobileMenuToggle?.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Hash change routing
        window.addEventListener('hashchange', () => this.handleHashChange());
        
        // Tool card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tool-cta')) {
                const page = e.target.closest('.tool-cta').dataset.page;
                this.navigateTo(page);
            }
        });
        
        // Language selector
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                AppState.language = e.target.dataset.lang;
                localStorage.setItem('nepaltools-language', AppState.language);
                Utils.showToast(`Language changed to ${AppState.language === 'en' ? 'English' : 'Nepali'}`, 'success');
            });
        });
        
        // Close sticky ad
        document.querySelector('.ad-close')?.addEventListener('click', () => {
            document.querySelector('.ad-sticky-footer').style.display = 'none';
        });
    },
    
    // Setup routing
    setupRouting() {
        // Handle initial hash
        if (!window.location.hash) {
            window.location.hash = '#/';
        }
        this.handleHashChange();
    },
    
    // Handle hash change
    handleHashChange() {
        const hash = window.location.hash.substring(2) || 'home';
        this.navigateTo(hash);
    },
    
    // Navigate to page
    navigateTo(page) {
        // Update active nav link
        DOM.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
        
        // Hide all pages
        DOM.pages.forEach(pageEl => {
            pageEl.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            AppState.currentPage = page;
            
            // Initialize tool for this page
            this.initToolForPage(page);
        } else {
            // Fallback to home
            this.navigateTo('home');
        }
        
        // Close mobile menu
        document.querySelector('.nav')?.classList.remove('active');
        DOM.mobileMenuToggle?.setAttribute('aria-expanded', 'false');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    // Initialize tool for current page
    initToolForPage(page) {
        switch(page) {
            case 'pdf':
                Tools.pdf.init();
                break;
            case 'image':
                Tools.image.init();
                break;
            case 'date':
                Tools.date.init();
                break;
            case 'gpa':
                Tools.gpa.init();
                break;
            case 'youtube':
                // Will be initialized when YouTube page loads
                break;
            case 'pdf-image':
                // Will be initialized when PDF-Image page loads
                break;
            case 'spin':
                // Will be initialized when Spin page loads
                break;
            case 'offers':
                // Will be initialized when Offers page loads
                break;
        }
    },
    
    // Render homepage with tool cards
    renderHomepage() {
        if (!DOM.toolsGrid) {
            console.error('Tools grid element not found!');
            return;
        }
        
        DOM.toolsGrid.innerHTML = AppState.tools.map(tool => `
            <div class="tool-card">
                <div class="tool-icon" style="background-color: ${tool.color}">
                    <i class="fas fa-${tool.icon}"></i>
                </div>
                <h3>${tool.name}</h3>
                <p>${tool.description}</p>
                <button class="tool-cta" data-page="${tool.page}">
                    Open Tool <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `).join('');
        
        console.log(`Rendered ${AppState.tools.length} tool cards`);
    },
    
    // Apply theme
    applyTheme() {
        DOM.body.setAttribute('data-theme', AppState.theme);
    },
    
    // Update current year in footer
    updateYear() {
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make utilities and tools available globally for HTML onclick handlers
window.Utils = Utils;
window.Tools = Tools;
