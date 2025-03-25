import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import { LyricEntry } from '../types';
import { LyricsVideoContent } from './LyricsVideo';
import VideoPreview from './VideoPreview';
import remotionService from '../services/remotionService';
import { useQueue } from '../contexts/QueueContext';
import { useLanguage } from '../contexts/LanguageContext';

// API URL for the server
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Container = styled.div`
  margin: 20px 0;
`;

const Button = styled.button`
  background: linear-gradient(135deg, var(--accent-color) 0%, #a777e3 100%);
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
  background-color: var(--hover-color);
  border-radius: 10px;
  margin: 10px 0;
  overflow: hidden;
  transition: background-color 0.3s;
`;

const ProgressBar = styled.div<{ width: number }>`
  width: ${props => props.width}%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-color) 0%, #a777e3 100%);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  margin: 5px 0;
  color: var(--text-color);
  transition: color 0.3s;
`;

const InfoText = styled.div`
  margin: 10px 0;
  padding: 10px;
  background-color: var(--hover-color);
  border-radius: 5px;
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
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
    lyricsLineThreshold: number;
    metadataPosition: number;
    metadataWidth: number;
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
  const { t } = useLanguage();
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [renderedVideos, setRenderedVideos] = useState<{ type: string; url: string }[]>([]);
  const [status, setStatus] = useState<string>('');
  const [renderingCompleted, setRenderingCompleted] = useState(false);
  
  // Queue context
  const { 
    queue, 
    addToQueue, 
    updateQueueItem, 
    currentProcessingItem, 
    setCurrentProcessingItem,
    isProcessing 
  } = useQueue();

  const videoTypes = [
    'Lyrics Video',
    'Vocal Only',
    'Instrumental Only',
    'Little Vocal'
  ] as const;

  // Check if we can add files to queue
  const canAddToQueue = audioFile && 
                     lyrics && 
                     Array.isArray(lyrics) && 
                     lyrics.length > 0 && 
                     durationInSeconds > 0 && 
                     !isRendering;

  // Function to add current version to queue
  const handleAddCurrentVersionToQueue = () => {
    if (!canAddToQueue || !audioFile) return;

    addToQueue({
      audioFile,
      lyrics: lyrics || [],
      durationInSeconds,
      albumArtFile,
      backgroundFiles: backgroundFiles || {},
      metadata: {
        ...metadata,
        videoType: metadata.videoType
      },
      vocalFile,
      instrumentalFile,
      littleVocalFile,
      singleVersion: true
    });
  };

  // Function to add all versions to queue
  const handleAddAllVersionsToQueue = async () => {
    if (!canAddToQueue || !audioFile) return;

    // Add each video type as a separate queue item, in reverse order
    // This ensures they'll be processed in the correct order (Lyrics Video first)
    for (const videoType of [...videoTypes].reverse()) {
      addToQueue({
        audioFile,
        lyrics: lyrics || [],
        durationInSeconds,
        albumArtFile,
        backgroundFiles: backgroundFiles || {},
        metadata: {
          ...metadata,
          videoType
        },
        vocalFile,
        instrumentalFile,
        littleVocalFile,
        singleVersion: true
      });
      
      // Add a small delay between adding items
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // Process queue
  useEffect(() => {
    const processNextQueueItem = async () => {
      // If already processing or queue is empty, do nothing
      let currentItemId: string | null = null;
      if (isProcessing || queue.length === 0) return;
      
      // Find the first pending item
      const nextItem = queue.find(item => item.status === 'pending');
      if (!nextItem) return;
      
      // Set as currently processing
      currentItemId = nextItem.id;
      setCurrentProcessingItem(nextItem.id);
      updateQueueItem(nextItem.id, { status: 'processing', progress: 0 });
      
      try {
        const results: { [videoType: string]: string } = {};
        
        // Process either all video types or just the selected one based on queue item flags
        const typesToProcess = nextItem.singleVersion ? [nextItem.metadata.videoType] : videoTypes;
        
        for (const videoType of typesToProcess) {
          // Update for current video type
          updateQueueItem(nextItem.id, { 
            progress: 0,
            currentVideoType: videoType
          });
          
          // Create type-specific configuration for audio files based on the video type
          const typeSpecificAudioConfig: { [key: string]: string } = {};
          
          // Add all available audio files
          if (nextItem.vocalFile) {
            typeSpecificAudioConfig.vocalUrl = URL.createObjectURL(nextItem.vocalFile);
          }
          if (nextItem.instrumentalFile) {
            typeSpecificAudioConfig.instrumentalUrl = URL.createObjectURL(nextItem.instrumentalFile);
          }
          if (nextItem.littleVocalFile) {
            typeSpecificAudioConfig.littleVocalUrl = URL.createObjectURL(nextItem.littleVocalFile);
          }
          
          // Create background URLs map for all video types
          const backgroundImagesMap: { [key: string]: string } = {};
          Object.entries(nextItem.backgroundFiles).forEach(([bgVideoType, bgFile]) => {
            if (bgFile) {
              backgroundImagesMap[bgVideoType] = URL.createObjectURL(bgFile);
            }
          });

          // Get the specific background for this video type, or fall back to the default
          const currentBackgroundUrl = nextItem.backgroundFiles[videoType] 
            ? URL.createObjectURL(nextItem.backgroundFiles[videoType]!) 
            : (backgroundFile ? URL.createObjectURL(backgroundFile) : undefined);

          // Render this video version
          const videoPath = await remotionService.renderVideo(
            nextItem.audioFile,
            nextItem.lyrics,
            nextItem.durationInSeconds,
            {
              albumArtUrl: nextItem.albumArtFile ? URL.createObjectURL(nextItem.albumArtFile) : undefined,
              backgroundImageUrl: currentBackgroundUrl,
              backgroundImagesMap,
              metadata: { ...nextItem.metadata, videoType },
              ...typeSpecificAudioConfig
            },
            (progress) => {
              // Only update if this is still the current processing item
              const currentItemId = nextItem.id; // Store the ID at render start
              // Compare against stored ID rather than currentProcessingItem
              if (nextItem.id === currentItemId) {
                if (progress.status === 'error') {
                  updateQueueItem(nextItem.id, { 
                    error: `Error rendering ${videoType}: ${progress.error}`
                  });
                } else {
                  updateQueueItem(nextItem.id, { 
                    progress: progress.progress
                  });
                }
              }
            }
          );

          // Add result for this video type
          results[videoType] = videoPath;

          // Clean up URLs
          Object.values(typeSpecificAudioConfig).forEach(url => URL.revokeObjectURL(url));
          if (currentBackgroundUrl) URL.revokeObjectURL(currentBackgroundUrl);
        }

        // Clean up background URLs after all videos are rendered
        for (const videoType of videoTypes) {
          if (nextItem.backgroundFiles[videoType]) {
            const url = URL.createObjectURL(nextItem.backgroundFiles[videoType]!);
            URL.revokeObjectURL(url);
          }
        }

        // Mark as complete with results
        updateQueueItem(nextItem.id, { 
          status: 'complete', 
          progress: 1, 
          result: results 
        });
      } catch (err) {
        // Mark as error
        updateQueueItem(nextItem.id, { 
          status: 'error', 
          error: err instanceof Error ? err.message : 'An unknown error occurred'
        });
      } finally {
        // Clear current processing item
        setCurrentProcessingItem(null);
        currentItemId = null;
      }
    };

    // Process next item if available
    processNextQueueItem();
  }, [queue, isProcessing, currentProcessingItem, videoTypes]);

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
        
        // Create type-specific configuration for audio files based on the video type
        const typeSpecificAudioConfig: { [key: string]: string } = {};
        
        // First, add all available audio files
        if (vocalFile) {
          typeSpecificAudioConfig.vocalUrl = URL.createObjectURL(vocalFile);
        }
        if (instrumentalFile) {
          typeSpecificAudioConfig.instrumentalUrl = URL.createObjectURL(instrumentalFile);
        }
        if (littleVocalFile) {
          typeSpecificAudioConfig.littleVocalUrl = URL.createObjectURL(littleVocalFile);
        }
        
        // Log which video type we're currently rendering
        console.log(`Preparing to render ${videoType} version`);
        
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
            ...typeSpecificAudioConfig
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
        Object.values(typeSpecificAudioConfig).forEach(url => URL.revokeObjectURL(url));
        if (currentBackgroundUrl) URL.revokeObjectURL(currentBackgroundUrl);

        // Add to rendered videos list
        setRenderedVideos(prev => [...prev, { type: videoType, url: videoPath }]);
      }

      // Clean up background URLs after all videos are rendered
      for (const videoType of videoTypes) {
        if (backgroundFiles[videoType]) {
          const url = URL.createObjectURL(backgroundFiles[videoType]!);
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
        {t('note')}: {t('videosRenderedNote')}
      </InfoText>
      
      <ButtonContainer>
        <Button
          onClick={handleAddCurrentVersionToQueue}
          disabled={!canAddToQueue}
          style={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', flex: 1 }}
        >
          {t('addToQueue')}
        </Button>
        
        <Button
          onClick={handleAddAllVersionsToQueue}
          disabled={!canAddToQueue}
          style={{ background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)', flex: 1 }}
        >
          {t('addAllVersions')}
        </Button>
      </ButtonContainer>

      {isRendering && (
        <>
          <ProgressContainer>
            <ProgressBar width={progress * 100} />
          </ProgressContainer>
          <ProgressText>
            {currentVersion ? `${currentVersion}: ` : ''}
            {(progress * 100).toFixed(2)}% {t('complete')}
          </ProgressText>
        </>
      )}
      
      {renderedVideos.length > 0 && (
        <VideoList>
          <h3>{t('renderedVideos')}</h3>
          {renderedVideos.map((video, index) => (
            <VideoItem key={index}>
              <VideoTypeLabel>{video.type}</VideoTypeLabel>
              <VideoPreview videoUrl={video.url} />
            </VideoItem>
          ))}
        </VideoList>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Container>
  );
};

// Updating styled components for theme
const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const VideoList = styled.div`
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  
  h3 {
    color: var(--text-color);
    transition: color 0.3s;
  }
`;

const VideoItem = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: var(--hover-color);
  border-radius: 8px;
  transition: background-color 0.3s;
`;

const VideoTypeLabel = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  transition: color 0.3s;
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  margin-top: 1rem;
  transition: color 0.3s;
`;
