import React, { useState } from 'react';
import styled from 'styled-components';
import remotionService, { RenderProgress } from '../services/remotionService';
import { LyricEntry } from './LyricsVideo';

const Container = styled.div`
  margin: 20px 0;
  padding: 15px;
  border-radius: 8px;
  background-color: #f5f5f5;
  width: 100%;
  max-width: 800px;
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 20px;
  background-color: #ddd;
  border-radius: 10px;
  margin: 15px 0;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  border-radius: 10px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 14px;
  margin: 5px 0;
  color: #555;
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
  margin-top: 10px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
  margin: 10px 0;
  color: ${props => props.isError ? '#d32f2f' : '#2e7d32'};
  font-weight: bold;
`;

interface RenderControlProps {
  audioFile: File | null;
  lyrics: LyricEntry[] | null;
  onRenderComplete: (videoPath: string) => void;
}

const RenderControl: React.FC<RenderControlProps> = ({ audioFile, lyrics, onRenderComplete }) => {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRender = async () => {
    if (!audioFile || !lyrics) {
      setErrorMessage('Audio file and lyrics are required');
      return;
    }

    setIsRendering(true);
    setErrorMessage(null);
    
    try {
      const audioUrl = URL.createObjectURL(audioFile);
      
      const videoPath = await remotionService.renderVideo(audioUrl, lyrics, (progress) => {
        setProgress(progress);
        
        if (progress.status === 'error') {
          setErrorMessage(progress.error || 'An error occurred during rendering');
          setIsRendering(false);
        }
      });
      
      // Cleanup the object URL
      URL.revokeObjectURL(audioUrl);
      
      setIsRendering(false);
      onRenderComplete(videoPath);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred during rendering');
      setIsRendering(false);
    }
  };

  return (
    <Container>
      <h3>Render Lyrics Video</h3>
      
      {progress && (
        <>
          <ProgressContainer>
            <ProgressBar width={progress.progress * 100} />
          </ProgressContainer>
          <ProgressText>
            {`Rendering: ${Math.round(progress.progress * 100)}% (${progress.renderedFrames}/${progress.durationInFrames} frames)`}
          </ProgressText>
        </>
      )}
      
      {errorMessage && (
        <StatusMessage isError>{errorMessage}</StatusMessage>
      )}
      
      {progress?.status === 'success' && (
        <StatusMessage>Rendering completed successfully!</StatusMessage>
      )}
      
      <Button 
        onClick={handleRender} 
        disabled={isRendering || !audioFile || !lyrics}
      >
        {isRendering ? 'Rendering...' : 'Render Video'}
      </Button>
    </Container>
  );
};

export default RenderControl;