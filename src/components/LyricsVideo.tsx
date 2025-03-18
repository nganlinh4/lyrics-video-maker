import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig, Easing } from 'remotion';
import { LyricEntry, VideoMetadata } from '../types';
import styled from 'styled-components';

// Font-related constants
const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// Spotify-inspired constants (scaled up by 1.5 for 1080p)
const LYRIC_HEIGHT = 98; // Increased from 65
const LYRIC_MARGIN = 36; // Increased from 24
const TRANSITION_DURATION = 0.5;
const BASE_POSITION = 1080 / 2 - 45; // Adjusted for new height
const ALBUM_COVER_SIZE = 450; // Increased from 300
const ALBUM_COVER_MARGIN = 165; // Increased from 110

// Styling constants (scaled up for 1080p)
const INACTIVE_FONT_SIZE = 54; // Increased from 36
const ACTIVE_FONT_SIZE = 60; // Increased from 40
const INACTIVE_COLOR = [255, 255, 255];
const ACTIVE_COLOR = [30, 215, 96];
const INACTIVE_WEIGHT = 400;
const ACTIVE_WEIGHT = 700;

// Utility function to get average color from an image
const getAverageColor = (imgElement: HTMLImageElement): number[] => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return [30, 215, 96]; // Fallback to default green

  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  context.drawImage(imgElement, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let r = 0, g = 0, b = 0, count = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    r += imageData[i];
    g += imageData[i + 1];
    b += imageData[i + 2];
    count++;
  }

  return [
    Math.round(r / count),
    Math.round(g / count),
    Math.round(b / count)
  ];
};

// Function to interpolate RGB colors
const interpolateColor = (progress: number, from: number[], to: number[]) => {
  const r = interpolate(progress, [0, 1], [from[0], to[0]], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const g = interpolate(progress, [0, 1], [from[1], to[1]], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b = interpolate(progress, [0, 1], [from[2], to[2]], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

export interface Props {
  audioUrl: string;
  lyrics: LyricEntry[];
  durationInSeconds: number;
  albumArtUrl?: string;
  backgroundImageUrl?: string;
  metadata: VideoMetadata;
  instrumentalUrl?: string;
  vocalUrl?: string;
  littleVocalUrl?: string; // Added new option for pre-mixed Little Vocal audio
}

interface AudioConfig {
  src: string;
  volume: number;
}

export const LyricsVideoContent: React.FC<Props> = ({
  audioUrl,
  instrumentalUrl,
  vocalUrl,
  littleVocalUrl,
  lyrics,
  durationInSeconds,
  albumArtUrl,
  backgroundImageUrl,
  metadata
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;

  const getAudioConfig = useCallback(() => {
    // Return appropriate audio configuration based on video type
    switch (metadata.videoType) {
      case 'Vocal Only':
        // For Vocal Only, use vocal track if available, otherwise use main audio
        return vocalUrl ? [{ src: vocalUrl, volume: 1 }] : (audioUrl ? [{ src: audioUrl, volume: 1 }] : []);
      
      case 'Instrumental Only':
        // For Instrumental Only, use instrumental track if available, otherwise use main audio
        return instrumentalUrl ? [{ src: instrumentalUrl, volume: 1 }] : (audioUrl ? [{ src: audioUrl, volume: 1 }] : []);
      
      case 'Little Vocal':
        if (littleVocalUrl) {
          // Use pre-mixed little vocal track if available
          return [{ src: littleVocalUrl, volume: 1 }];
        } else if (instrumentalUrl && vocalUrl) {
          // Otherwise mix instrumental and vocal tracks
          return [
            { src: instrumentalUrl, volume: 1 },
            { src: vocalUrl, volume: 0.12 }
          ];
        } else {
          // Fallback to main audio
          return audioUrl ? [{ src: audioUrl, volume: 1 }] : [];
        }
      
      case 'Lyrics Video':
      default:
        // For standard lyrics video, use main audio track
        return audioUrl ? [{ src: audioUrl, volume: 1 }] : [];
    }
  }, [metadata.videoType, audioUrl, instrumentalUrl, vocalUrl, littleVocalUrl]);

  // Memoize metadata component - move to above album art and center align
  const MetadataDisplay = useMemo(() => (
    <MetadataContainer>
      <ArtistName>{metadata.artist}</ArtistName>
      <SongTitle>{metadata.songTitle}</SongTitle>
    </MetadataContainer>
  ), [metadata.artist, metadata.songTitle]);

  // Move accentColor state up to parent component
  const [accentColor, setAccentColor] = useState<number[]>([30, 215, 96]); // Default to Spotify green

  useEffect(() => {
    if (albumArtUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const color = getAverageColor(img);
        setAccentColor(color);
      };
      img.src = albumArtUrl;
    }
  }, [albumArtUrl]);

  // Audio reactivity effect
  const audioReactiveEffect = useMemo(() => {
    return Math.abs(Math.sin(frame / (fps * 0.8)) * 0.5) + 0.5;
  }, [frame, fps]);

  // Parallax effect
  const parallaxOffset = useMemo(() => {
    return Math.sin(frame / fps * 0.2) * 10;
  }, [frame, fps]);

  // Find the active lyric index
  const activeLyricIndex = useMemo(() => {
    return lyrics?.findIndex(
      (lyric) => currentTimeInSeconds >= lyric.start && currentTimeInSeconds <= lyric.end
    ) ?? -1;
  }, [lyrics, currentTimeInSeconds]);

  // Calculate scroll offset with smooth transition
  const scrollOffset = useMemo(() => {
    if (activeLyricIndex >= 0) {
      const currentLyric = lyrics[activeLyricIndex];
      const currentOffset = activeLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
      if (activeLyricIndex < lyrics.length - 1) {
        const nextLyric = lyrics[activeLyricIndex + 1];
        const nextOffset = (activeLyricIndex + 1) * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
        const transitionCenter = (currentLyric.end + nextLyric.start) / 2;
        const transitionStart = transitionCenter - TRANSITION_DURATION / 2;
        const transitionEnd = transitionCenter + TRANSITION_DURATION / 2;
        if (currentTimeInSeconds >= transitionStart && currentTimeInSeconds <= transitionEnd) {
          const p = (currentTimeInSeconds - transitionStart) / TRANSITION_DURATION;
          const easedP = Easing.bezier(0.25, 0.1, 0.25, 1)(p);
          return interpolate(easedP, [0, 1], [currentOffset, nextOffset], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        }
        return currentOffset;
      }
      return currentOffset;
    } else {
      // Find previous and next lyrics during the gap
      const previousLyricIndex = lyrics.reduce((prev, curr, i) => 
        curr.end <= currentTimeInSeconds && (prev === -1 || lyrics[prev].end < curr.end) ? i : prev, -1);
      const nextLyricIndex = lyrics.findIndex(lyric => lyric.start > currentTimeInSeconds);
      if (previousLyricIndex >= 0 && nextLyricIndex >= 0) {
        const previousLyric = lyrics[previousLyricIndex];
        const nextLyric = lyrics[nextLyricIndex];
        const previousOffset = previousLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
        const nextOffset = nextLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
        const transitionCenter = (previousLyric.end + nextLyric.start) / 2;
        const transitionStart = transitionCenter - TRANSITION_DURATION / 2;
        const transitionEnd = transitionCenter + TRANSITION_DURATION / 2;
        if (currentTimeInSeconds >= transitionStart && currentTimeInSeconds <= transitionEnd) {
          const p = (currentTimeInSeconds - transitionStart) / TRANSITION_DURATION;
          const easedP = Easing.bezier(0.25, 0.1, 0.25, 1)(p);
          return interpolate(easedP, [0, 1], [previousOffset, nextOffset], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        }
        return currentTimeInSeconds < transitionCenter ? previousOffset : nextOffset;
      }
      return nextLyricIndex >= 0 ? nextLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION : 
        (lyrics.length - 1) * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
    }
  }, [activeLyricIndex, currentTimeInSeconds, lyrics]);

  // Abum cover floating animation
  const albumCoverOffset = useMemo(() => {
    return Math.sin(frame / (fps * 5) * Math.PI) * 5; // 5px movement over 4 seconds
  }, [frame, fps]);

  // Background pulse effect
  const backgroundPulse = useMemo(() => {
    return interpolate(Math.sin(frame / fps * 0.2 * Math.PI), [-1, 1], [0.03, 0.06]);
  }, [frame, fps]);

  // Calculate transition progress for each lyric
  const getLyricProgress = (lyric: LyricEntry, currentTime: number) => {
    if (currentTime < lyric.start - TRANSITION_DURATION) {
      return 0;
    } else if (currentTime >= lyric.start - TRANSITION_DURATION && currentTime <= lyric.start) {
      return (currentTime - (lyric.start - TRANSITION_DURATION)) / TRANSITION_DURATION;
    } else if (currentTime > lyric.start && currentTime < lyric.end) {
      return 1;
    } else if (currentTime >= lyric.end && currentTime <= lyric.end + TRANSITION_DURATION) {
      return 1 - (currentTime - lyric.end) / TRANSITION_DURATION;
    }
    return 0;
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        backgroundImage: backgroundImageUrl 
          ? `linear-gradient(rgba(0, 0, 0, ${0.4 + backgroundPulse}), rgba(0, 0, 0, ${0.5 + backgroundPulse})), url(${backgroundImageUrl})` 
          : 'linear-gradient(180deg, #121212 0%, #060606 100%)',
        backgroundSize: 'cover',
        backgroundPosition: `calc(50% + ${parallaxOffset}px) center`,
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: FONT_FAMILY
      }}
    >
      {/* Moving font loading to the top level */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" 
        rel="stylesheet" 
      />
      
      {/* Audio elements */}
      {getAudioConfig().map((audio: AudioConfig, index: number) => {
        console.log('Rendering audio element:', { type: metadata.videoType, src: audio.src, volume: audio.volume });
        return (
          <Audio 
            key={`audio-${metadata.videoType}-${audio.src}-${index}`}
            src={audio.src}
            volume={audio.volume}
            playbackRate={1}
            muted={false}
          />
        );
      })}

      {/* Background effects layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: `blur(${2 + audioReactiveEffect * 4}px)`,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          zIndex: 1,
        }}
      />

      {/* Content layer */}
      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>
        {/* Centered Metadata above album art */}
        <CenteredMetadataContainer>
          <ArtistName>{metadata.artist}</ArtistName>
          <SongTitle>{metadata.songTitle}</SongTitle>
        </CenteredMetadataContainer>

        {/* Album Cover with Video Type below it */}
        <AlbumCoverContainer>
          <div
            style={{
              position: 'relative',
              width: ALBUM_COVER_SIZE,
              height: ALBUM_COVER_SIZE,
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              borderRadius: '8px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transform: `translateY(${albumCoverOffset}px)`,
            }}
          >
            {albumArtUrl ? (
              <img
                src={albumArtUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                }}
                alt="Album Art"
              />
            ) : (
              <>
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(45deg, 
                      rgba(40, 40, 40, 0.6) 25%, 
                      rgba(60, 60, 60, 0.6) 25%, 
                      rgba(60, 60, 60, 0.6) 50%, 
                      rgba(40, 40, 40, 0.6) 50%, 
                      rgba(40, 40, 40, 0.6) 75%, 
                      rgba(60, 60, 60, 0.6) 75%)`,
                    backgroundSize: '40px 40px',
                    opacity: 0.8,
                  }}
                 />
                <div style={{position: 'absolute', fontSize: '80px', color: 'rgba(255, 255, 255, 0.3)'}}>♪</div>
              </>
            )}
          </div>
          <VideoTypeLabel>{metadata.videoType}</VideoTypeLabel>
        </AlbumCoverContainer>

        {/* Lyrics Container */}
        <div
          style={{
            width: '85%',
            maxWidth: '1350px', // Increased from 900
            textAlign: 'center',
            height: '100%',
            position: 'relative',
            marginLeft: 600, // Increased from 400
          }}
        >
          {lyrics?.map((lyric: LyricEntry, index: number) => {
            const progress = getLyricProgress(lyric, currentTimeInSeconds);
            const naturalPosition = index * (LYRIC_HEIGHT + LYRIC_MARGIN);
            const position = naturalPosition - scrollOffset;
            const distance = Math.abs(position - BASE_POSITION);
            
            const scale = interpolate(distance, [0, 150], [1.08, 0.92], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            });
            
            const opacity = interpolate(distance, [0, 150, 350], [1, 0.3, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            });

            const fontSize = interpolate(progress, [0, 1], [INACTIVE_FONT_SIZE, ACTIVE_FONT_SIZE], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            const fontWeight = interpolate(progress, [0, 1], [INACTIVE_WEIGHT, ACTIVE_WEIGHT], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            const color = interpolateColor(progress, INACTIVE_COLOR, ACTIVE_COLOR);

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  width: '100%',
                  left: '50%',
                  top: 0,
                  opacity,
                  transform: `translate(-50%, ${position}px) scale(${scale})`,
                  fontSize: `${fontSize}px`,
                  fontFamily: FONT_FAMILY,
                  fontWeight,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  whiteSpace: 'pre-wrap',
                  letterSpacing: '0',
                  userSelect: 'none',
                  zIndex: 100 - Math.abs(activeLyricIndex - index),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    maxWidth: '90%',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ color }}>{lyric.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlay effects layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: 'inset 0 0 150px rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

    </AbsoluteFill>
  );
};

// Update styled components and add new ones
const MetadataContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

const CenteredMetadataContainer = styled.div`
  position: absolute;
  top: calc(50% - ${ALBUM_COVER_SIZE / 2}px - 155px); /* Position 80px above album art */
  left: ${ALBUM_COVER_MARGIN}px;
  width: ${ALBUM_COVER_SIZE}px;
  text-align: center;
  z-index: 2;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
`;

const AlbumCoverContainer = styled.div`
  position: absolute;
  left: ${ALBUM_COVER_MARGIN}px;
  top: calc(50% - ${ALBUM_COVER_SIZE / 2}px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const VideoTypeLabel = styled.div`
  color: white;
  font-family: ${FONT_FAMILY};
  font-size: 35px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  padding: 6px 15px;
`;

const ArtistName = styled.h2`
  font-size: 48px; // Increased from 24px
  margin: 0;
  font-weight: 600;
  opacity: 0.9;
`;

const SongTitle = styled.h1`
  font-size: 48px;
  margin: 5px 0;
  font-weight: 700;
`;
