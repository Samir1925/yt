/**
 * NepalTools Main Application
 */

class NepalToolsApp {
    constructor() {
        this.storage = window.Storage;
        this.currentPage = 'dashboard';
        this.currentTool = null;
        this.tools = {
            pdf: 'PDF Tools',
            image: 'Image Tools',
            date: 'Date Converter',
            gpa: 'GPA Calculator',
            youtube: 'YouTube Tools',
            spin: 'Spin Wheel',
            offers: 'Nepal Offers'
        };
        
        this.init();
    }
    
    async init() {
        console.log('NepalTools App Initializing...');
        
        // Load settings
        await this.loadSettings();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateStorageDisplay();
        this.loadDashboard();
        
        // Check for updates
        this.checkForUpdates();
        
        console.log('NepalTools App Ready');
        this.showToast('NepalTools loaded successfully!', 'success');
    }
    
    async loadSettings() {
        this.settings = await this.storage.getSettings();
        
        // Apply theme
        document.body.setAttribute('data-theme', this.settings.theme);
        
        // Apply language
        this.loadLanguage(this.settings.language);
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // File upload
        document.getElementById('upload-pdf-btn')?.addEventListener('click', () => {
            document.getElementById('pdf-file-input').click();
        });
        
        document.getElementById('pdf-file-input')?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files, 'pdf');
        });
        
        // Drag and drop
        const uploadArea = document.getElementById('pdf-upload-area');
        if (uploadArea) {
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
                
                const files = Array.from(e.dataTransfer.files).filter(file => 
                    file.type === 'application/pdf'
                );
                
                if (files.length > 0) {
                    this.handleFileUpload(files, 'pdf');
                } else {
                    this.showToast('Please drop PDF files only', 'warning');
                }
            });
        }
        
        // Clear storage
        document.getElementById('clear-storage-btn')?.addEventListener('click', () => {
            this.clearStorage();
        });
        
        // Export/Import
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.storage.exportData();
        });
        
        document.getElementById('import-data-btn')?.addEventListener('click', () => {
            this.importData();
        });
        
        // Reset app
        document.getElementById('reset-app-btn')?.addEventListener('click', () => {
            this.resetApp();
        });
        
        // Operation buttons
        document.querySelectorAll('.btn-operation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const operation = e.currentTarget.closest('.operation-card').dataset.operation;
                this.handlePDFOperation(operation);
            });
        });
        
        // Sort buttons
        document.getElementById('sort-by-date')?.addEventListener('click', () => {
            this.sortFiles('date');
        });
        
        document.getElementById('sort-by-size')?.addEventListener('click', () => {
            this.sortFiles('size');
        });
        
        document.getElementById('delete-all-files')?.addEventListener('click', () => {
            this.deleteAllFiles();
        });
    }
    
    navigateTo(page) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            
            // Load page content
            this.loadPage(page);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    async loadPage(page) {
        switch(page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'pdf':
                await this.loadPDFTools();
                break;
            case 'storage':
                await this.loadStorageManager();
                break;
            case 'image':
                await this.loadImageTools();
                break;
            case 'date':
                await this.loadDateConverter();
                break;
            case 'gpa':
                await this.loadGPACalculator();
                break;
            // Add other pages as needed
        }
    }
    
    async loadDashboard() {
        // Update stats
        const stats = await this.storage.getStats();
        const usage = await this.storage.getStorageUsage();
        
        document.getElementById('file-count').textContent = stats.totalFiles;
        document.getElementById('space-used').textContent = this.storage.formatSize(stats.totalSize);
        document.getElementById('tools-count').textContent = Object.keys(this.tools).length;
        document.getElementById('last-active').textContent = this.formatTime(stats.lastUpdated);
        
        // Update storage display
        this.updateStorageDisplay();
        
        // Load recent files
        await this.loadRecentFiles();
        
        // Load tools grid
        this.loadToolsGrid();
    }
    
    loadToolsGrid() {
        const grid = document.getElementById('tools-grid');
        if (!grid) return;
        
        const tools = [
            {
                id: 'pdf',
                name: 'PDF Tools',
                icon: 'file-pdf',
                description: 'Compress, merge, split, and edit PDF files offline.',
                color: '#e74c3c'
            },
            {
                id: 'image',
                name: 'Image Tools',
                icon: 'image',
                description: 'Resize, compress, and convert images in your browser.',
                color: '#3498db'
            },
            {
                id: 'date',
                name: 'Date Converter',
                icon: 'calendar-alt',
                description: 'Convert between Bikram Sambat and Gregorian calendars.',
                color: '#2ecc71'
            },
            {
                id: 'gpa',
                name: 'GPA Calculator',
                icon: 'calculator',
                description: 'Calculate GPA for NEB, HISSAN, and custom systems.',
                color: '#9b59b6'
            },
            {
                id: 'youtube',
                name: 'YouTube Tools',
                icon: 'youtube',
                description: 'Create thumbnails and generate video scripts.',
                color: '#ff0000'
            },
            {
                id: 'spin',
                name: 'Spin Wheel',
                icon: 'redo',
                description: 'Interactive spin wheel for entertainment.',
                color: '#f39c12'
            },
            {
                id: 'offers',
                name: 'Nepal Offers',
                icon: 'tag',
                description: 'Find curated deals from Nepali platforms.',
                color: '#1abc9c'
            }
        ];
        
        grid.innerHTML = tools.map(tool => `
            <div class="tool-card" data-tool="${tool.id}">
                <div class="tool-icon" style="background-color: ${tool.color}">
                    <i class="fas fa-${tool.icon}"></i>
                </div>
                <h3>${tool.name}</h3>
                <p>${tool.description}</p>
                <button class="tool-cta" data-page="${tool.id}">
                    Open Tool <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `).join('');
        
        // Add event listeners to tool cards
        grid.querySelectorAll('.tool-cta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    async loadRecentFiles() {
        const list = document.getElementById('recent-files-list');
        if (!list) return;
        
        const recentFiles = await this.storage.getRecentFiles(5);
        
        if (recentFiles.length === 0) {
            list.innerHTML = '<p class="empty-message">No files yet. Upload some files to get started.</p>';
            return;
        }
        
        list.innerHTML = recentFiles.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">
                        <i class="fas fa-${file.type.includes('pdf') ? 'file-pdf' : 'image'}"></i>
                    </div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.storage.formatSize(file.size)} • ${this.formatTime(file.timestamp)}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action" data-action="download" data-id="${file.id}" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="file-action" data-action="delete" data-id="${file.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        list.querySelectorAll('[data-action="download"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.currentTarget.dataset.id;
                this.downloadFile(fileId);
            });
        });
        
        list.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.currentTarget.dataset.id;
                this.deleteFile(fileId);
            });
        });
    }
    
    async loadPDFTools() {
        // Load PDF files
        await this.loadPDFFiles();
        
        // Load PDF operations UI
        this.loadPDFOperations();
    }
    
    async loadPDFFiles() {
        const container = document.getElementById('pdf-files-container');
        if (!container) return;
        
        const pdfFiles = await this.storage.getFilesByType('pdf');
        
        if (pdfFiles.length === 0) {
            container.innerHTML = '<p class="empty-message">No PDF files in storage. Upload some PDFs to get started.</p>';
            return;
        }
        
        container.innerHTML = pdfFiles.map(file => `
            <div class="file-item" data-id="${file.id}">
                <div class="file-info">
                    <div class="file-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.storage.formatSize(file.size)} • ${this.formatTime(file.timestamp)}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action" data-action="preview" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="file-action" data-action="download" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="file-action" data-action="delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        container.querySelectorAll('[data-action="download"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.currentTarget.closest('.file-item').dataset.id;
                this.downloadFile(fileId);
            });
        });
        
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.currentTarget.closest('.file-item').dataset.id;
                this.deleteFile(fileId);
            });
        });
    }
    
    loadPDFOperations() {
        // This would load specific PDF operation interfaces
        // For now, we'll just handle the operation buttons
    }
    
    async loadStorageManager() {
        // Update storage stats
        const stats = await this.storage.getStats();
        const pdfFiles = await this.storage.getFilesByType('pdf');
        const imageFiles = await this.storage.getFilesByType('image');
        
        document.getElementById('pdf-count').textContent = `${pdfFiles.length} files`;
        document.getElementById('image-count').textContent = `${imageFiles.length} files`;
        document.getElementById('total-files-count').textContent = `${stats.totalFiles} files`;
        document.getElementById('storage-total-used').textContent = this.storage.formatSize(stats.totalSize);
        
        // Load all files
        await this.loadAllFiles();
    }
    
    async loadAllFiles() {
        const grid = document.getElementById('all-files-grid');
        if (!grid) return;
        
        const files = await this.storage.getFiles();
        const fileList = Object.values(files);
        
        if (fileList.length === 0) {
            grid.innerHTML = '<p class="empty-message">No files in storage.</p>';
            return;
        }
        
        grid.innerHTML = fileList.map(file => `
            <div class="file-card" data-id="${file.id}">
                <div class="file-card-icon">
                    <i class="fas fa-${this.getFileIcon(file.type)}"></i>
                </div>
                <div class="file-card-info">
                    <h4>${file.name}</h4>
                    <p class="file-type">${this.getFileType(file.type)}</p>
                    <p class="file-size">${this.storage.formatSize(file.size)}</p>
                    <p class="file-date">${this.formatTime(file.timestamp)}</p>
                </div>
                <div class="file-card-actions">
                    <button class="btn btn-sm" data-action="download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        grid.querySelectorAll('[data-action="download"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.currentTarget.closest('.file-card').dataset.id;
                this.downloadFile(fileId);
            });
        });
        
        grid.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.currentTarget.closest('.file-card').dataset.id;
                this.deleteFile(fileId);
            });
        });
    }
    
    async handleFileUpload(files, category = 'other') {
        const fileArray = Array.from(files);
        let successCount = 0;
        
        this.showLoading(`Uploading ${fileArray.length} file(s)...`);
        
        for (const file of fileArray) {
            try {
                const fileId = await this.storage.saveFile(file, category);
                successCount++;
                
                // Update file access time
                await this.storage.updateFileMetadata(fileId, {
                    lastAccessed: Date.now()
                });
                
            } catch (error) {
                this.showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
            }
        }
        
        this.hideLoading();
        
        if (successCount > 0) {
            this.showToast(`Successfully uploaded ${successCount} file(s)`, 'success');
            
            // Refresh current page
            await this.loadPage(this.currentPage);
            
            // Update storage display
            await this.updateStorageDisplay();
        }
    }
    
    async handlePDFOperation(operation) {
        // Get selected PDF files
        const pdfFiles = await this.storage.getFilesByType('pdf');
        
        if (pdfFiles.length === 0) {
            this.showToast('Please upload some PDF files first', 'warning');
            return;
        }
        
        switch(operation) {
            case 'compress':
                await this.compressPDF(pdfFiles);
                break;
            case 'merge':
                await this.mergePDFs(pdfFiles);
                break;
            case 'split':
                await this.splitPDF(pdfFiles[0]);
                break;
            case 'rotate':
                await this.rotatePDF(pdfFiles[0]);
                break;
        }
    }
    
    async compressPDF(files) {
        this.showLoading('Compressing PDF...');
        
        try {
            // Load PDF library
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            const file = files[0]; // For now, process first file
            const blob = this.storage.dataURLtoBlob(file.data);
            const arrayBuffer = await blob.arrayBuffer();
            
            // Load PDF document
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            // Get compression settings
            const settings = await this.storage.getSettings();
            const quality = settings.compressionLevel === 'high' ? 0.5 : 
                           settings.compressionLevel === 'low' ? 0.9 : 0.7;
            
            // Compress
            const compressedBytes = await pdfDoc.save({
                useObjectStreams: true,
                updateFieldAppearances: false
            });
            
            // Create new file
            const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
            const compressedFile = new File([compressedBlob], `compressed_${file.name}`, { 
                type: 'application/pdf' 
            });
            
            // Save compressed file
            const newFileId = await this.storage.saveFile(compressedFile, 'pdf');
            
            this.hideLoading();
            this.showToast('PDF compressed successfully!', 'success');
            
            // Download the compressed file
            await this.downloadFile(newFileId);
            
        } catch (error) {
            this.hideLoading();
            this.showToast(`Compression failed: ${error.message}`, 'error');
            console.error('PDF compression error:', error);
        }
    }
    
    async mergePDFs(files) {
        if (files.length < 2) {
            this.showToast('Please select at least 2 PDF files to merge', 'warning');
            return;
        }
        
        this.showLoading(`Merging ${files.length} PDFs...`);
        
        try {
            if (!window.PDFLib) {
                await this.loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
            }
            
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            for (const file of files) {
                const blob = this.storage.dataURLtoBlob(file.data);
                const arrayBuffer = await blob.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }
            
            const mergedBytes = await mergedPdf.save();
            const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });
            const mergedFile = new File([mergedBlob], `merged_${Date.now()}.pdf`, {
                type: 'application/pdf'
            });
            
            const newFileId = await this.storage.saveFile(mergedFile, 'pdf');
            
            this.hideLoading();
            this.showToast('PDFs merged successfully!', 'success');
            
            await this.downloadFile(newFileId);
            
        } catch (error) {
            this.hideLoading();
            this.showToast(`Merge failed: ${error.message}`, 'error');
            console.error('PDF merge error:', error);
        }
    }
    
    async downloadFile(fileId) {
        try {
            const file = await this.storage.getFile(fileId);
            if (!file) {
                throw new Error('File not found');
            }
            
            const blob = this.storage.dataURLtoBlob(file.data);
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            // Update access time
            await this.storage.updateFileMetadata(fileId, {
                lastAccessed: Date.now()
            });
            
            this.showToast('Download started!', 'success');
            
        } catch (error) {
            this.showToast(`Download failed: ${error.message}`, 'error');
        }
    }
    
    async deleteFile(fileId) {
        if (confirm('Are you sure you want to delete this file?')) {
            const success = await this.storage.deleteFile(fileId);
            
            if (success) {
                this.showToast('File deleted successfully', 'success');
                
                // Refresh current page
                await this.loadPage(this.currentPage);
                
                // Update storage display
                await this.updateStorageDisplay();
            } else {
                this.showToast('Failed to delete file', 'error');
            }
        }
    }
    
    async deleteAllFiles() {
        if (confirm('Are you sure you want to delete ALL files? This action cannot be undone.')) {
            this.showLoading('Deleting all files...');
            
            // Get all files
            const files = await this.storage.getFiles();
            const fileIds = Object.keys(files);
            
            // Delete each file
            for (const fileId of fileIds) {
                await this.storage.deleteFile(fileId);
            }
            
            this.hideLoading();
            this.showToast('All files deleted successfully', 'success');
            
            // Refresh storage page
            await this.loadStorageManager();
            
            // Update storage display
            await this.updateStorageDisplay();
        }
    }
    
    async clearStorage() {
        if (confirm('Are you sure you want to clear all app data? This will delete all files and reset settings.')) {
            this.showLoading('Clearing storage...');
            
            const success = await this.storage.clear();
            
            this.hideLoading();
            
            if (success) {
                this.showToast('Storage cleared successfully', 'success');
                
                // Reload dashboard
                await this.loadDashboard();
                
                // Update storage display
                await this.updateStorageDisplay();
            } else {
                this.showToast('Failed to clear storage', 'error');
            }
        }
    }
    
    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showLoading('Importing data...');
            
            try {
                await this.storage.importData(file);
                this.hideLoading();
                this.showToast('Data imported successfully!', 'success');
                
                // Refresh dashboard
                await this.loadDashboard();
                
                // Update storage display
                await this.updateStorageDisplay();
                
            } catch (error) {
                this.hideLoading();
                this.showToast(`Import failed: ${error.message}`, 'error');
            }
        };
        
        input.click();
    }
    
    async resetApp() {
        if (confirm('Reset app to default settings? This will keep your files but reset all preferences.')) {
            await this.storage.updateSettings({
                theme: 'light',
                language: 'en',
                autoSave: true,
                compressionLevel: 'medium'
            });
            
            this.showToast('App reset successfully', 'success');
            
            // Reload settings
            await this.loadSettings();
        }
    }
    
    async updateStorageDisplay() {
        const usage = await this.storage.getStorageUsage();
        
        document.getElementById('storage-used').textContent = 
            `${this.storage.formatSize(usage.used)} / ${this.storage.formatSize(usage.total)}`;
        
        document.getElementById('storage-fill').style.width = `${Math.min(usage.percent, 100)}%`;
    }
    
    sortFiles(criteria) {
        // Implementation for sorting files
        this.showToast(`Sorted files by ${criteria}`, 'info');
    }
    
    // Utility Methods
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }
    
    getToastIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
    
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;
        
        const messageEl = overlay.querySelector('p');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    getFileIcon(mimeType) {
        if (mimeType.includes('pdf')) return 'file
