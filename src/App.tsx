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
    videoType: 'Lyrics Video'
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
