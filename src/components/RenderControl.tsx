import React, { useState } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import { LyricEntry } from '../types';
import { LyricsVideoContent } from './LyricsVideo';
import VideoPreview from './VideoPreview';
import remotionService from '../services/remotionService';

// API URL for the server
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Container = styled.div`
  margin: 20px 0;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  margin: 10px 0;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  width: ${props => props.width}%;
  height: 100%;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  margin: 5px 0;
  color: #666;
`;

const InfoText = styled.div`
  margin: 10px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  color: #666;
`;

interface RenderControlProps {
  audioFile: File | null;
  lyrics: LyricEntry[] | null;
  durationInSeconds: number;
  albumArtFile?: File | null;
  backgroundFile?: File | null;
  backgroundFiles?: { [key: string]: File | null };
  metadata: {
    artist: string;
    songTitle: string;
    videoType: 'Lyrics Video' | 'Vocal Only' | 'Instrumental Only' | 'Little Vocal';
  };
  onRenderComplete: (videoPath: string) => void;
  vocalFile?: File | null;
  instrumentalFile?: File | null;
  littleVocalFile?: File | null;
}

export const RenderControl: React.FC<RenderControlProps> = ({
  audioFile,
  lyrics,
  durationInSeconds,
  albumArtFile,
  backgroundFile,
  backgroundFiles = {},
  metadata,
  onRenderComplete,
  vocalFile,
  instrumentalFile,
  littleVocalFile
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [renderedVideos, setRenderedVideos] = useState<{ type: string; url: string }[]>([]);
  const [status, setStatus] = useState<string>('');
  const [renderingCompleted, setRenderingCompleted] = useState(false);

  const videoTypes = [
    'Lyrics Video',
    'Vocal Only',
    'Instrumental Only',
    'Little Vocal'
  ] as const;

  const handleRender = async () => {
    if (!audioFile || !(audioFile instanceof File)) {
      setError('Please upload a valid audio file');
      return;
    }

    if (!lyrics || !Array.isArray(lyrics) || lyrics.length === 0) {
      setError('Please upload valid lyrics');
      return;
    }

    setIsRendering(true);
    setProgress(0);
    setError(null);

    try {
      // Create URLs for additional audio files if they exist
      const additionalUrls: { [key: string]: string } = {};
      
      if (vocalFile) {
        additionalUrls.vocalUrl = URL.createObjectURL(vocalFile);
      }
      if (instrumentalFile) {
        additionalUrls.instrumentalUrl = URL.createObjectURL(instrumentalFile);
      }
      if (littleVocalFile) {
        additionalUrls.littleVocalUrl = URL.createObjectURL(littleVocalFile);
      }

      const videoPath = await remotionService.renderVideo(
        audioFile,
        lyrics,
        durationInSeconds,
        {
          albumArtUrl: albumArtFile ? URL.createObjectURL(albumArtFile) : undefined,
          backgroundImageUrl: backgroundFile ? URL.createObjectURL(backgroundFile) : undefined,
          metadata,
          ...additionalUrls
        },
        (progress) => {
          if (progress.status === 'error') {
            setError(progress.error || 'An error occurred during rendering');
            setIsRendering(false);
          } else {
            setProgress(progress.progress);
          }
        }
      );

      // Clean up URLs
      Object.values(additionalUrls).forEach(url => URL.revokeObjectURL(url));

      setIsRendering(false);
      onRenderComplete(videoPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRendering(false);
    }
  };

  const handleRenderAllVersions = async () => {
    if (!audioFile || !(audioFile instanceof File)) {
      setError('Please upload a valid audio file');
      return;
    }

    if (!lyrics || !Array.isArray(lyrics) || lyrics.length === 0) {
      setError('Please upload valid lyrics');
      return;
    }

    setIsRendering(true);
    setProgress(0);
    setError(null);
    setRenderedVideos([]);

    try {
      for (const videoType of videoTypes) {
        setCurrentVersion(videoType);
        
        // Create URLs for additional audio files if they exist
        const additionalUrls: { [key: string]: string } = {};
        if (vocalFile) {
          additionalUrls.vocalUrl = URL.createObjectURL(vocalFile);
        }
        if (instrumentalFile) {
          additionalUrls.instrumentalUrl = URL.createObjectURL(instrumentalFile);
        }
        if (littleVocalFile) {
          additionalUrls.littleVocalUrl = URL.createObjectURL(littleVocalFile);
        }

        // Create background URLs map for all video types
        const backgroundImagesMap: { [key: string]: string } = {};
        Object.entries(backgroundFiles).forEach(([bgVideoType, bgFile]) => {
          if (bgFile) {
            backgroundImagesMap[bgVideoType] = URL.createObjectURL(bgFile);
          }
        });

        // Get the specific background for this video type, or fall back to the default
        const currentBackgroundUrl = backgroundFiles[videoType] 
          ? URL.createObjectURL(backgroundFiles[videoType]!) 
          : (backgroundFile ? URL.createObjectURL(backgroundFile) : undefined);

        const videoPath = await remotionService.renderVideo(
          audioFile,
          lyrics,
          durationInSeconds,
          {
            albumArtUrl: albumArtFile ? URL.createObjectURL(albumArtFile) : undefined,
            backgroundImageUrl: currentBackgroundUrl,
            backgroundImagesMap,
            metadata: { ...metadata, videoType },
            ...additionalUrls
          },
          (progress) => {
            if (progress.status === 'error') {
              setError(`Error rendering ${videoType}: ${progress.error}`);
            } else {
              setProgress(progress.progress);
            }
          }
        );

        // Clean up URLs
        Object.values(additionalUrls).forEach(url => URL.revokeObjectURL(url));
        if (currentBackgroundUrl) URL.revokeObjectURL(currentBackgroundUrl);

        // Add to rendered videos list
        setRenderedVideos(prev => [...prev, { type: videoType, url: videoPath }]);
      }

      // Clean up background URLs after all videos are rendered
      // Store backgroundImagesMap URLs in a separate array before the loop ends
      const backgroundUrlsToCleanup: string[] = [];
      for (const videoType of videoTypes) {
        if (backgroundFiles[videoType]) {
          const url = URL.createObjectURL(backgroundFiles[videoType]!);
          backgroundUrlsToCleanup.push(url);
          URL.revokeObjectURL(url);
        }
      }

      setIsRendering(false);
      setCurrentVersion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRendering(false);
      setCurrentVersion(null);
    }
  };

  const uploadFiles = async () => {
    setStatus('Uploading files...');
    setProgress(0);
    setRenderingCompleted(false);
    
    try {
      // Upload the main audio file
      if (!audioFile) throw new Error('No audio file provided');
      const audioFormData = new FormData();
      audioFormData.append('file', audioFile);
      const audioResponse = await fetch(`${apiUrl}/upload/audio`, {
        method: 'POST',
        body: audioFormData
      });
      
      if (!audioResponse.ok) throw new Error('Failed to upload audio file');
      const audioData = await audioResponse.json();
      setProgress(20);
      
      // Upload optional instrumental file
      let instrumentalData = null;
      if (instrumentalFile) {
        const instrumentalFormData = new FormData();
        instrumentalFormData.append('file', instrumentalFile);
        const instrumentalResponse = await fetch(`${apiUrl}/upload/audio`, {
          method: 'POST',
          body: instrumentalFormData
        });
        
        if (instrumentalResponse.ok) {
          instrumentalData = await instrumentalResponse.json();
        }
      }
      setProgress(30);
      
      // Upload optional vocal file
      let vocalData = null;
      if (vocalFile) {
        const vocalFormData = new FormData();
        vocalFormData.append('file', vocalFile);
        const vocalResponse = await fetch(`${apiUrl}/upload/audio`, {
          method: 'POST',
          body: vocalFormData
        });
        
        if (vocalResponse.ok) {
          vocalData = await vocalResponse.json();
        }
      }
      setProgress(35);
      
      // Upload optional little vocal file
      let littleVocalData = null;
      if (littleVocalFile) {
        const littleVocalFormData = new FormData();
        littleVocalFormData.append('file', littleVocalFile);
        const littleVocalResponse = await fetch(`${apiUrl}/upload/audio`, {
          method: 'POST',
          body: littleVocalFormData
        });
        
        if (littleVocalResponse.ok) {
          littleVocalData = await littleVocalResponse.json();
        }
      }
      setProgress(40);
      
      // Upload album art file (if provided)
      let albumArtData = null;
      if (albumArtFile) {
        const albumArtFormData = new FormData();
        albumArtFormData.append('file', albumArtFile);
        const albumArtResponse = await fetch(`${apiUrl}/upload/image`, {
          method: 'POST',
          body: albumArtFormData
        });
        
        if (albumArtResponse.ok) {
          albumArtData = await albumArtResponse.json();
        }
      }
      setProgress(50);
      
      // Upload background images for each version (if provided)
      const backgroundDataMap: { [key: string]: any } = {};
      
      // Upload all background files
      for (const [videoType, bgFile] of Object.entries(backgroundFiles)) {
        if (bgFile) {
          const bgFormData = new FormData();
          bgFormData.append('file', bgFile);
          const bgResponse = await fetch(`${apiUrl}/upload/image`, {
            method: 'POST',
            body: bgFormData
          });
          
          if (bgResponse.ok) {
            backgroundDataMap[videoType] = await bgResponse.json();
          }
        }
      }
      
      setProgress(60);
      
      // Start rendering with all uploaded files
      setStatus('Starting rendering process...');
      
      const renderData = {
        audioFile: audioData.filename,
        lyrics,
        durationInSeconds,
        albumArtUrl: albumArtData ? `${apiUrl}/uploads/${albumArtData.filename}` : undefined,
        backgroundImageUrl: backgroundDataMap[metadata.videoType] 
          ? `${apiUrl}/uploads/${backgroundDataMap[metadata.videoType].filename}` 
          : undefined,
        backgroundImagesMap: Object.entries(backgroundDataMap).reduce((acc: { [key: string]: string }, [type, data]: [string, any]) => {
          acc[type] = `${apiUrl}/uploads/${data.filename}`;
          return acc;
        }, {}),
        metadata,
        instrumentalUrl: instrumentalData ? `${apiUrl}/uploads/${instrumentalData.filename}` : undefined,
        vocalUrl: vocalData ? `${apiUrl}/uploads/${vocalData.filename}` : undefined,
        littleVocalUrl: littleVocalData ? `${apiUrl}/uploads/${littleVocalData.filename}` : undefined,
      };
      
      console.log('Rendering with data:', renderData);

      // Start the rendering process on the server
      const renderResponse = await fetch(`${apiUrl}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(renderData)
      });
      
      if (!renderResponse.ok) {
        throw new Error('Failed to start rendering process');
      }
      
      const { id } = await renderResponse.json();
      
      // Poll for render status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${apiUrl}/render/status/${id}`);
          if (!statusResponse.ok) {
            throw new Error('Failed to get render status');
          }
          
          const statusData = await statusResponse.json();
          
          setStatus(statusData.status);
          setProgress(statusData.progress);
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setRenderingCompleted(true);
            onRenderComplete(`${apiUrl}/output/${statusData.outputFile}`);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            throw new Error(statusData.error || 'Rendering failed');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError(err instanceof Error ? err.message : 'An error occurred during rendering');
          setStatus('Failed');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files');
      setStatus('Failed');
    }
  };

  return (
    <Container>
      <InfoText>
        Note: This is a preview environment. Video rendering requires a server-side component. 
        The preview above shows how your video will look, but downloading the final video 
        is not available in this browser-only version.
      </InfoText>
      
      <ButtonContainer>
        <Button
          onClick={handleRender}
          disabled={isRendering || !audioFile || !lyrics}
        >
          {isRendering ? 'Rendering...' : 'Render Current Version'}
        </Button>
        
        <Button
          onClick={handleRenderAllVersions}
          disabled={isRendering || !audioFile || !lyrics}
          style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' }}
        >
          {isRendering ? `Rendering ${currentVersion || '...'}` : 'Render All Versions'}
        </Button>
      </ButtonContainer>

      {isRendering && (
        <>
          <ProgressContainer>
            <ProgressBar width={progress * 100} />
          </ProgressContainer>
          <ProgressText>
            {currentVersion ? `${currentVersion}: ` : ''}
            {Math.round(progress * 100)}% Complete
          </ProgressText>
        </>
      )}
      
      {renderedVideos.length > 0 && (
        <VideoList>
          <h3>Rendered Videos:</h3>
          {renderedVideos.map((video, index) => (
            <VideoItem key={index}>
              <VideoTypeLabel>{video.type}</VideoTypeLabel>
              <VideoPreview videoUrl={video.url} />
            </VideoItem>
          ))}
        </VideoList>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </Container>
  );
};

// Add new styled components
const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const VideoList = styled.div`
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;

const VideoItem = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const VideoTypeLabel = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #666;
`;
