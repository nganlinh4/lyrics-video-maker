import React from 'react';
import { Composition } from 'remotion';
// Import the better styled component instead of the basic one
import { LyricsVideoContent } from '../components/LyricsVideo';

const sampleLyrics = [
  { start: 0, end: 2, text: "Welcome to" },
  { start: 2, end: 4, text: "Lyrics Video Maker" },
  { start: 4, end: 6, text: "Preview Mode" }
];

// For the sample preview mode, we'll use a short duration
const SAMPLE_DURATION_SECONDS = 10;
// For rendering, we'll use the actual duration passed in props

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="lyrics-video"
        // Use the beautiful component from components/LyricsVideo instead of the basic Composition
        component={LyricsVideoContent as React.FC}
        // Use 30fps and a dynamic duration from props, falling back to the sample duration
        durationInFrames={SAMPLE_DURATION_SECONDS * 30}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          audioUrl: '', // No audio in preview mode
          lyrics: sampleLyrics,
          durationInSeconds: SAMPLE_DURATION_SECONDS
        }}
      />
    </>
  );
};