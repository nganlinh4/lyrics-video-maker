import React from 'react';
import { Composition } from 'remotion';
import { LyricsVideoContent } from './Composition';
import { Props, VideoMetadata, LyricEntry } from '../types';

// Sample data for preview mode
const sampleLyrics: LyricEntry[] = [
  { start: 0, end: 2, text: "Welcome to" },
  { start: 2, end: 4, text: "Lyrics Video Maker" },
  { start: 4, end: 6, text: "Preview Mode" }
];

const defaultMetadata: VideoMetadata = {
  artist: 'Preview Artist',
  songTitle: 'Preview Song',
  videoType: 'Lyrics Video'
};

// Create a type-safe wrapper component
const VideoComponentWrapper: React.FC<Record<string, unknown>> = (props) => {
  // Ensure all required props are present with defaults
  const safeProps: Props = {
    audioUrl: (props.audioUrl as string) || '',
    lyrics: (props.lyrics as LyricEntry[]) || sampleLyrics,
    durationInSeconds: (props.durationInSeconds as number) || 6,
    metadata: (props.metadata as VideoMetadata) || defaultMetadata,
    albumArtUrl: props.albumArtUrl as string | undefined,
    backgroundImageUrl: props.backgroundImageUrl as string | undefined,
    instrumentalUrl: props.instrumentalUrl as string | undefined,
    vocalUrl: props.vocalUrl as string | undefined,
    littleVocalUrl: props.littleVocalUrl as string | undefined
  };
  
  return <LyricsVideoContent {...safeProps} />;
};

export const RemotionRoot: React.FC = () => {
  const commonProps = {
    component: VideoComponentWrapper,
    fps: 60,
    width: 1920,
    height: 1080,
    durationInFrames: 180
  };

  return (
    <>
      <Composition
        id="lyrics-video"
        {...commonProps}
        defaultProps={{
          audioUrl: '',
          lyrics: sampleLyrics,
          durationInSeconds: 6,
          metadata: { ...defaultMetadata, videoType: 'Lyrics Video' }
        }}
      />
      <Composition
        id="vocal-only"
        {...commonProps}
        defaultProps={{
          audioUrl: '',
          lyrics: sampleLyrics,
          durationInSeconds: 6,
          metadata: { ...defaultMetadata, videoType: 'Vocal Only' }
        }}
      />
      <Composition
        id="instrumental-only"
        {...commonProps}
        defaultProps={{
          audioUrl: '',
          lyrics: sampleLyrics,
          durationInSeconds: 6,
          metadata: { ...defaultMetadata, videoType: 'Instrumental Only' }
        }}
      />
      <Composition
        id="little-vocal"
        {...commonProps}
        defaultProps={{
          audioUrl: '',
          lyrics: sampleLyrics,
          durationInSeconds: 6,
          metadata: { ...defaultMetadata, videoType: 'Little Vocal' }
        }}
      />
    </>
  );
};