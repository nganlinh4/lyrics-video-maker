import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig, Composition} from 'remotion';
import * as Remotion from 'remotion';

interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

interface InputProps {
  audioUrl: string;
  lyrics: LyricEntry[];
}

const LyricsContent: React.FC = () => {
  const { audioUrl, lyrics, ...videoConfig } = useVideoConfig() as InputProps & Remotion.VideoConfig;
  const frame = useCurrentFrame();
  const fps = 30;

  return (
    <AbsoluteFill>
      <Audio src={audioUrl} />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        {lyrics.map((lyric, index) => {
          const fadeDuration = 5;
          const opacity = interpolate(
            frame,
            [lyric.start * fps - fadeDuration, lyric.start * fps, lyric.end * fps, lyric.end * fps + fadeDuration],
            [0, 1, 1, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );
          return (
            <div key={index} style={{
              fontSize: 50,
              color: 'white',
              opacity,
            }}>{lyric.text}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const LyricsVideo: React.FC = () => {
 // No need for useVideoConfig here
  return (
    <Composition
      id="lyrics-video"
      component={LyricsContent}
      durationInFrames={150}
      fps={30}
 // Default FPS
      width={1280} // Default widt}
      height={720} // Default height
    />
  );
};

export default LyricsVideo;
