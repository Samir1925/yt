/**
 * NepalTools Storage Manager
 * Handles Chrome Storage API with localStorage fallback
 */

class StorageManager {
    constructor() {
        this.storage = this.detectStorage();
        this.QUOTA = {
            CHROME: 1024 * 1024 * 1024, // 1GB for Chrome Storage
            LOCAL: 10 * 1024 * 1024     // 10MB for localStorage
        };
        this.MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
        this.STORAGE_KEYS = {
            FILES: 'nepaltools_files',
            SETTINGS: 'nepaltools_settings',
            HISTORY: 'nepaltools_history',
            STATS: 'nepaltools_stats'
        };
        
        this.init();
    }
    
    detectStorage() {
        // Check if we're in Chrome extension context
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            console.log('Using Chrome Storage API');
            return chrome.storage.local;
        } 
        // Check for browser storage
        else if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
            console.log('Using WebExtensions Storage API');
            return browser.storage.local;
        }
        // Fallback to localStorage
        else {
            console.log('Using localStorage (fallback)');
            return {
                get: this.localStorageGet.bind(this),
                set: this.localStorageSet.bind(this),
                remove: this.localStorageRemove.bind(this),
                clear: this.localStorageClear.bind(this)
            };
        }
    }
    
    localStorageGet(keys, callback) {
        let result = {};
        if (typeof keys === 'string') {
            keys = [keys];
        }
        
        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                result[key] = value ? JSON.parse(value) : undefined;
            } catch (e) {
                result[key] = undefined;
            }
        });
        
        if (callback) callback(result);
        return Promise.resolve(result);
    }
    
    localStorageSet(items, callback) {
        Object.entries(items).forEach(([key, value]) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('localStorage set error:', e);
            }
        });
        
        if (callback) callback();
        return Promise.resolve();
    }
    
    localStorageRemove(keys, callback) {
        if (typeof keys === 'string') {
            keys = [keys];
        }
        
        keys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        if (callback) callback();
        return Promise.resolve();
    }
    
    localStorageClear(callback) {
        localStorage.clear();
        if (callback) callback();
        return Promise.resolve();
    }
    
    async init() {
        // Initialize default data structure
        const defaults = {
            [this.STORAGE_KEYS.FILES]: {},
            [this.STORAGE_KEYS.SETTINGS]: {
                theme: 'light',
                language: 'en',
                maxFileSize: this.MAX_FILE_SIZE,
                autoSave: true,
                compressionLevel: 'medium'
            },
            [this.STORAGE_KEYS.HISTORY]: [],
            [this.STORAGE_KEYS.STATS]: {
                totalFiles: 0,
                totalSize: 0,
                pdfCount: 0,
                imageCount: 0,
                lastUpdated: Date.now()
            }
        };
        
        // Set defaults for any missing keys
        for (const [key, value] of Object.entries(defaults)) {
            const current = await this.get(key);
            if (current === undefined || current === null) {
                await this.set(key, value);
            }
        }
        
        console.log('Storage Manager initialized');
    }
    
    // Core Storage Methods
    async get(key) {
        try {
            const result = await this.storage.get(key);
            return result[key];
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }
    
    async set(key, value) {
        try {
            await this.storage.set({ [key]: value });
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    
    async remove(key) {
        try {
            await this.storage.remove(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    
    async clear() {
        try {
            await this.storage.clear();
            // Reinitialize defaults
            await this.init();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
    
    // File Management Methods
    async saveFile(file, category = 'other') {
        return new Promise((resolve, reject) => {
            // Check file size
            if (file.size > this.MAX_FILE_SIZE) {
                reject(new Error(`File too large (max ${this.formatSize(this.MAX_FILE_SIZE)})`));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const fileData = {
                        id: this.generateFileId(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result,
                        category: category,
                        timestamp: Date.now(),
                        lastAccessed: Date.now()
                    };
                    
                    // Get current files
                    const files = await this.getFiles();
                    files[fileData.id] = fileData;
                    
                    // Save to storage
                    await this.set(this.STORAGE_KEYS.FILES, files);
                    
                    // Update statistics
                    await this.updateStats({
                        fileSize: file.size,
                        fileType: file.type
                    });
                    
                    // Add to history
                    await this.addToHistory('file_upload', {
                        fileName: file.name,
                        fileSize: file.size,
                        fileId: fileData.id
                    });
                    
                    resolve(fileData.id);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (e) => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    async getFiles() {
        const files = await this.get(this.STORAGE_KEYS.FILES);
        return files || {};
    }
    
    async getFile(fileId) {
        const files = await this.getFiles();
        return files[fileId] || null;
    }
    
    async deleteFile(fileId) {
        const files = await this.getFiles();
        const file = files[fileId];
        
        if (file) {
            delete files[fileId];
            await this.set(this.STORAGE_KEYS.FILES, files);
            
            // Update stats
            await this.updateStats({
                fileSize: -file.size,
                fileType: file.type,
                remove: true
            });
            
            return true;
        }
        
        return false;
    }
    
    async updateFileMetadata(fileId, metadata) {
        const files = await this.getFiles();
        const file = files[fileId];
        
        if (file) {
            files[fileId] = { ...file, ...metadata, lastAccessed: Date.now() };
            await this.set(this.STORAGE_KEYS.FILES, files);
            return true;
        }
        
        return false;
    }
    
    async getFilesByType(type) {
        const files = await this.getFiles();
        return Object.values(files).filter(file => file.type.includes(type));
    }
    
    async getRecentFiles(limit = 10) {
        const files = await this.getFiles();
        return Object.values(files)
            .sort((a, b) => b.lastAccessed - a.lastAccessed)
            .slice(0, limit);
    }
    
    // Statistics Methods
    async getStats() {
        return await this.get(this.STORAGE_KEYS.STATS);
    }
    
    async updateStats({ fileSize, fileType, remove = false }) {
        const stats = await this.getStats();
        
        if (remove) {
            stats.totalFiles--;
            stats.totalSize = Math.max(0, stats.totalSize - Math.abs(fileSize));
            
            if (fileType.includes('pdf')) {
                stats.pdfCount = Math.max(0, stats.pdfCount - 1);
            } else if (fileType.includes('image')) {
                stats.imageCount = Math.max(0, stats.imageCount - 1);
            }
        } else {
            stats.totalFiles++;
            stats.totalSize += fileSize;
            
            if (fileType.includes('pdf')) {
                stats.pdfCount++;
            } else if (fileType.includes('image')) {
                stats.imageCount++;
            }
        }
        
        stats.lastUpdated = Date.now();
        await this.set(this.STORAGE_KEYS.STATS, stats);
        
        return stats;
    }
    
    async getStorageUsage() {
        const stats = await this.getStats();
        const maxQuota = this.getMaxQuota();
        
        return {
            used: stats.totalSize,
            total: maxQuota,
            percent: (stats.totalSize / maxQuota) * 100
        };
    }
    
    getMaxQuota() {
        if (this.storage === chrome.storage.local) {
            return this.QUOTA.CHROME;
        } else {
            return this.QUOTA.LOCAL;
        }
    }
    
    // History Methods
    async addToHistory(action, data) {
        const history = await this.get(this.STORAGE_KEYS.HISTORY) || [];
        history.unshift({
            action,
            data,
            timestamp: Date.now()
        });
        
        // Keep only last 100 entries
        if (history.length > 100) {
            history.pop();
        }
        
        await this.set(this.STORAGE_KEYS.HISTORY, history);
    }
    
    async getHistory(limit = 20) {
        const history = await this.get(this.STORAGE_KEYS.HISTORY) || [];
        return history.slice(0, limit);
    }
    
    // Settings Methods
    async getSettings() {
        return await this.get(this.STORAGE_KEYS.SETTINGS);
    }
    
    async updateSettings(newSettings) {
        const current = await this.getSettings();
        const updated = { ...current, ...newSettings };
        await this.set(this.STORAGE_KEYS.SETTINGS, updated);
        return updated;
    }
    
    // Import/Export Methods
    async exportData() {
        const data = {
            files: await this.getFiles(),
            settings: await this.getSettings(),
            history: await this.getHistory(),
            stats: await this.getStats(),
            version: '2.0',
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `nepaltools-backup-${Date.now()}.json`;
        a.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate backup format
                    if (!data.version || !data.files) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Calculate total size
                    const totalSize = Object.values(data.files).reduce((sum, file) => sum + file.size, 0);
                    const usage = await this.getStorageUsage();
                    
                    if (usage.used + totalSize > usage.total * 0.9) {
                        throw new Error('Import would exceed storage limit');
                    }
                    
                    // Import data
                    if (data.files) {
                        const currentFiles = await this.getFiles();
                        const mergedFiles = { ...currentFiles, ...data.files };
                        await this.set(this.STORAGE_KEYS.FILES, mergedFiles);
                    }
                    
                    if (data.settings) {
                        await this.updateSettings(data.settings);
                    }
                    
                    // Update stats based on imported files
                    const stats = await this.getStats();
                    const importedFiles = Object.values(data.files);
                    
                    stats.totalFiles += importedFiles.length;
                    stats.totalSize += importedFiles.reduce((sum, file) => sum + file.size, 0);
                    stats.pdfCount += importedFiles.filter(f => f.type.includes('pdf')).length;
                    stats.imageCount += importedFiles.filter(f => f.type.includes('image')).length;
                    
                    await this.set(this.STORAGE_KEYS.STATS, stats);
                    
                    resolve(true);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (e) => {
                reject(new Error('Failed to read backup file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    // Utility Methods
    generateFileId() {
        return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
    
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to convert blob'));
            reader.readAsDataURL(blob);
        });
    }
}

// Create global storage instance
window.Storage = new StorageManager();
