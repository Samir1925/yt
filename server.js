const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

        const data = {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails.pop().url,
            duration: info.videoDetails.lengthSeconds,
            formats: formats.map(format => ({
                itag: format.itag,
                quality: format.qualityLabel || 'Audio',
                type: format.hasVideo ? `${format.container} (Video)` : `${format.container} (Audio)`,
                size: format.contentLength ? `${Math.round(format.contentLength / (1024 * 1024))} MB` : 'Unknown'
            }))
        };

        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

app.get('/api/download', async (req, res) => {
    try {
        const { url, itag } = req.query;
        
        if (!ytdl.validateURL(url)) {
            return res.status(400).send('Invalid YouTube URL');
        }

        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

        res.header('Content-Disposition', `attachment; filename="${title}.${format.container}"`);
        ytdl(url, { quality: itag }).pipe(res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Download failed');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
