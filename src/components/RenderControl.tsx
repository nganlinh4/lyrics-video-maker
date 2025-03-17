import React, { useState } from 'react';
import styled from 'styled-components';
import { Player } from '@remotion/player';
import { LyricEntry } from '../types';
import { LyricsVideoContent } from './LyricsVideo';
import remotionService from '../services/remotionService';

const Container = styled.div`
  margin: 20px 0;
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
  background-color: #f0f0f0;
  border-radius: 10px;
  margin: 10px 0;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  width: ${props => props.width}%;
  height: 100%;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  margin: 5px 0;
  color: #666;
`;

const InfoText = styled.div`
  margin: 10px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  color: #666;
`;

interface Props {
  audioFile: File | null;
  lyrics: LyricEntry[] | null;
  durationInSeconds: number;
  onRenderComplete: (videoPath: string) => void;
}

export const RenderControl: React.FC<Props> = ({
  audioFile,
  lyrics,
  durationInSeconds,
  onRenderComplete
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      const videoPath = await remotionService.renderVideo(
        audioFile,
        lyrics,
        durationInSeconds, // Pass the actual audio duration
        (progress) => {
          if (progress.status === 'error') {
            setError(progress.error || 'An error occurred during rendering');
            setIsRendering(false);
          } else {
            setProgress(progress.progress);
          }
        }
      );

      setIsRendering(false);
      onRenderComplete(videoPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRendering(false);
    }
  };

  return (
    <Container>
      <InfoText>
        Note: This is a preview environment. Video rendering requires a server-side component. 
        The preview above shows how your video will look, but downloading the final video 
        is not available in this browser-only version.
      </InfoText>
      <Button
        onClick={handleRender}
        disabled={isRendering || !audioFile || !lyrics}
      >
        {isRendering ? 'Rendering...' : 'Render Video'}
      </Button>
      {isRendering && (
        <>
          <ProgressContainer>
            <ProgressBar width={progress * 100} />
          </ProgressContainer>
          <ProgressText>
            {Math.round(progress * 100)}% Complete
          </ProgressText>
        </>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </Container>
  );
};
