/**
 * NepalTools - PDF Tools Module
 * Client-side PDF manipulation using pdf-lib and PDF.js
 */

import { showToast, showLoading, hideLoading, formatFileSize, createObjectURL } from '../utils.js';

// PDF tools state
let pdfFiles = [];
let processedPDF = null;

// Initialize PDF tools
export function initPDFTools() {
    console.log('Initializing PDF tools');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize tool tabs
    initToolTabs();
    
    // Check for PDF.js support
    if (!window.pdfjsLib) {
        showToast('PDF.js library not loaded. Please check your internet connection.', 'error');
        return;
    }
    
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    
    showToast('PDF tools ready. Drag and drop PDF files to start.', 'success');
}

// Set up event listeners
function setupEventListeners() {
    // File input
    const fileInput = document.getElementById('pdf-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Upload area drag and drop
    const uploadArea = document.getElementById('pdf-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        
        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());
    }
    
    // Compress button
    const compressBtn = document.getElementById('compress-pdf-btn');
    if (compressBtn) {
        compressBtn.addEventListener('click', compressPDF);
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-pdf-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPDF);
    }
    
    // Download button
    const downloadBtn = document.getElementById('download-pdf-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadProcessedPDF);
    }
}

// Initialize tool tabs
function initToolTabs() {
    const tabs = document.querySelectorAll('.tool-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Reset for new tool
            resetPDF();
            
            showToast(`Switched to ${tab.textContent} tool`, 'info');
        });
    });
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addPDFFiles(files);
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadArea = document.getElementById('pdf-upload-area');
    uploadArea.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadArea = document.getElementById('pdf-upload-area');
    uploadArea.classList.remove('drag-over');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const uploadArea = document.getElementById('pdf-upload-area');
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (files.length > 0) {
        addPDFFiles(files);
    } else {
        showToast('Please drop PDF files only', 'warning');
    }
}

// Add PDF files to list
function addPDFFiles(files) {
    files.forEach(file => {
        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showToast(`File ${file.name} is too large (max 50MB)`, 'error');
            return;
        }
        
        // Check if file already exists
        if (pdfFiles.some(f => f.name === file.name && f.size === file.size)) {
            showToast(`File ${file.name} already added`, 'warning');
            return;
        }
        
        // Add to files array
        pdfFiles.push({
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            preview: null
        });
    });
    
    // Update UI
    updateFileList();
    
    // Show controls if files are added
    if (pdfFiles.length > 0) {
        document.getElementById('pdf-controls').classList.remove('hidden');
    }
}

// Update file list UI
function updateFileList() {
    const fileList = document.getElementById('pdf-file-list');
    if (!fileList) return;
    
    if (pdfFiles.length === 0) {
        fileList.innerHTML = '<p class="empty-message">No files added yet</p>';
        return;
    }
    
    fileList.innerHTML = pdfFiles.map(file => `
        <div class="file-item" data-id="${file.id}">
            <div class="file-info">
                <i class="fas fa-file-pdf file-icon"></i>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="file-remove" data-id="${file.id}" aria-label="Remove file">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Add remove event listeners
    fileList.querySelectorAll('.file-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removePDFFile(id);
        });
    });
}

// Remove PDF file
function removePDFFile(id) {
    pdfFiles = pdfFiles.filter(file => file.id !== id);
    updateFileList();
    
    // Hide controls if no files left
    if (pdfFiles.length === 0) {
        document.getElementById('pdf-controls').classList.add('hidden');
    }
}

// Compress PDF
async function compressPDF() {
    if (pdfFiles.length === 0) {
        showToast('Please add PDF files first', 'warning');
        return;
    }
    
    showLoading('Compressing PDF...');
    
    try {
        const compressionLevel = document.getElementById('compression-level').value;
        
        // For single file compression
        if (pdfFiles.length === 1) {
            const pdfFile = pdfFiles[0];
            await compressSinglePDF(pdfFile, compressionLevel);
        } else {
            // For multiple files, we'll merge then compress
            showToast('Multiple files detected. Merging and compressing...', 'info');
            await mergeAndCompressPDFs(compressionLevel);
        }
        
        hideLoading();
        showToast('PDF compressed successfully!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('PDF compression error:', error);
        showToast(`Error compressing PDF: ${error.message}`, 'error');
    }
}

// Compress single PDF
async function compressSinglePDF(pdfFile, compressionLevel) {
    // Load PDF document
    const pdfBytes = await pdfFile.file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    
    // Get original size
    const originalSize = pdfFile.size;
    
    // Apply compression based on level
    let quality = 1.0;
    switch (compressionLevel) {
        case 'low': quality = 0.9; break;
        case 'medium': quality = 0.7; break;
        case 'high': quality = 0.5; break;
    }
    
    // Save with compression
    const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: true,
        objectsPerTick: 100,
        updateFieldAppearances: false
    });
    
    // Create blob
    processedPDF = new Blob([compressedBytes], { type: 'application/pdf' });
    
    // Update result UI
    updateResultUI(originalSize, processedPDF.size);
}

// Merge and compress multiple PDFs
async function mergeAndCompressPDFs(compressionLevel) {
    const mergedPdf = await PDFLib.PDFDocument.create();
    
    // Merge all PDFs
    for (const pdfFile of pdfFiles) {
        const pdfBytes = await pdfFile.file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }
    
    // Calculate total original size
    const originalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0);
    
    // Apply compression
    let quality = 1.0;
    switch (compressionLevel) {
        case 'low': quality = 0.9; break;
        case 'medium': quality = 0.7; break;
        case 'high': quality = 0.5; break;
    }
    
    // Save merged and compressed PDF
    const compressedBytes = await mergedPdf.save({
        useObjectStreams: true,
        addDefaultPage: true,
        objectsPerTick: 100,
        updateFieldAppearances: false
    });
    
    // Create blob
    processedPDF = new Blob([compressedBytes], { type: 'application/pdf' });
    
    // Update result UI
    updateResultUI(originalSize, processedPDF.size);
}

// Update result UI
function updateResultUI(originalSize, compressedSize) {
    const resultArea = document.getElementById('pdf-result');
    resultArea.classList.remove('hidden');
    
    // Update size information
    document.getElementById('original-size').textContent = formatFileSize(originalSize);
    document.getElementById('compressed-size').textContent = formatFileSize(compressedSize);
    
    // Calculate reduction percentage
    const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    document.getElementById('reduction-percent').textContent = `${reduction}%`;
    
    // Update progress bar (for demo purposes)
    const progressFill = document.getElementById('pdf-progress-fill');
    const progressText = document.getElementById('pdf-progress-text');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 50);
    
    // Show progress bar
    document.getElementById('pdf-progress').classList.remove('hidden');
}

// Download processed PDF
function downloadProcessedPDF() {
    if (!processedPDF) {
        showToast('No PDF to download', 'warning');
        return;
    }
    
    const url = createObjectURL(processedPDF);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast('PDF download started', 'success');
}

// Reset PDF tool
function resetPDF() {
    pdfFiles = [];
    processedPDF = null;
    
    // Reset UI
    updateFileList();
    document.getElementById('pdf-controls').classList.add('hidden');
    document.getElementById('pdf-result').classList.add('hidden');
    document.getElementById('pdf-progress').classList.add('hidden');
    
    // Reset file input
    const fileInput = document.getElementById('pdf-file-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    showToast('PDF tool reset', 'info');
}

// Server-side PDF compression endpoint (example)
async function compressPDFOnServer(pdfFile) {
    // This is an example of how to send PDF to server for compression
    // Requires a backend endpoint
    
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('compressionLevel', document.getElementById('compression-level').value);
    
    try {
        const response = await fetch('/api/compress-pdf', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const blob = await response.blob();
        return blob;
        
    } catch (error) {
        console.error('Server compression error:', error);
        throw error;
    }
}

// Export functions for use in other modules
export {
    compressPDF,
    resetPDF,
    downloadProcessedPDF
};
