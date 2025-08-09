document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const fetchBtn = document.getElementById('fetch-btn');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const videoInfoElement = document.getElementById('video-info');
    const thumbnailElement = document.getElementById('thumbnail');
    const videoTitleElement = document.getElementById('video-title');
    const videoDurationElement = document.getElementById('video-duration');
    const formatsListElement = document.getElementById('formats-list');

    fetchBtn.addEventListener('click', fetchVideoInfo);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchVideoInfo();
    });

    async function fetchVideoInfo() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a YouTube URL');
            return;
        }

        // Basic URL validation
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            showError('Please enter a valid YouTube URL');
            return;
        }

        // Show loading state
        loadingElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
        videoInfoElement.classList.add('hidden');

        try {
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch video info');
            }

            const data = await response.json();
            displayVideoInfo(data);
        } catch (error) {
            showError(error.message);
        } finally {
            loadingElement.classList.add('hidden');
        }
    }

    function displayVideoInfo(data) {
        thumbnailElement.src = data.thumbnail;
        videoTitleElement.textContent = data.title;
        
        // Convert duration from seconds to MM:SS format
        const minutes = Math.floor(data.duration / 60);
        const seconds = data.duration % 60;
        videoDurationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Clear previous formats
        formatsListElement.innerHTML = '';
        
        // Add each format to the list
        data.formats.forEach(format => {
            const formatItem = document.createElement('div');
            formatItem.className = 'format-item';
            
            formatItem.innerHTML = `
                <div class="format-info">
                    <div class="format-quality">${format.quality}</div>
                    <div class="format-type">${format.type}</div>
                </div>
                <div class="format-size">${format.size}</div>
                <button class="download-btn" data-itag="${format.itag}">Download</button>
            `;
            
            formatsListElement.appendChild(formatItem);
            
            // Add click event to download button
            const downloadBtn = formatItem.querySelector('.download-btn');
            downloadBtn.addEventListener('click', () => downloadVideo(format.itag));
        });
        
        videoInfoElement.classList.remove('hidden');
    }

    function downloadVideo(itag) {
        const url = urlInput.value.trim();
        window.open(`/api/download?url=${encodeURIComponent(url)}&itag=${itag}`, '_blank');
    }

    function showError(message) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
});
