import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig, Composition } from 'remotion';
import * as Remotion from 'remotion';

export interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

export interface LyricsVideoProps {
  audioUrl: string;
  lyrics: LyricEntry[];
  durationInSeconds: number;
}

export const LyricsVideoContent: React.FC<LyricsVideoProps> = ({ audioUrl, lyrics, durationInSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeInSeconds = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Audio src={audioUrl} />
      <div style={{ width: '80%', textAlign: 'center' }}>
        {lyrics.map((lyric, index) => {
          const fadeDuration = 0.2; // in seconds
          const opacity = interpolate(
            currentTimeInSeconds,
            [lyric.start - fadeDuration, lyric.start, lyric.end, lyric.end + fadeDuration],
            [0, 1, 1, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const scale = interpolate(
            currentTimeInSeconds,
            [lyric.start - fadeDuration, lyric.start, lyric.end, lyric.end + fadeDuration],
            [0.8, 1, 1, 0.8],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div 
              key={index} 
              style={{
                fontSize: 50,
                fontWeight: 'bold',
                color: 'white',
                opacity,
                transform: `scale(${scale})`,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                position: 'absolute',
                width: '100%',
                display: opacity > 0.01 ? 'block' : 'none',
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

interface LyricsVideoComponentProps {
  audioUrl?: string;
  lyrics?: LyricEntry[];
  durationInSeconds?: number;
}

// Use a type assertion to satisfy Remotion's component type requirements
const LyricsVideo: React.FC<LyricsVideoComponentProps> = ({ 
  audioUrl = '', 
  lyrics = [], 
  durationInSeconds = 0 
}) => {
  return (
    <div style={{ width: '100%', marginBottom: '20px' }}>
      <Composition
        id="lyrics-video"
        component={LyricsVideoContent as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={Math.max(30, durationInSeconds * 30)} // At least 1 second, 30 fps
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          audioUrl,
          lyrics,
          durationInSeconds,
        }}
      />
    </div>
  );
};

export default LyricsVideo;
