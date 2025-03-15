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

export const LyricsVideoContent: React.FC<Props> = ({ audioUrl, lyrics, durationInSeconds }) => {
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
      const transitionStart = currentLyric.end - TRANSITION_DURATION;
      if (currentTimeInSeconds >= transitionStart && activeLyricIndex < lyrics.length - 1) {
        const p = (currentTimeInSeconds - transitionStart) / TRANSITION_DURATION;
        const easedP = Easing.bezier(0.25, 0.1, 0.25, 1)(p); // Ease-in-out for smooth movement
        const currentOffset = activeLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
        const nextOffset = (activeLyricIndex + 1) * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
        return interpolate(easedP, [0, 1], [currentOffset, nextOffset], { 
          extrapolateLeft: 'clamp', 
          extrapolateRight: 'clamp' 
        });
      } else {
        return activeLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
      }
    } else {
      const nextLyricIndex = lyrics.findIndex(lyric => lyric.start > currentTimeInSeconds);
      if (nextLyricIndex >= 0) {
        return nextLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
      } else {
        return (lyrics.length - 1) * (LYRIC_HEIGHT + LYRIC_MARGIN) - BASE_POSITION;
      }
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

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #121212 0%, #060606 100%)',
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
        <div
          style={{
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
        <div
          style={{
            position: 'absolute',
            fontSize: '80px',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          ♪
        </div>
      </div>

      {/* Lyrics Container */}
      <div
        style={{
          width: '85%',
          textAlign: 'center',
          height: '100%',
          position: 'relative',
          marginLeft: ALBUM_COVER_SIZE + ALBUM_COVER_MARGIN * 2,
        }}
      >
        {lyrics?.map((lyric: LyricEntry, index: number) => {
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
          const isActive = index === activeLyricIndex;

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
                fontSize: '36px',
                fontFamily: "'Montserrat', 'Circular', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: isActive ? 700 : 400,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                whiteSpace: 'pre-wrap',
                letterSpacing: isActive ? '0.2px' : '0',
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
                <span
                  style={{
                    color: isActive ? '#1ED760' : index === activeLyricIndex - 1 || index === activeLyricIndex + 1 ? '#e6e6e6' : '#b3b3b3',
                  }}
                >
                  {lyric.text}
                </span>
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