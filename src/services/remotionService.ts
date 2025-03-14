import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { LyricEntry } from '../components/LyricsVideo';

// We'll use a string for the entry point since we can't use Node.js path module in browser
const entry = 'src/remotion/root.tsx';

export interface RenderProgress {
  progress: number;
  durationInFrames: number;
  renderedFrames: number;
  status: 'rendering' | 'success' | 'error';
  error?: string;
}

export class RemotionService {
  private compositionId = 'lyrics-video';
  private fps = 30;
  private outputDir = 'output';
  private width = 1280;
  private height = 720;

  constructor() {
    // No need for directory creation in the browser context
    // This would be handled by the server in a real implementation
  }

  /**
   * Render a lyrics video with Remotion
   */
  async renderVideo(
    audioUrl: string,
    lyrics: LyricEntry[],
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string> {
    try {
      // Calculate video duration based on the last lyric end time + 2 seconds
      const lastLyricEnd = Math.max(...lyrics.map(l => l.end));
      const durationInSeconds = lastLyricEnd + 2; // 2 seconds buffer at the end
      const durationInFrames = Math.round(durationInSeconds * this.fps);

      // Start with 0% progress
      onProgress?.({
        progress: 0,
        durationInFrames,
        renderedFrames: 0,
        status: 'rendering'
      });

      // Bundle the remotion project
      console.log('Bundling Remotion project...');
      const bundled = await bundle(entry);

      // Select the composition to render
      console.log('Selecting composition...');
      const composition = await selectComposition({
        serveUrl: bundled.url,
        id: this.compositionId,
        inputProps: {
          audioUrl,
          lyrics,
          durationInSeconds
        },
      });

      // Update the duration based on composition
      const actualDurationInFrames = composition.durationInFrames;

      // Generate a unique file name based on timestamp
      const outputFile = `lyrics-video-${Date.now()}.mp4`;
      const outputPath = `${this.outputDir}/${outputFile}`;

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
        onProgress: ({ renderedFrames }) => {
          const progress = renderedFrames / actualDurationInFrames;
          onProgress?.({
            progress,
            durationInFrames: actualDurationInFrames,
            renderedFrames,
            status: 'rendering'
          });
        },
      });

      console.log('Rendering completed!');
      onProgress?.({
        progress: 1,
        durationInFrames: actualDurationInFrames,
        renderedFrames: actualDurationInFrames,
        status: 'success'
      });

      return outputPath;
    } catch (error) {
      console.error('Error rendering video:', error);
      onProgress?.({
        progress: 0,
        durationInFrames: 0,
        renderedFrames: 0,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Clean up resources after rendering
   */
  cleanup() {
    // Any cleanup needed
  }
}

export default new RemotionService();