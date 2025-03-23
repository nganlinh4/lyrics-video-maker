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
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  // Always declare hooks at the top level, regardless of conditions
  const [audioUrls, setAudioUrls] = useState({
    main: '',
    instrumental: '',
    vocal: '',
    littleVocal: ''
  });
  const [albumArtUrl, setAlbumArtUrl] = useState<string>('');
  const [backgroundUrls, setBackgroundUrls] = useState<{[key: string]: string}>({});
  
  // Check if this workspace is active
  const isActiveWorkspace = activeWorkspace?.id === tabId;
  const workspaceData = activeWorkspace;

  // Update audio URLs when the workspace data changes
  useEffect(() => {
    if (!isActiveWorkspace || !workspaceData?.audioFiles) return;
    
    const processAudio = async () => {
      // Clean up previous object URLs
      Object.values(audioUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      
      const { main, instrumental, vocal, littleVocal } = workspaceData.audioFiles;
      
      const newAudioUrls = {
        main: main ? URL.createObjectURL(main) : '',
        instrumental: instrumental ? URL.createObjectURL(instrumental) : '',
        vocal: vocal ? URL.createObjectURL(vocal) : '',
        littleVocal: littleVocal ? URL.createObjectURL(littleVocal) : ''
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
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAlbumArtUrl('');
    }
  }, [isActiveWorkspace, workspaceData?.albumArtFile]);

  // Separate effect for background images
  useEffect(() => {
    if (!isActiveWorkspace || !workspaceData) return;
    
    // Clean up previous URLs
    Object.values(backgroundUrls).forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    const newBackgroundUrls: {[key: string]: string} = {};
    
    // Create URLs for each video type if a background is available
    Object.entries(workspaceData.backgroundFiles).forEach(([videoType, file]) => {
      if (file) {
        newBackgroundUrls[videoType] = URL.createObjectURL(file);
      }
    });
    
    setBackgroundUrls(newBackgroundUrls);
    
    // Cleanup function
    return () => {
      Object.values(newBackgroundUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [isActiveWorkspace, workspaceData?.backgroundFiles]);

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

  // Handle metadata position change
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
      <WorkspaceTopSection>
        <UploadFormCard>
          <h2>{t('uploadFiles')}</h2>
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
        </UploadFormCard>
      </WorkspaceTopSection>
      
      {/* Preview and controls - show only when we have enough data */}
      {canShowPreview && (
        <PreviewSection>
          <PreviewCard>
            <PreviewTitle>{t('videoPreview')}</PreviewTitle>
            <PreviewGrid>
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
              
              <ControlPanelContainer>
                <h3>{t('adjustPreview')}</h3>
                <SliderControl>
                  <SliderLabel>
                    {t('metadataPosition')}
                    <SliderValue>{metadata.metadataPosition}px</SliderValue>
                  </SliderLabel>
                  <input
                    type="range"
                    min="-200"
                    max="-155"
                    value={metadata.metadataPosition || -155}
                    onChange={handleMetadataPositionChange}
                  />
                  <SliderDescription>Adjust the vertical position of the artist name and song title.</SliderDescription>
                </SliderControl>
                <SliderControl>
                  <SliderLabel>
                    {t('metadataWidth')}
                    <SliderValue>{metadata.metadataWidth}px</SliderValue>
                  </SliderLabel>
                  <input
                    type="range"
                    min="450"
                    max="900"
                    value={metadata.metadataWidth || 450}
                    onChange={handleMetadataWidthChange}
                  />
                  <SliderDescription>Adjust the width of the metadata container.</SliderDescription>
                </SliderControl>
                <SliderControl>
                  <SliderLabel>
                    {t('lyricsLineThreshold')}
                    <SliderValue>{metadata.lyricsLineThreshold}</SliderValue>
                  </SliderLabel>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={metadata.lyricsLineThreshold || 40}
                    onChange={handleLyricsThresholdChange}
                  />
                  <SliderDescription>Long lyrics lines will be automatically split to prevent words from jumping.</SliderDescription>
                </SliderControl>
              </ControlPanelContainer>
            </PreviewGrid>
          </PreviewCard>

          <RenderControlCard>
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
          </RenderControlCard>
        </PreviewSection>
      )}
      
      {/* Final rendered video section */}
      {videoPath && (
        <FinalVideoSection>
          <VideoCard>
            <h2>{t('finalVideo')}</h2>
            <VideoPreview videoUrl={videoPath} />
          </VideoCard>
        </FinalVideoSection>
      )}
    </WorkspaceContainer>
  );
};

const WorkspaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const WorkspaceTopSection = styled.section`
  width: 100%;
`;

const PreviewSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const FinalVideoSection = styled.section`
  width: 100%;
`;

const UploadFormCard = styled.div`
  background: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-color);
  padding: 1.5rem;
  transition: background-color 0.3s, box-shadow 0.3s;

  h2 {
    color: var(--heading-color);
    margin-bottom: 1.5rem;
    font-size: 1.6rem;
  }
`;

const PreviewCard = styled.div`
  background: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-color);
  overflow: hidden;
  transition: background-color 0.3s, box-shadow 0.3s;
`;

const PreviewTitle = styled.h2`
  color: var(--heading-color);
  padding: 1.5rem;
  margin: 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 1.6rem;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  
  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewContainer = styled.div`
  padding: 1.5rem;
  border-right: 1px solid var(--border-color);
  
  @media (max-width: 980px) {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
`;

const ControlPanelContainer = styled.div`
  padding: 1.5rem;
  background-color: var(--hover-color);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  h3 {
    margin-top: 0;
    color: var(--heading-color);
    margin-bottom: 1rem;
  }
`;

const RenderControlCard = styled.div`
  background: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-color);
  padding: 1.5rem;
  transition: background-color 0.3s, box-shadow 0.3s;
`;

const VideoCard = styled.div`
  background: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-color);
  padding: 1.5rem;
  transition: background-color 0.3s, box-shadow 0.3s;

  h2 {
    color: var(--heading-color);
    margin-bottom: 1.5rem;
    font-size: 1.6rem;
  }
`;

const SliderControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SliderLabel = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-color);
`;

const SliderValue = styled.span`
  font-weight: bold;
  background-color: var(--input-background);
  color: var(--text-color);
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 50px;
  text-align: center;
`;

const SliderDescription = styled.small`
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

export default Workspace;