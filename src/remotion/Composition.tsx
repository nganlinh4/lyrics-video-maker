import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig } from 'remotion';
import { LyricsVideoContent } from '../components/LyricsVideo';
import { LyricEntry, VideoMetadata } from '../types';

interface Props {
  audioUrl: string;
  lyrics: LyricEntry[];
  durationInSeconds: number;
  albumArtUrl?: string;
  backgroundImageUrl?: string;
  metadata?: VideoMetadata; // Make metadata optional again to match what might come from the server
  instrumentalUrl?: string;
  vocalUrl?: string;
  littleVocalUrl?: string;
}

// Default metadata to use if none is provided
const DEFAULT_METADATA: VideoMetadata = {
  artist: 'Unknown Artist',
  songTitle: 'Unknown Song',
  videoType: 'Lyrics Video'
};

export const LyricsComposition: React.FC<Props> = (props) => {
  // Create a new props object with the metadata defaulted if it's undefined
  const enhancedProps = {
    ...props,
    metadata: props.metadata || DEFAULT_METADATA
  };
  
  // Pass the enhanced props to the LyricsVideoContent component
  return <LyricsVideoContent {...enhancedProps} />;
};
