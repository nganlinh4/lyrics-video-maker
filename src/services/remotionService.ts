import { LyricEntry } from '../types';

const SERVER_URL = 'http://localhost:3003';

export interface RenderProgress {
  progress: number;
  durationInFrames: number;
  renderedFrames: number;
  status: 'rendering' | 'success' | 'error';
  error?: string;
}

export interface RenderOptions {
  albumArtUrl?: string;
  backgroundImageUrl?: string;
}


export class RemotionService {
  private compositionId = 'lyrics-video';
  private fps = 30;

  private async uploadFile(file: File, endpoint: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${SERVER_URL}/upload/${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${endpoint}`);
    }

    const { url } = await response.json();
    return url;
  }

  async renderVideo(
    audioFile: File,
    lyrics: LyricEntry[],
    durationInSeconds: number,
    options: RenderOptions = {},
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string> {
    try {
      // Upload all files first
      const [audioUrl, albumArtUrl, backgroundUrl] = await Promise.all([
        this.uploadFile(audioFile, 'audio'),
        options.albumArtUrl && options.albumArtUrl.startsWith('blob:') 
          ? this.uploadFile(await fetch(options.albumArtUrl).then(r => r.blob()).then(b => new File([b], 'album.jpg')), 'image') 
          : Promise.resolve(undefined),
        options.backgroundImageUrl && options.backgroundImageUrl.startsWith('blob:')
          ? this.uploadFile(await fetch(options.backgroundImageUrl).then(r => r.blob()).then(b => new File([b], 'background.jpg')), 'image')
          : Promise.resolve(undefined)
      ]);

      onProgress?.({
        progress: 0,
        durationInFrames: Math.round(durationInSeconds * this.fps),
        renderedFrames: 0,
        status: 'rendering'
      });

      // Request video rendering with server URLs
      const renderResponse = await fetch(`${SERVER_URL}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioFile: audioUrl.split('/').pop(),
          lyrics,
          durationInSeconds,
          albumArtUrl,
          backgroundImageUrl: backgroundUrl,
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
