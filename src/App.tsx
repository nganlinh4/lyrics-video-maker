import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import AudioUpload from './components/AudioUpload';
import LyricsUpload from './components/LyricsUpload';
import { LyricsVideo, LyricsVideoContent } from './components/LyricsVideo';
import VideoPreview from './components/VideoPreview';
import { RenderControl } from './components/RenderControl';
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
  const [videoPath, setVideoPath] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [durationInSeconds, setDurationInSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleAudioUpload = (file: File | null) => {
    setAudioFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setError(null);
    } else {
      setAudioUrl('');
    }
  };

  const handleLyricsUpload = (lyricsData: LyricEntry[] | null) => {
    setLyrics(lyricsData);
    if (lyricsData && lyricsData.length > 0) {
      // Calculate duration based on the end time of the last lyric + 2 seconds
      const lastLyricEnd = Math.max(...lyricsData.map(lyric => lyric.end));
      setDurationInSeconds(lastLyricEnd + 2);
      setError(null);
    } else {
      setDurationInSeconds(0);
    }
  };

  const handleRenderComplete = (path: string) => {
    setVideoPath(path);
  };

  // Clean up object URLs when component unmounts or when the audio file changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Calculate whether to show preview and render controls
  const canShowPreview = audioFile && lyrics && durationInSeconds > 0;
  
  // Calculate duration in frames, ensuring it's an integer
  const durationInFrames = Math.round(Math.max(30, durationInSeconds * 30));

  return (
    <Container>
      <Title>Lyrics Video Maker</Title>
      
      <Card>
        <h2>Step 1: Upload Audio</h2>
        <AudioUpload onAudioUpload={handleAudioUpload} />
      </Card>
      
      <Card>
        <h2>Step 2: Upload Lyrics</h2>
        <LyricsUpload onLyricsUpload={handleLyricsUpload} />
      </Card>
      
      {error && (
        <StatusText error>{error}</StatusText>
      )}
      
      {canShowPreview && (
        <Card>
          <h2>Step 3: Preview</h2>
          <PreviewContainer>
            <Player
              component={LyricsVideoContent}
              durationInFrames={durationInFrames} // Use the rounded value here
              compositionWidth={1280}
              compositionHeight={720}
              fps={30}
              controls
              inputProps={{
                audioUrl: audioUrl,
                lyrics: lyrics || [],
                durationInSeconds
              }}
            />
          </PreviewContainer>
        </Card>
      )}
      
      {canShowPreview && (
        <Card>
          <h2>Step 4: Render Video</h2>
          <RenderControl 
            audioFile={audioFile} 
            lyrics={lyrics} 
            durationInSeconds={durationInSeconds}
            onRenderComplete={handleRenderComplete} 
          />
        </Card>
      )}
      
      {videoPath && (
        <Card>
          <h2>Step 5: Final Video</h2>
          <VideoPreview videoUrl={videoPath} />
        </Card>
      )}
    </Container>
  );
};

export default App;
