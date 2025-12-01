/**
 * NepalTools - Main Application Script
 * SPA routing, navigation, and core functionality
 */

// Import tool modules
import { initPDFTools } from './tools/pdf.js';
import { initImageTools } from './tools/image.js';
import { initDateConverter } from './tools/date-converter.js';
import { initGPACalculator } from './tools/gpa-calculator.js';
import { initYouTubeThumbnail } from './tools/youtube-thumbnail.js';
import { initCaptionGenerator } from './tools/caption-generator.js';
import { initSpinWheel } from './tools/spin-wheel.js';
import { initOffers } from './tools/offers.js';
import { showToast, showLoading, hideLoading } from './utils.js';

// App state
const AppState = {
    currentPage: 'home',
    isPremium: false,
    language: 'en',
    theme: 'light',
    adsEnabled: true
};

// Tool data for the homepage grid
const TOOLS_DATA = [
    {
        id: 'pdf',
        name: 'PDF Tools',
        icon: 'file-pdf',
        description: 'Compress, merge, split, rotate, and extract pages from PDF files.',
        color: '#DC143C',
        page: 'pdf-tools'
    },
    {
        id: 'image',
        name: 'Image Tools',
        icon: 'image',
        description: 'Resize, compress, and convert images to WebP format. Batch processing.',
        color: '#2E8B57',
        page: 'image-tools'
    },
    {
        id: 'date',
        name: 'Date Converter',
        icon: 'calendar-alt',
        description: 'Convert between Bikram Sambat (BS) and Gregorian (AD) calendars.',
        color: '#FF9800',
        page: 'date-converter'
    },
    {
        id: 'gpa',
        name: 'GPA Calculator',
        icon: 'calculator',
        description: 'Calculate GPA for NEB, HISSAN, or custom grading systems.',
        color: '#2196F3',
        page: 'gpa-calculator'
    },
    {
        id: 'youtube',
        name: 'YouTube Tools',
        icon: 'youtube',
        description: 'Create thumbnails and generate scripts for YouTube Shorts.',
        color: '#FF0000',
        page: 'youtube-tools'
    },
    {
        id: 'pdf-image',
        name: 'PDF ↔ Image',
        icon: 'exchange-alt',
        description: 'Convert PDF pages to images and images to PDF documents.',
        color: '#9C27B0',
        page: 'pdf-image-tools'
    },
    {
        id: 'spin',
        name: 'Spin Wheel',
        icon: 'redo-alt',
        description: 'Interactive spin wheel for entertainment (no real rewards).',
        color: '#FF5722',
        page: 'spin-wheel'
    },
    {
        id: 'offers',
        name: 'Nepal Offers',
        icon: 'tag',
        description: 'Find curated deals and discounts from popular platforms in Nepal.',
        color: '#4CAF50',
        page: 'offers'
    }
];

// DOM elements
let DOM = {};

// Initialize the application
function init() {
    cacheDOM();
    setupEventListeners();
    setupRouting();
    renderHomepage();
    updateYear();
    loadPreferences();
    
    // Initialize tool modules when their pages load
    initToolModules();
    
    console.log('NepalTools initialized successfully');
}

// Cache DOM elements
function cacheDOM() {
    DOM = {
        body: document.body,
        header: document.querySelector('.header'),
        mainContent: document.getElementById('main-content'),
        mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
        nav: document.querySelector('.nav'),
        navLinks: document.querySelectorAll('.nav-link'),
        themeToggle: document.querySelector('.theme-toggle'),
        premiumToggle: document.querySelector('.premium-toggle'),
        languageSelector: document.querySelector('.language-selector'),
        toolsGrid: document.getElementById('tools-grid'),
        loadingOverlay: document.getElementById('loading-overlay'),
        toastContainer: document.getElementById('toast-container')
    };
}

// Set up event listeners
function setupEventListeners() {
    // Mobile menu toggle
    DOM.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    // Theme toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Premium toggle
    DOM.premiumToggle.addEventListener('click', togglePremium);
    
    // Language selector
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', (e) => changeLanguage(e.target.dataset.lang));
    });
    
    // Navigation links
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav') && !e.target.closest('.mobile-menu-toggle')) {
            DOM.nav.classList.remove('active');
            DOM.mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Handle hash changes for SPA routing
    window.addEventListener('hashchange', handleHashChange);
    
    // Close toast on click
    DOM.toastContainer.addEventListener('click', (e) => {
        if (e.target.closest('.toast-close')) {
            e.target.closest('.toast').remove();
        }
    });
    
    // Close sticky footer ad
    const adCloseBtn = document.querySelector('.ad-close');
    if (adCloseBtn) {
        adCloseBtn.addEventListener('click', () => {
            document.querySelector('.ad-sticky-footer').style.display = 'none';
        });
    }
}

// Set up hash-based routing
function setupRouting() {
    // Handle initial hash
    handleHashChange();
    
    // Override anchor clicks for SPA navigation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.hash && link.getAttribute('href').startsWith('#/')) {
            e.preventDefault();
            window.location.hash = link.hash;
        }
    });
}

// Handle hash changes
function handleHashChange() {
    const hash = window.location.hash || '#/';
    const page = hash.substring(2) || 'home';
    
    // Update active page
    navigateTo(page);
}

// Navigate to a specific page
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Show target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = page;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Initialize tool if needed
        initToolForPage(page);
    } else {
        // Fallback to home
        navigateTo('home');
    }
    
    // Close mobile menu
    DOM.nav.classList.remove('active');
    DOM.mobileMenuToggle.setAttribute('aria-expanded', 'false');
}

// Initialize tool for current page
function initToolForPage(page) {
    switch (page) {
        case 'pdf-tools':
            initPDFTools();
            break;
        case 'image-tools':
            initImageTools();
            break;
        case 'date-converter':
            initDateConverter();
            break;
        case 'gpa-calculator':
            initGPACalculator();
            break;
        case 'youtube-tools':
            initYouTubeThumbnail();
            initCaptionGenerator();
            break;
        case 'pdf-image-tools':
            // Will be implemented in pdf-image.js
            break;
        case 'spin-wheel':
            initSpinWheel();
            break;
        case 'offers':
            initOffers();
            break;
    }
}

// Initialize all tool modules
function initToolModules() {
    // Tool modules are initialized when their pages are loaded
    // to avoid loading all JavaScript at once
}

// Render homepage with tool cards
function renderHomepage() {
    if (!DOM.toolsGrid) return;
    
    DOM.toolsGrid.innerHTML = TOOLS_DATA.map(tool => `
        <div class="tool-card" data-tool="${tool.id}">
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
    
    // Add event listeners to tool cards
    DOM.toolsGrid.querySelectorAll('.tool-cta').forEach(button => {
        button.addEventListener('click', () => {
            window.location.hash = `#/${button.dataset.page}`;
        });
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    const isExpanded = DOM.mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    DOM.mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
    DOM.nav.classList.toggle('active');
}

// Toggle theme
function toggleTheme() {
    const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Update icon
    const icon = DOM.themeToggle.querySelector('i');
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    showToast(`Switched to ${newTheme} mode`, 'success');
}

// Set theme
function setTheme(theme) {
    AppState.theme = theme;
    DOM.body.setAttribute('data-theme', theme);
    localStorage.setItem('nepaltools-theme', theme);
}

// Toggle premium (remove ads)
function togglePremium() {
    AppState.isPremium = !AppState.isPremium;
    DOM.premiumToggle.classList.toggle('active', AppState.isPremium);
    
    // Simulate ad removal (in a real app, this would hide ads)
    const ads = document.querySelectorAll('.ad-placeholder');
    ads.forEach(ad => {
        if (AppState.isPremium) {
            ad.style.display = 'none';
        } else {
            ad.style.display = 'block';
        }
    });
    
    const message = AppState.isPremium ? 
        'Ads removed (simulated premium mode)' : 
        'Ads restored (simulated free mode)';
    showToast(message, 'success');
}

// Change language
function changeLanguage(lang) {
    AppState.language = lang;
    localStorage.setItem('nepaltools-language', lang);
    
    // Update UI based on language
    updateLanguageUI(lang);
    showToast(`Language changed to ${lang === 'en' ? 'English' : 'Nepali'}`, 'success');
    
    // Note: In a production app, you would load translation strings
    // and update all text content on the page
}

// Update UI based on language
function updateLanguageUI(lang) {
    // Update language button text
    const langBtn = document.querySelector('.lang-btn');
    if (langBtn) {
        langBtn.innerHTML = `${lang.toUpperCase()} <i class="fas fa-globe"></i>`;
    }
    
    // Update tool names and descriptions if translations are available
    // This is a simplified example
    if (lang === 'ne') {
        // Nepali translations would go here
        console.log('Switching to Nepali language');
    }
}

// Load user preferences from localStorage
function loadPreferences() {
    // Load theme
    const savedTheme = localStorage.getItem('nepaltools-theme');
    if (savedTheme) {
        setTheme(savedTheme);
        const icon = DOM.themeToggle.querySelector('i');
        icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Load language
    const savedLang = localStorage.getItem('nepaltools-language');
    if (savedLang) {
        changeLanguage(savedLang);
    }
    
    // Load premium status
    const savedPremium = localStorage.getItem('nepaltools-premium');
    if (savedPremium === 'true') {
        togglePremium(); // Will toggle to premium
    }
}

// Update current year in footer
function updateYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Handle navigation
function handleNavigation(e) {
    e.preventDefault();
    const page = e.target.dataset.page;
    if (page) {
        window.location.hash = `#/${page}`;
    }
}

// Handle contact form submission
function handleContactForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // In a real app, you would send this to a server
    // For now, just show a success message
    showToast('Thank you for your message! We\'ll get back to you soon.', 'success');
    
    // Reset form
    e.target.reset();
}

// Initialize contact form if it exists
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
}

// Handle dropdowns on mobile
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-dropdown > .nav-link').forEach(button => {
        button.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const dropdown = button.parentElement;
                dropdown.classList.toggle('active');
            }
        });
    });
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export for use in other modules
export { AppState, navigateTo, showToast, showLoading, hideLoading };
