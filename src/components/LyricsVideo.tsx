import React, { useMemo, useState, useEffect } from 'react';
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

const ParticleBackground: React.FC<{ albumArtUrl?: string }> = ({ albumArtUrl }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const particleCount = 45;

  // Get average color from album art
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
  
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map(() => ({
      size: 3 + Math.random() * 8,
      speedX: 0.1 + Math.random() * 0.4,
      speedY: 0.1 + Math.random() * 0.4,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      amplitudeX: 10 + Math.random() * 40,
      amplitudeY: 10 + Math.random() * 40,
      opacitySpeed: 0.1 + Math.random() * 0.3,
      opacityPhase: Math.random() * Math.PI * 2,
      isAccent: Math.random() < 0.25, // 25% chance of using accent color
      glowSize: 10 + Math.random() * 15,
      glowOpacity: 0.2 + Math.random() * 0.3,
    }));
  }, [width, height]);
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      {particles.map((particle, i) => {
        const x = particle.baseX + 
          Math.sin((frame / fps) * particle.speedX + particle.phaseX) * particle.amplitudeX;
        const y = particle.baseY + 
          Math.sin((frame / fps) * particle.speedY + particle.phaseY) * particle.amplitudeY;
        
        const opacity = 0.3 + 
          Math.sin((frame / fps) * particle.opacitySpeed + particle.opacityPhase) * 0.2;

        const [r, g, b] = accentColor;
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: '50%',
              backgroundColor: particle.isAccent ? `rgb(${r}, ${g}, ${b})` : 'white',
              opacity,
              transform: `translate(${x}px, ${y}px)`,
              boxShadow: particle.isAccent 
                ? `0 0 ${particle.glowSize}px ${particle.glowSize/2}px rgba(${r}, ${g}, ${b}, ${particle.glowOpacity})` 
                : `0 0 ${particle.glowSize}px ${particle.glowSize/2}px rgba(255, 255, 255, ${particle.glowOpacity})`,
            }}
          />
        );
      })}
    </div>
  );
};

export const LyricsVideoContent: React.FC<Props> = ({ audioUrl, lyrics, durationInSeconds, albumArtUrl, backgroundImageUrl }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;

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

  // Album cover floating animation
  const albumCoverOffset = useMemo(() => {
    return Math.sin(frame / (fps * 5) * Math.PI) * 5; // 5px movement over 4 seconds
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
        backgroundColor: '#000',
        backgroundImage: backgroundImageUrl 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${backgroundImageUrl})` 
          : 'linear-gradient(180deg, #121212 0%, #060606 100%)',
        backgroundSize: 'cover',
        backgroundPosition: `calc(50% + ${parallaxOffset}px) center`,
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Base layer */}
      <ParticleBackground albumArtUrl={albumArtUrl} />
      {audioUrl && <Audio src={audioUrl} />}

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
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
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

        {/* Lyrics Container */}
        <div
          style={{
            width: '85%',
            maxWidth: '900px',
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
