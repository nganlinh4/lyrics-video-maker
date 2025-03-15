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
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
app.use('/output', express_1.default.static('output'));
// Ensure directories exist
['uploads', 'output'].forEach((dir) => {
    const dirPath = path_1.default.join(__dirname, '..', dir);
    if (!require('fs').existsSync(dirPath)) {
        require('fs').mkdirSync(dirPath, { recursive: true });
    }
});
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
        const { audioUrl, lyrics, durationInSeconds } = req.body;
        if (!audioUrl || !lyrics || !durationInSeconds) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const compositionId = 'lyrics-video';
        const fps = 30;
        const outputFile = `lyrics-video-${Date.now()}.mp4`;
        const outputPath = path_1.default.join(__dirname, '..', 'output', outputFile);
        const entryPoint = path_1.default.join(__dirname, '../../src/remotion/root.tsx');
        // Bundle the remotion project
        console.log('Bundling Remotion project...');
        const bundled = await (0, bundler_1.bundle)(entryPoint);
        // Select the composition
        console.log('Selecting composition...');
        const composition = await (0, renderer_1.selectComposition)({
            serveUrl: bundled.url,
            id: compositionId,
            inputProps: {
                audioUrl,
                lyrics,
                durationInSeconds
            },
        });
        // Render the video
        console.log('Starting rendering process...');
        await (0, renderer_1.renderMedia)({
            composition,
            serveUrl: bundled.url,
            codec: 'h264',
            outputLocation: outputPath,
            inputProps: {
                audioUrl,
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
