import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

interface BundleResult {
  url: string;
  [key: string]: any;
}

const app = express();
const port = process.env.PORT || 3003;

// Ensure directories exist at the project root
const uploadsDir = path.join(__dirname, '../../uploads');
const outputDir = path.join(__dirname, '../../output');
[uploadsDir, outputDir].forEach((dir) => {
  if (!require('fs').existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/output', express.static(outputDir));

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
    const outputPath = path.join(__dirname, '..', 'output', outputFile);
    const entryPoint = path.join(__dirname, '../../src/remotion/root.tsx');

    // Bundle the remotion project
    console.log('Bundling Remotion project...');
    const bundled = await bundle(entryPoint) as unknown as BundleResult;

    // Select the composition
    console.log('Selecting composition...');
    const composition = await selectComposition({
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
    await renderMedia({
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
  } catch (error) {
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