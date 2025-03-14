import React, { useState, useEffect } from 'react';
import AudioUpload from './components/AudioUpload.tsx';
import LyricsUpload from './components/LyricsUpload.tsx';
import LyricsVideo from './components/LyricsVideo.tsx';
import VideoPreview from './components/VideoPreview.tsx';
import styled from 'styled-components';

interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

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

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [generateVideo, setGenerateVideo] = useState(false);

  const handleAudioUpload = (file: File | null) => {
    setAudioFile(file);
  };

  const handleLyricsUpload = (lyricsData: LyricEntry[] | null) => {
    setLyrics(lyricsData);
  };

  const handleGenerateVideo = () => {
    if (audioFile && lyrics) {
      setGenerateVideo(true);
    } else {
      alert('Please upload both audio and lyrics files.');
    }
  };

  useEffect(() => {
    if (generateVideo) {
      const audioUrl = URL.createObjectURL(audioFile!);
      const inputProps = {
        audioUrl,
        lyrics,
      };
      const command = `npx remotion render src/remotion/root.tsx out.mp4 --props='${JSON.stringify(inputProps)}'`;
      
      // Placeholder for execute_command tool use.  I cannot directly call the tool here.
      console.log("Executing command:", command);

      setGenerateVideo(false); // Reset the state
    }
  }, [generateVideo, audioFile, lyrics]);

  return (
    <Container>
      <Title>Lyrics Video Maker</Title>
      <AudioUpload onAudioUpload={handleAudioUpload} />
      <LyricsUpload onLyricsUpload={handleLyricsUpload} />
      {audioFile && lyrics && (
        <>
          <LyricsVideo />
          <Button onClick={handleGenerateVideo}>Generate Video</Button>
          {/* <VideoPreview videoUrl={videoUrl} />  */}
        </>
      )}
    </Container>
  );
};

export default App;