import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import UploadForm from './UploadForm';
import { LyricsVideoContent } from './LyricsVideo';
import { RenderControl } from './RenderControl';
import VideoPreview from './VideoPreview';
import { LyricEntry, VideoMetadata, AudioFiles } from '../types';
import { analyzeAudio } from '../utils/audioAnalyzer';
import { useTabs } from '../contexts/TabsContext';

// Types and props
interface WorkspaceProps {
  tabId: string;
}

// Define a local AudioFiles type that matches what we're using in the component
interface LocalAudioFiles {
  main: File | null;
  instrumental: File | null;
  vocal: File | null;
  littleVocal: File | null;
}

const Workspace: React.FC<WorkspaceProps> = ({ tabId }) => {
  const { updateTabContent, activeWorkspace } = useTabs();
  
  // Always declare hooks at the top level, regardless of conditions
  const [audioUrls, setAudioUrls] = useState({
    main: '',
    instrumental: '',
    vocal: '',
    littleVocal: ''
  });
  const [albumArtUrl, setAlbumArtUrl] = useState('');
  const [backgroundUrls, setBackgroundUrls] = useState<{
    [key in VideoMetadata['videoType']]?: string;
  }>({});

  // Get workspace data or use defaults for non-active workspace
  const isActiveWorkspace = activeWorkspace && activeWorkspace.id === tabId;
  const workspaceData = isActiveWorkspace ? activeWorkspace : null;
  
  // Separate URL management for audio and images - runs only when this is the active workspace
  useEffect(() => {
    if (!isActiveWorkspace || !workspaceData) return;
    
    // Handle audio URLs and perform analysis when files change
    const processAudio = async () => {
      const audioFiles = workspaceData.audioFiles;
      
      const newAudioUrls = {
        main: audioFiles.main ? URL.createObjectURL(audioFiles.main) : '',
        instrumental: audioFiles.instrumental ? URL.createObjectURL(audioFiles.instrumental) : '',
        vocal: audioFiles.vocal ? URL.createObjectURL(audioFiles.vocal) : '',
        littleVocal: audioFiles.littleVocal ? URL.createObjectURL(audioFiles.littleVocal) : ''
      };
      
      setAudioUrls(newAudioUrls);
      
      // Perform audio analysis on all audio URLs
      for (const [key, url] of Object.entries(newAudioUrls)) {
        if (url) {
          try {
            await analyzeAudio(url);
          } catch (err) {
            console.error(`Error analyzing ${key} audio:`, err);
          }
        }
      }
    };
    
    processAudio();
    
    // Cleanup function for audio URLs
    return () => {
      Object.values(audioUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [isActiveWorkspace, workspaceData?.audioFiles]);  // Remove audioUrls from dependencies

  // Separate effect for album art
  useEffect(() => {
    if (!isActiveWorkspace || !workspaceData) return;
    
    const albumArtFile = workspaceData.albumArtFile;
    
    if (albumArtFile) {
      const url = URL.createObjectURL(albumArtFile);
      setAlbumArtUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAlbumArtUrl('');
    }
  }, [isActiveWorkspace, workspaceData?.albumArtFile]);

  // Update the effect for background URLs management
  useEffect(() => {
    if (!isActiveWorkspace || !workspaceData) return;
    
    const backgroundFiles = workspaceData.backgroundFiles;
    
    // Create object to store all background URLs
    const newBackgroundUrls: {[key: string]: string} = {};
    
    // Process each background file
    Object.entries(backgroundFiles).forEach(([type, file]) => {
      if (file) {
        const url = URL.createObjectURL(file);
        newBackgroundUrls[type] = url;
      }
    });
    
    setBackgroundUrls(newBackgroundUrls);
    
    // Cleanup function for background URLs
    return () => {
      Object.values(backgroundUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [isActiveWorkspace, workspaceData?.backgroundFiles]);  // Remove backgroundUrls from dependencies

  // If this workspace is not active, don't render it
  if (!isActiveWorkspace || !workspaceData) {
    return null;
  }

  const {
    audioFiles,
    lyrics,
    albumArtFile,
    backgroundFiles,
    metadata,
    durationInSeconds,
    videoPath
  } = workspaceData;

  const handleFilesChange = async (
    newAudioFiles: AudioFiles,
    newLyrics: LyricEntry[] | null,
    newAlbumArtFile: File | null,
    newBackgroundFiles: {[key: string]: File | null},
    newMetadata: VideoMetadata
  ) => {
    let newDuration = durationInSeconds;

    if (newAudioFiles.main) {
      const audio = new Audio(URL.createObjectURL(newAudioFiles.main));
      await new Promise<void>(resolve => {
        audio.addEventListener('loadedmetadata', () => {
          newDuration = audio.duration;
          resolve();
        });
      });
    }

    // Ensure we have a consistent format for audioFiles matching our local definition
    const normalizedAudioFiles: LocalAudioFiles = {
      main: newAudioFiles.main,
      instrumental: newAudioFiles.instrumental || null,
      vocal: newAudioFiles.vocal || null,
      littleVocal: newAudioFiles.littleVocal || null
    };

    // Update the tab content
    updateTabContent(tabId, {
      audioFiles: normalizedAudioFiles,
      lyrics: newLyrics,
      albumArtFile: newAlbumArtFile,
      backgroundFiles: newBackgroundFiles,
      metadata: newMetadata,
      durationInSeconds: newDuration
    });

    // Also update the tab name if artist and song title are provided
    if (newMetadata.artist && newMetadata.songTitle) {
      updateTabContent(tabId, {
        name: `${newMetadata.artist} - ${newMetadata.songTitle}`
      });
    }
  };

  // Handle lyrics threshold change
  const handleLyricsThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = parseInt(e.target.value, 10);
    updateTabContent(tabId, {
      metadata: {
        ...metadata,
        lyricsLineThreshold: newThreshold
      }
    });
  };

  const handleMetadataPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value, 10);
    updateTabContent(tabId, {
      metadata: {
        ...metadata,
        metadataPosition: newPosition
      }
    });
  };

  // Handle metadata width change
  const handleMetadataWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10);
    updateTabContent(tabId, {
      metadata: {
        ...metadata,
        metadataWidth: newWidth
      }
    });
  };

  // Set video path when rendering is complete
  const handleRenderComplete = (path: string) => {
    updateTabContent(tabId, { videoPath: path });
  };

  // Calculate whether to show preview and render controls
  const canShowPreview = audioFiles?.main && lyrics && durationInSeconds > 0;
  const durationInFrames = Math.round(Math.max(60, durationInSeconds * 60));

  return (
    <WorkspaceContainer>
      {canShowPreview && (
        <Card>
          <h2>Video Preview</h2>
          <PreviewContainer>
            <Player
              key={`player-${metadata.videoType}-${albumArtUrl}-${backgroundUrls[metadata.videoType] || ''}-${audioUrls.main}-${audioUrls.instrumental}-${audioUrls.vocal}-${audioUrls.littleVocal}`}
              component={LyricsVideoContent}
              durationInFrames={durationInFrames}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={60}
              controls
              style={{
                width: '100%',
                aspectRatio: '16/9',
              }}
              inputProps={{
                audioUrl: audioUrls.main,
                instrumentalUrl: audioUrls.instrumental,
                vocalUrl: audioUrls.vocal,
                littleVocalUrl: audioUrls.littleVocal,
                lyrics: lyrics || [],
                durationInSeconds,
                albumArtUrl,
                backgroundImageUrl: backgroundUrls[metadata.videoType] || '',
                backgroundImagesMap: backgroundUrls,
                metadata
              }}
            />
          </PreviewContainer>
          <ControlPanel>
            <SliderControl>
              <SliderLabel>
                Metadata Position
                <SliderValue>{metadata.metadataPosition}px</SliderValue>
              </SliderLabel>
              <input
                type="range"
                min="-200"
                max="-155"
                value={metadata.metadataPosition || -155}
                onChange={handleMetadataPositionChange}
              />
              <small>Adjust the vertical position of the artist name and song title.</small>
            </SliderControl>
            <SliderControl>
              <SliderLabel>
                Metadata Width
                <SliderValue>{metadata.metadataWidth}px</SliderValue>
              </SliderLabel>
              <input
                type="range"
                min="450"
                max="900"
                value={metadata.metadataWidth || 450}
                onChange={handleMetadataWidthChange}
              />
              <small>Adjust the width of the metadata container while maintaining center alignment with album art.</small>
            </SliderControl>
            <SliderControl>
              <SliderLabel>
                Lyrics Line Threshold
                <SliderValue>{metadata.lyricsLineThreshold}</SliderValue>
              </SliderLabel>
              <input
                type="range"
                min="20"
                max="100"
                value={metadata.lyricsLineThreshold || 40}
                onChange={handleLyricsThresholdChange}
              />
              <small>Lyrics with more characters than this threshold will be automatically split into multiple lines to prevent words from jumping during animations.</small>
            </SliderControl>
          </ControlPanel>
        </Card>
      )}
      
      <Card>
        <UploadForm
          onFilesChange={handleFilesChange}
          onVideoPathChange={path => updateTabContent(tabId, { videoPath: path })}
          initialValues={{
            audioFiles: {
              main: audioFiles.main,
              instrumental: audioFiles.instrumental || null,
              vocal: audioFiles.vocal || null,
              littleVocal: audioFiles.littleVocal || null
            },
            lyrics,
            albumArtFile,
            backgroundFiles,
            metadata
          }}
        />

        {canShowPreview && (
          <RenderControl
            audioFile={audioFiles.main}
            lyrics={lyrics}
            durationInSeconds={durationInSeconds}
            albumArtFile={albumArtFile}
            backgroundFile={backgroundFiles[metadata.videoType]}
            backgroundFiles={backgroundFiles}
            metadata={metadata}
            onRenderComplete={handleRenderComplete}
            vocalFile={audioFiles.vocal || null}
            instrumentalFile={audioFiles.instrumental || null}
            littleVocalFile={audioFiles.littleVocal || null}
          />
        )}
      </Card>
      
      {videoPath && (
        <Card>
          <h2>Final Video</h2>
          <VideoPreview videoUrl={videoPath} />
        </Card>
      )}
    </WorkspaceContainer>
  );
};

const WorkspaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 10px 0;
  width: 100%;
  max-width: 800px;
`;

const PreviewContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 20px 0;
`;

const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 15px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
`;

const SliderControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SliderLabel = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;

const SliderValue = styled.span`
  font-weight: bold;
  background-color: #e0e0e0;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 40px;
  text-align: center;
`;

export default Workspace;