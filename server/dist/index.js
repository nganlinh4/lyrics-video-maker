"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const bundler_1 = require("@remotion/bundler");
const renderer_1 = require("@remotion/renderer");
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
// Upload endpoint for audio file
app.post('/upload/audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
    }
    res.json({
        url: `http://localhost:${port}/uploads/${req.file.filename}`,
        filename: req.file.filename
    });
});
// Render video endpoint
app.post('/render', async (req, res) => {
    try {
        const { audioFile, lyrics, durationInSeconds } = req.body;
        if (!audioFile || !lyrics || !durationInSeconds) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const compositionId = 'lyrics-video';
        const fps = 30;
        // Calculate the exact number of frames based on the lyrics duration
        const durationInFrames = Math.max(30, Math.ceil(durationInSeconds * fps));
        const outputFile = `lyrics-video-${Date.now()}.mp4`;
        const outputPath = path_1.default.join(outputDir, outputFile);
        // Create a URL that can be accessed via HTTP instead of file:// protocol
        const audioUrl = `http://localhost:${port}/uploads/${audioFile}`;
        // Use index.ts as the entry point which contains registerRoot()
        const entryPoint = path_1.default.join(__dirname, '../../src/remotion/index.ts');
        // Bundle the remotion project
        console.log('Bundling Remotion project...');
        const bundleResult = await (0, bundler_1.bundle)(entryPoint);
        console.log('Bundle completed');
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
                durationInSeconds
            }
        });
        console.log('Available compositions:', compositions.map(c => c.id));
        const composition = await (0, renderer_1.selectComposition)({
            serveUrl: bundleResult,
            id: compositionId,
            inputProps: {
                audioUrl: audioUrl,
                lyrics,
                durationInSeconds
            },
        });
        // Force the composition duration to match our calculated duration
        composition.durationInFrames = durationInFrames;
        // Render the video
        console.log('Starting rendering process...');
        console.log('Using composition duration:', composition.durationInFrames, 'frames');
        await (0, renderer_1.renderMedia)({
            composition,
            serveUrl: bundleResult,
            codec: 'h264',
            outputLocation: outputPath,
            inputProps: {
                audioUrl: audioUrl,
                lyrics,
                durationInSeconds
            },
        });
        const videoUrl = `http://localhost:${port}/output/${outputFile}`;
        res.json({ videoUrl });
    }
    catch (error) {
        console.error('Rendering error:', error);
        res.status(500).json({
            error: 'Error rendering video',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
