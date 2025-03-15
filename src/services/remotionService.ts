import { LyricEntry } from '../types';

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
      throw new Error(
        'Video rendering requires a server-side environment. ' +
        'Please implement a backend service to handle the rendering process. ' +
        'The preview functionality will continue to work in the browser.'
      );
    } catch (error) {
      console.error('Error rendering video:', error);
      onProgress?.({
        progress: 0,
        durationInFrames: 0,
        renderedFrames: 0,
        status: 'error',
        error: error instanceof Error 
          ? error.message 
          : 'Video rendering requires a server environment'
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
