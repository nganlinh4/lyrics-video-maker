import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import UploadForm from './components/UploadForm';
import { LyricsVideoContent } from './components/LyricsVideo';
import { RenderControl } from './components/RenderControl';
import VideoPreview from './components/VideoPreview';
import { LyricEntry, VideoMetadata, AudioFiles } from './types';

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
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState<string>('');
  const [durationInSeconds, setDurationInSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    artist: '',
    songTitle: '',
    videoType: 'Lyrics Video'
  });
  const [albumArtUrl, setAlbumArtUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');

  // Separate URL management for audio and images
  useEffect(() => {
    // Handle audio URLs
    const newAudioUrls = {
      main: audioFiles.main ? URL.createObjectURL(audioFiles.main) : '',
      instrumental: audioFiles.instrumental ? URL.createObjectURL(audioFiles.instrumental) : '',
      vocal: audioFiles.vocal ? URL.createObjectURL(audioFiles.vocal) : '',
      littleVocal: audioFiles.littleVocal ? URL.createObjectURL(audioFiles.littleVocal) : ''
    };
    setAudioUrls(newAudioUrls);

    // Cleanup function for audio URLs
    return () => {
      Object.values(newAudioUrls).forEach(url => {
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

  // Separate effect for background
  useEffect(() => {
    if (backgroundFile) {
      const url = URL.createObjectURL(backgroundFile);
      setBackgroundUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBackgroundUrl('');
    }
  }, [backgroundFile]);

  const handleFilesChange = async (
    newAudioFiles: AudioFiles,
    newLyrics: LyricEntry[] | null,
    newAlbumArtFile: File | null,
    newBackgroundFile: File | null,
    newMetadata: VideoMetadata
  ) => {
    setAudioFiles(newAudioFiles);
    setLyrics(newLyrics);
    setAlbumArtFile(newAlbumArtFile);
    setBackgroundFile(newBackgroundFile);
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
  const durationInFrames = Math.round(Math.max(30, durationInSeconds * 30));

  console.log('Audio Files:', audioFiles);
  console.log('Lyrics:', lyrics);
  console.log('Duration:', durationInSeconds);
  console.log('Can Show Preview:', canShowPreview);

  useEffect(() => {
    console.log('Current metadata state:', metadata);
  }, [metadata]);

  useEffect(() => {
    console.log('Background File:', backgroundFile);
    console.log('Background URL:', backgroundUrl);
  }, [backgroundFile, backgroundUrl]);

  return (
    <Container>
      <Title>Lyrics Video Maker</Title>
      
      {canShowPreview && (
        <Card>
          <h2>Video Preview</h2>
          <PreviewContainer>
            <Player
              key={`player-${metadata.videoType}-${albumArtUrl}-${backgroundUrl}-${audioUrls.main}-${audioUrls.instrumental}-${audioUrls.vocal}-${audioUrls.littleVocal}`}
              component={LyricsVideoContent}
              durationInFrames={durationInFrames}
              compositionWidth={1280}
              compositionHeight={720}
              fps={30}
              controls
              inputProps={{
                audioUrl: audioUrls.main,
                instrumentalUrl: audioUrls.instrumental,
                vocalUrl: audioUrls.vocal,
                littleVocalUrl: audioUrls.littleVocal,
                lyrics: lyrics || [],
                durationInSeconds,
                albumArtUrl,
                backgroundImageUrl: backgroundUrl,
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
            backgroundFile={backgroundFile}
            metadata={metadata}
            onRenderComplete={setVideoPath}
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
