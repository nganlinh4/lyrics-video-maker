import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig, Easing } from 'remotion';
import { LyricEntry, Props } from '../types';

// Spotify-inspired constants
const LYRIC_HEIGHT = 65; // Height of each lyric line
const LYRIC_MARGIN = 24; // Spacing between lines
const TRANSITION_DURATION = 0.5; // Duration in seconds for lyric transitions
const BASE_POSITION = 720 / 2 - 30; // Center position (adjusted from height / 2 + CENTER_OFFSET)
const ALBUM_COVER_SIZE = 300; // Size of the album cover
const ALBUM_COVER_MARGIN = 40; // Margin from the left edge

// New styling constants
const INACTIVE_FONT_SIZE = 36;
const ACTIVE_FONT_SIZE = 40;
const INACTIVE_COLOR = [255, 255, 255];
const ACTIVE_COLOR = [30, 215, 96];
// Removed INACTIVE_FONT_WEIGHT and ACTIVE_FONT_WEIGHT

// Function to interpolate RGB colors
const interpolateColor = (progress: number, from: number[], to: number[]) => {
  const r = interpolate(progress, [0, 1], [from[0], to[0]], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const g = interpolate(progress, [0, 1], [from[1], to[1]], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const b = interpolate(progress, [0, 1], [from[2], to[2]], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

export const LyricsComponent: React.FC<{ lyrics: LyricEntry[] }> = ({ lyrics }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;1,400&display=swap"
        rel="stylesheet"
      />
      {lyrics.map((lyric, index) => {
        const TRANSITION_DURATION = 0.5;
        let progress = 0;

        if (currentTimeInSeconds < lyric.start - TRANSITION_DURATION) {
          progress = 0;
        } else if (currentTimeInSeconds <= lyric.start) {
          progress = (currentTimeInSeconds - (lyric.start - TRANSITION_DURATION)) / TRANSITION_DURATION;
        } else if (currentTimeInSeconds < lyric.end) {
          progress = 1;
        } else if (currentTimeInSeconds <= lyric.end + TRANSITION_DURATION) {
          progress = 1 - (currentTimeInSeconds - lyric.end) / TRANSITION_DURATION;
        }

        return (
          <div
            key={index}
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 400, // Keep constant font weight
              maxWidth: '800px', // Add this to limit line width
              margin: '0 auto', // Center the text if it's shorter than maxWidth
              whiteSpace: 'pre-wrap', // Handle line breaks properly
              wordWrap: 'break-word', // Break long words if necessary
            }}
          >
            {lyric.text}
          </div>
        );
      })}
    </div>
  );
};

export const LyricsVideoContent: React.FC<Props> = ({ audioUrl, lyrics, durationInSeconds, albumArtUrl, backgroundImageUrl }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;

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

  // Album cover floating animation
  const albumCoverOffset = useMemo(() => {
    return Math.sin(frame / (fps * 2) * Math.PI) * 5; // 5px movement over 4 seconds
  }, [frame, fps]);

  // Background pulse effect
  const backgroundPulse = useMemo(() => {
    return interpolate(Math.sin(frame / fps * 2 * Math.PI), [-1, 1], [0.03, 0.06]);
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
        background: backgroundImageUrl 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${backgroundImageUrl})` 
          : 'linear-gradient(180deg, #121212 0%, #060606 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {audioUrl && <Audio src={audioUrl} />}

      {/* Animated background gradient pulse */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(
            circle at ${width / 2}px ${BASE_POSITION}px,
            rgba(30, 215, 96, ${backgroundPulse}),
            transparent 70%
          )`,
        }}
      />

      {/* Album Cover */}
      <div
        style={{
          position: 'absolute',
          left: ALBUM_COVER_MARGIN,
          top: `calc(50% - ${ALBUM_COVER_SIZE / 2}px)`,
          transform: `translateY(${albumCoverOffset}px)`,
          width: ALBUM_COVER_SIZE,
          height: ALBUM_COVER_SIZE,
          backgroundColor: 'rgba(30, 30, 30, 0.6)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
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

      {/* Lyrics Container */}
      <div
        style={{
          width: '85%',  // You can adjust this percentage
          maxWidth: '900px', // Add this to set a maximum width
          textAlign: 'center',
          height: '100%',
          position: 'relative',
          marginLeft: ALBUM_COVER_SIZE + ALBUM_COVER_MARGIN * 2,
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
          
          const opacity = interpolate(distance, [0, 200], [1, 0.3], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
          });

          const fontSize = interpolate(progress, [0, 1], [INACTIVE_FONT_SIZE, ACTIVE_FONT_SIZE], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const color = interpolateColor(progress, INACTIVE_COLOR, ACTIVE_COLOR);
          // Removed fontWeight calculation

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
                fontFamily: "'Montserrat', 'Circular', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 400, // Keep constant font weight
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

      {/* Subtle vignette effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: 'inset 0 0 150px rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
