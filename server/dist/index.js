"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bundler_1 = require("@remotion/bundler");
const renderer_1 = require("@remotion/renderer");
// Set Remotion environment variables for GPU acceleration
process.env.REMOTION_CHROME_MODE = "chrome-for-testing";
process.env.REMOTION_GL = "vulkan";
const app = (0, express_1.default)();
const port = process.env.PORT || 3003;
// Ensure directories exist
const uploadsDir = path_1.default.join(__dirname, '../uploads');
const outputDir = path_1.default.join(__dirname, '../output');
[uploadsDir, outputDir].forEach((dir) => {
    if (!require('fs').existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
    }
});
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(uploadsDir));
app.use('/output', express_1.default.static(outputDir));
// Upload endpoint for audio and images
app.post('/upload/:type', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `http://localhost:${port}/uploads/${req.file.filename}`;
    res.json({
        url,
        filename: req.file.filename
    });
});
// Clear cache endpoint
app.post('/api/clear-cache', (req, res) => {
    try {
        const uploadsDir = path_1.default.join(__dirname, '..', 'uploads');
        const files = fs_1.default.readdirSync(uploadsDir);
        files.forEach(file => {
            const filePath = path_1.default.join(uploadsDir, file);
            fs_1.default.unlinkSync(filePath);
        });
        res.status(200).json({ message: 'Cache cleared successfully' });
    }
    catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});
// Helper function to verify assets on the server side
function verifyServerAssets(videoType, audioUrl, instrumentalUrl, vocalUrl, littleVocalUrl, backgroundImagesMap = {}, backgroundImageUrl) {
    console.log(`\n=== SERVER-SIDE VERIFICATION for ${videoType} render ===`);
    // Verify audio files based on video type
    let audioToUse;
    switch (videoType) {
        case 'Vocal Only':
            audioToUse = vocalUrl || audioUrl;
            console.log(vocalUrl
                ? `✓ SERVER using vocal track for Vocal Only: ${vocalUrl}`
                : `⚠️ SERVER WARNING: Using main audio as fallback for Vocal Only: ${audioUrl}`);
            break;
        case 'Instrumental Only':
            audioToUse = instrumentalUrl || audioUrl;
            console.log(instrumentalUrl
                ? `✓ SERVER using instrumental track for Instrumental Only: ${instrumentalUrl}`
                : `⚠️ SERVER WARNING: Using main audio as fallback for Instrumental Only: ${audioUrl}`);
            break;
        case 'Little Vocal':
            if (littleVocalUrl) {
                audioToUse = littleVocalUrl;
                console.log(`✓ SERVER using pre-mixed little vocal track: ${littleVocalUrl}`);
            }
            else if (instrumentalUrl && vocalUrl) {
                console.log(`✓ SERVER using instrumental and vocal tracks for Little Vocal mix:`);
                console.log(`  - Instrumental: ${instrumentalUrl}`);
                console.log(`  - Vocal: ${vocalUrl}`);
            }
            else {
                audioToUse = audioUrl;
                console.log(`⚠️ SERVER WARNING: Using main audio as fallback for Little Vocal: ${audioUrl}`);
            }
            break;
        default: // Lyrics Video
            audioToUse = audioUrl;
            console.log(`✓ SERVER using main audio track for Lyrics Video: ${audioUrl}`);
            break;
    }
    // Verify background image
    const backgroundForType = backgroundImagesMap[videoType];
    if (backgroundForType) {
        console.log(`✓ SERVER using specific background for ${videoType}: ${backgroundForType}`);
    }
    else if (backgroundImageUrl) {
        console.log(`✓ SERVER using default background: ${backgroundImageUrl}`);
    }
    else {
        console.log(`ℹ️ SERVER: No background image for ${videoType}. Using solid color.`);
    }
    console.log('=== SERVER VERIFICATION COMPLETE ===\n');
    // Return the verified audio to use (for future implementation)
    return audioToUse;
}
// Render video endpoint
app.post('/render', async (req, res) => {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    try {
        const { compositionId = 'lyrics-video', // Get compositionId from request, fallback to default
        audioFile, lyrics, durationInSeconds, albumArtUrl, backgroundImageUrl, backgroundImagesMap = {}, // Add support for background images map
        metadata = {
            artist: 'Unknown Artist',
            songTitle: 'Unknown Song',
            videoType: 'Lyrics Video'
        }, instrumentalUrl, vocalUrl, littleVocalUrl } = req.body;
        if (!audioFile || !lyrics || !durationInSeconds) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const fps = 60;
        const durationInFrames = Math.max(60, Math.ceil(durationInSeconds * fps));
        const outputFile = `lyrics-video-${Date.now()}.mp4`;
        const outputPath = path_1.default.join(outputDir, outputFile);
        // Create URLs that can be accessed via HTTP instead of file:// protocol
        const audioUrl = `http://localhost:${port}/uploads/${audioFile}`;
        // Perform server-side verification before rendering
        verifyServerAssets(metadata.videoType, audioUrl, instrumentalUrl, vocalUrl, littleVocalUrl, backgroundImagesMap, backgroundImageUrl);
        // Add a small delay after verification to ensure resources are ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Use index.ts as the entry point which contains registerRoot()
        const entryPoint = path_1.default.join(__dirname, '../../src/remotion/index.ts');
        // Bundle the remotion project
        console.log('Bundling Remotion project...');
        const bundleResult = await (0, bundler_1.bundle)(entryPoint);
        console.log('Bundle completed');
        console.log('Using composition ID:', compositionId);
        if (!bundleResult) {
            throw new Error('Bundling failed: No result returned from bundler');
        }
        // Select the composition
        console.log('Selecting composition...');
        console.log('Using serve URL:', bundleResult);
        console.log('Video duration:', `${durationInSeconds} seconds (${durationInFrames} frames at ${fps}fps)`);
        // Get available compositions (for debugging)
        const compositions = await (0, renderer_1.getCompositions)(bundleResult, {
            inputProps: {
                audioUrl: audioUrl,
                lyrics,
                durationInSeconds,
                albumArtUrl,
                backgroundImageUrl,
                backgroundImagesMap, // Include backgroundImagesMap here
                metadata,
                instrumentalUrl,
                vocalUrl,
                littleVocalUrl
            }
        });
        console.log('Available compositions:', compositions.map(c => c.id));
        const composition = await (0, renderer_1.selectComposition)({
            serveUrl: bundleResult,
            id: compositionId,
            inputProps: {
                audioUrl: audioUrl,
                lyrics,
                durationInSeconds,
                albumArtUrl,
                backgroundImageUrl,
                backgroundImagesMap, // Include backgroundImagesMap here
                metadata,
                instrumentalUrl,
                vocalUrl,
                littleVocalUrl
            },
        });
        // Force the composition duration to match our calculated duration
        composition.durationInFrames = durationInFrames;
        // Render the video with GPU acceleration
        console.log('Starting rendering process with Vulkan GPU acceleration...');
        console.log('Using composition duration:', composition.durationInFrames, 'frames');
        await (0, renderer_1.renderMedia)({
            composition,
            serveUrl: bundleResult,
            codec: 'h264',
            outputLocation: outputPath,
            inputProps: {
                audioUrl: audioUrl,
                lyrics,
                durationInSeconds,
                albumArtUrl,
                backgroundImageUrl,
                backgroundImagesMap, // Include backgroundImagesMap here
                metadata,
                instrumentalUrl,
                vocalUrl,
                littleVocalUrl
            },
            chromiumOptions: {
                disableWebSecurity: true,
                ignoreCertificateErrors: true,
                gl: "vulkan"
            },
            logLevel: 'verbose',
            onProgress: ({ renderedFrames, encodedFrames }) => {
                console.log(`Progress: ${renderedFrames}/${durationInFrames} frames`);
                const progress = renderedFrames / durationInFrames;
                if (res.writableEnded)
                    return;
                res.write(`data: ${JSON.stringify({ progress, renderedFrames, durationInFrames })}\n\n`);
            }
        });
        const videoUrl = `http://localhost:${port}/output/${outputFile}`;
        res.write(`data: ${JSON.stringify({ status: 'complete', videoUrl })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('Rendering error:', error);
        res.write(`data: ${JSON.stringify({
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        })}\n\n`);
        res.end();
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('GPU settings:');
    console.log('REMOTION_CHROME_MODE:', process.env.REMOTION_CHROME_MODE);
    console.log('REMOTION_GL:', process.env.REMOTION_GL);
});
