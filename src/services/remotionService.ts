import { LyricEntry } from '../types';

const SERVER_URL = 'http://localhost:3003';

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

  async renderVideo(
    audioFile: File,
    lyrics: LyricEntry[],
    durationInSeconds: number,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string> {
    try {
      // Upload audio file
      const formData = new FormData();
      formData.append('audio', audioFile);

      const uploadResponse = await fetch(`${SERVER_URL}/upload/audio`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file');
      }

      const { filename } = await uploadResponse.json();

      // Use the actual audio duration instead of calculating from lyrics
      onProgress?.({
        progress: 0,
        durationInFrames: Math.round(durationInSeconds * this.fps),
        renderedFrames: 0,
        status: 'rendering'
      });

      // Request video rendering
      const renderResponse = await fetch(`${SERVER_URL}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioFile: filename,
          lyrics,
          durationInSeconds,
        }),
      });

      if (!renderResponse.ok) {
        const error = await renderResponse.json();
        throw new Error(error.details || 'Failed to render video');
      }

      const { videoUrl } = await renderResponse.json();

      onProgress?.({
        progress: 1,
        durationInFrames: Math.round(durationInSeconds * this.fps),
        renderedFrames: Math.round(durationInSeconds * this.fps),
        status: 'success'
      });

      return videoUrl;
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

  cleanup() {
    // Any cleanup needed
  }
}

export default new RemotionService();
