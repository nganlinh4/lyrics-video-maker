import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import UploadForm from './components/UploadForm';
import { LyricsVideoContent } from './components/LyricsVideo';
import { RenderControl } from './components/RenderControl';
import VideoPreview from './components/VideoPreview';
import { LyricEntry, VideoMetadata, AudioFiles } from './types';
import { analyzeAudio } from './utils/audioAnalyzer';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  font-family: 'Roboto', sans-serif;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
  font-size: 2.5rem;
  text-align: center;
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

const StatusText = styled.div<{ error?: boolean }>`
  margin: 10px 0;
  padding: 10px;
  border-radius: 4px;
  background-color: ${props => props.error ? '#ffebee' : '#e8f5e9'};
  color: ${props => props.error ? '#d32f2f' : '#2e7d32'};
`;

const App: React.FC = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFiles>({
    main: null,
    instrumental: null,
    vocal: null,
    littleVocal: null
  });
  const [audioUrls, setAudioUrls] = useState({
    main: '',
    instrumental: '',
    vocal: '',
    littleVocal: ''
  });
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState<string>('');
  const [durationInSeconds, setDurationInSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    artist: '',
    songTitle: '',
    videoType: 'Lyrics Video',
    lyricsLineThreshold: 42, // Default threshold value
    metadataPosition: -155 // Default metadata position
  });
  const [albumArtUrl, setAlbumArtUrl] = useState('');

  // Add state for multiple background files and urls
  const [backgroundFiles, setBackgroundFiles] = useState<{
    [key in VideoMetadata['videoType']]?: File | null;
  }>({});
  const [backgroundUrls, setBackgroundUrls] = useState<{
    [key in VideoMetadata['videoType']]?: string;
  }>({});

  // Separate URL management for audio and images
  useEffect(() => {
    // Handle audio URLs and perform analysis when files change
    const processAudio = async () => {
      const newAudioUrls = {
        main: audioFiles.main ? URL.createObjectURL(audioFiles.main) : '',
        instrumental: audioFiles.instrumental ? URL.createObjectURL(audioFiles.instrumental) : '',
        vocal: audioFiles.vocal ? URL.createObjectURL(audioFiles.vocal) : '',
        littleVocal: audioFiles.littleVocal ? URL.createObjectURL(audioFiles.littleVocal) : ''
      };
      
      setAudioUrls(newAudioUrls);
      
      // Perform audio analysis on all audio URLs
      // Note: This is a fallback in case the UploadForm didn't analyze the files
      // The analysis function internally checks for cached results
      for (const [key, url] of Object.entries(newAudioUrls)) {
        if (url) {
          try {
            // This won't repeat the analysis if already performed during upload
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
  }, [audioFiles]);

  // Separate effect for album art
  useEffect(() => {
    if (albumArtFile) {
      const url = URL.createObjectURL(albumArtFile);
      setAlbumArtUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAlbumArtUrl('');
    }
  }, [albumArtFile]);

  // Update the effect for background URLs management
  useEffect(() => {
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
  }, [backgroundFiles]);

  const handleFilesChange = async (
    newAudioFiles: AudioFiles,
    newLyrics: LyricEntry[] | null,
    newAlbumArtFile: File | null,
    newBackgroundFiles: {[key: string]: File | null},
    newMetadata: VideoMetadata
  ) => {
    setAudioFiles(newAudioFiles);
    setLyrics(newLyrics);
    setAlbumArtFile(newAlbumArtFile);
    setBackgroundFiles(newBackgroundFiles);
    setMetadata(newMetadata);

    if (newAudioFiles.main) {
      const audio = new Audio(URL.createObjectURL(newAudioFiles.main));
      await new Promise<void>(resolve => {
        audio.addEventListener('loadedmetadata', () => {
          setDurationInSeconds(audio.duration);
          resolve();
        });
      });
    }
  };

  // Handle lyrics threshold change
  const handleLyricsThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = parseInt(e.target.value, 10);
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      lyricsLineThreshold: newThreshold
    }));
  };

  const handleMetadataPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value, 10);
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      metadataPosition: newPosition
    }));
  };

  // Calculate whether to show preview and render controls
  const canShowPreview = audioFiles?.main && lyrics && durationInSeconds > 0;
  const durationInFrames = Math.round(Math.max(60, durationInSeconds * 60));

  console.log('Audio Files:', audioFiles);
  console.log('Lyrics:', lyrics);
  console.log('Duration:', durationInSeconds);
  console.log('Can Show Preview:', canShowPreview);

  useEffect(() => {
    console.log('Current metadata state:', metadata);
  }, [metadata]);

  useEffect(() => {
    console.log('Background Files:', backgroundFiles);
    console.log('Background URLs:', backgroundUrls);
  }, [backgroundFiles, backgroundUrls]);

  return (
    <Container>
      <Title>Lyrics Video Maker</Title>
      
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
          onVideoPathChange={setVideoPath}
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
            onRenderComplete={setVideoPath}
            vocalFile={audioFiles.vocal}
            instrumentalFile={audioFiles.instrumental}
            littleVocalFile={audioFiles.littleVocal}
          />
        )}
  
      </Card>
      
      {videoPath && (
        <Card>
          <h2>Final Video</h2>
          <VideoPreview videoUrl={videoPath} />
        </Card>
      )}
    </Container>
  );
};

export default App;
