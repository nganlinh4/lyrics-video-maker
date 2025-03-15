import React from 'react';
import { Composition } from 'remotion';
import { LyricsComposition } from './Composition';

const sampleLyrics = [
  { start: 0, end: 2, text: "Welcome to" },
  { start: 2, end: 4, text: "Lyrics Video Maker" },
  { start: 4, end: 6, text: "Preview Mode" }
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="lyrics-video"
        component={LyricsComposition as React.FC}
        durationInFrames={300} // 10 seconds at 30fps
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          audioUrl: '', // No audio in preview mode
          lyrics: sampleLyrics,
          durationInSeconds: 10
        }}
      />
    </>
  );
};