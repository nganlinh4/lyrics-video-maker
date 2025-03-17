import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import UploadForm from './components/UploadForm';
import { LyricsVideoContent } from './components/LyricsVideo';
import { RenderControl } from './components/RenderControl';
import VideoPreview from './components/VideoPreview';
import { LyricEntry } from './types';

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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [durationInSeconds, setDurationInSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clean up object URLs on unmount
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFilesChange = async (
    newAudioFile: File | null,
    newLyrics: LyricEntry[] | null,
    newAlbumArtFile: File | null,
    newBackgroundFile: File | null
  ) => {
    setAudioFile(newAudioFile);
    setLyrics(newLyrics);
    setAlbumArtFile(newAlbumArtFile);
    setBackgroundFile(newBackgroundFile);

    if (newAudioFile) {
      const url = URL.createObjectURL(newAudioFile);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      await new Promise(resolve => {
        audio.addEventListener('loadedmetadata', () => {
          setDurationInSeconds(audio.duration);
          resolve(null);
        });
      });
    }
  };

  // Calculate whether to show preview and render controls
  const canShowPreview = audioFile && lyrics && durationInSeconds > 0;
  const durationInFrames = Math.round(Math.max(30, durationInSeconds * 30));

  return (
    <Container>
      <Title>Lyrics Video Maker</Title>
      
      {canShowPreview && (
        <Card>
          <h2>Video Preview</h2>
          <PreviewContainer>
            <Player
              component={LyricsVideoContent}
              durationInFrames={durationInFrames}
              compositionWidth={1280}
              compositionHeight={720}
              fps={30}
              controls
              inputProps={{
                audioUrl,
                lyrics: lyrics || [],
                durationInSeconds,
                albumArtUrl: albumArtFile ? URL.createObjectURL(albumArtFile) : undefined,
                backgroundImageUrl: backgroundFile ? URL.createObjectURL(backgroundFile) : undefined
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
            audioFile={audioFile}
            lyrics={lyrics}
            durationInSeconds={durationInSeconds}
            albumArtFile={albumArtFile}
            backgroundFile={backgroundFile}
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
