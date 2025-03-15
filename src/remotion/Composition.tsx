import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig } from 'remotion';

export interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

interface Props {
  audioUrl: string;
  lyrics: LyricEntry[];
  durationInSeconds: number;
}

export const LyricsComposition: React.FC<Props> = ({ audioUrl, lyrics, durationInSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;

  return (
    <AbsoluteFill 
      style={{ 
        backgroundColor: 'black', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <Audio src={audioUrl} />
      <div style={{ width: '80%', textAlign: 'center' }}>
        {lyrics.map((lyric, index) => {
          const fadeDuration = 0.2;
          const opacity = interpolate(
            currentTimeInSeconds,
            [
              lyric.start - fadeDuration,
              lyric.start,
              lyric.end,
              lyric.end + fadeDuration
            ],
            [0, 1, 1, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div
              key={index}
              style={{
                opacity,
                fontSize: '48px',
                color: 'white',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                position: 'absolute',
                width: '100%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {lyric.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
