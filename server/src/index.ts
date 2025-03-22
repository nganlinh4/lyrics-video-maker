import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, getCompositions } from '@remotion/renderer';

// Set Remotion environment variables for GPU acceleration
process.env.REMOTION_CHROME_MODE = "chrome-for-testing";
process.env.REMOTION_GL = "vulkan";

const app = express();
const port = process.env.PORT || 3003;

// Ensure directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../output');
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

// Helper function to verify assets on the server side
function verifyServerAssets(
  videoType: string,
  audioUrl: string,
  instrumentalUrl?: string,
  vocalUrl?: string,
  littleVocalUrl?: string,
  backgroundImagesMap: any = {},
  backgroundImageUrl?: string
) {
  console.log(`\n=== SERVER-SIDE VERIFICATION for ${videoType} render ===`);
  
  // Verify audio files based on video type
  let audioToUse: string | undefined;
  
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
      } else if (instrumentalUrl && vocalUrl) {
        console.log(`✓ SERVER using instrumental and vocal tracks for Little Vocal mix:`);
        console.log(`  - Instrumental: ${instrumentalUrl}`);
        console.log(`  - Vocal: ${vocalUrl}`);
      } else {
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
  } else if (backgroundImageUrl) {
    console.log(`✓ SERVER using default background: ${backgroundImageUrl}`);
  } else {
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
    const { 
      compositionId = 'lyrics-video', // Get compositionId from request, fallback to default
      audioFile, 
      lyrics, 
      durationInSeconds, 
      albumArtUrl, 
      backgroundImageUrl, 
      backgroundImagesMap = {}, // Add support for background images map
      metadata = {
        artist: 'Unknown Artist',
        songTitle: 'Unknown Song',
        videoType: 'Lyrics Video'
      },
      instrumentalUrl,
      vocalUrl,
      littleVocalUrl
    } = req.body;
    
    if (!audioFile || !lyrics || !durationInSeconds) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const fps = 60;
    const durationInFrames = Math.max(60, Math.ceil(durationInSeconds * fps));
    
    const outputFile = `lyrics-video-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFile);
    
    // Create URLs that can be accessed via HTTP instead of file:// protocol
    const audioUrl = `http://localhost:${port}/uploads/${audioFile}`;
    
    // Perform server-side verification before rendering
    verifyServerAssets(
      metadata.videoType, 
      audioUrl, 
      instrumentalUrl, 
      vocalUrl, 
      littleVocalUrl, 
      backgroundImagesMap, 
      backgroundImageUrl
    );
    
    // Add a small delay after verification to ensure resources are ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use index.ts as the entry point which contains registerRoot()
    const entryPoint = path.join(__dirname, '../../src/remotion/index.ts');

    // Bundle the remotion project
    console.log('Bundling Remotion project...');
    const bundleResult = await bundle(entryPoint);
    
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
    const compositions = await getCompositions(bundleResult, {
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
    
    const composition = await selectComposition({
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
    
    await renderMedia({
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
        if (res.writableEnded) return;
        res.write(`data: ${JSON.stringify({ progress, renderedFrames, durationInFrames })}\n\n`);
      }
    });

    const videoUrl = `http://localhost:${port}/output/${outputFile}`;
    res.write(`data: ${JSON.stringify({ status: 'complete', videoUrl })}\n\n`);
    res.end();
  } catch (error) {
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
