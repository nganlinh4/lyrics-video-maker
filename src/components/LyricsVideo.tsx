import React, { useEffect, useState, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig, Composition, Easing } from 'remotion';
import { LyricEntry, Props } from '../types';

// Spotify-inspired constants
const LYRIC_HEIGHT = 65; // Slightly increased for better readability
const LYRIC_MARGIN = 24; // More spacing between lines
const SCROLL_SPEED = 10; // Smoother, more gentle scrolling
const LINE_TRANSITION = 0.3; // Duration of transition effects in seconds
const CENTER_OFFSET = -30; // Move center position slightly up for better visual balance

export const LyricsVideoContent: React.FC<Props> = ({ audioFile, lyrics, durationInSeconds }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Get the index of the current active lyric
  const activeLyricIndex = useMemo(() => {
    return lyrics?.findIndex(
      (lyric) => currentTimeInSeconds >= lyric.start && currentTimeInSeconds <= lyric.end
    ) ?? -1;
  }, [lyrics, currentTimeInSeconds]);

  useEffect(() => {
    if (!audioFile || audioFile.size === 0) return;

    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [audioFile]);

  // Calculate the progress percentage of the current active lyric
  const getActiveProgress = (lyric: LyricEntry) => {
    if (currentTimeInSeconds < lyric.start || currentTimeInSeconds > lyric.end) return 0;
    
    const totalDuration = lyric.end - lyric.start;
    const elapsed = currentTimeInSeconds - lyric.start;
    return Math.min(elapsed / totalDuration, 1);
  };

  // Calculate the position of each lyric line
  const calculatePosition = (index: number) => {
    const basePosition = height / 2 + CENTER_OFFSET;
    
    // If no active lyric, center the next upcoming lyric
    if (activeLyricIndex === -1) {
      const nextLyricIndex = lyrics?.findIndex(lyric => lyric.start > currentTimeInSeconds) ?? -1;
      if (nextLyricIndex === index) {
        return basePosition;
      }
      return basePosition + (index - nextLyricIndex) * (LYRIC_HEIGHT + LYRIC_MARGIN);
    }
    
    // Calculate offset from active lyric
    const offset = (index - activeLyricIndex) * (LYRIC_HEIGHT + LYRIC_MARGIN);
    
    // Apply smooth interpolation for scrolling effect
    const scrollProgress = interpolate(
      currentTimeInSeconds,
      [lyrics[activeLyricIndex].start, lyrics[activeLyricIndex].end],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }
    );
    
    // Additional subtle adjustment to create smoother scrolling before transition
    const smoothOffset = activeLyricIndex < lyrics.length - 1 && index > activeLyricIndex
      ? interpolate(
          scrollProgress,
          [0.8, 1],
          [0, -LYRIC_MARGIN / 2],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
      : 0;
    
    return basePosition + offset + smoothOffset;
  };

  // Calculate text scale based on whether the lyric is active
  const getTextScale = (index: number) => {
    const isActive = index === activeLyricIndex;
    const willBeActive = index === activeLyricIndex + 1;
    const wasActive = index === activeLyricIndex - 1;
    
    if (isActive) return 1.08; // Slightly larger for active lyrics
    if (willBeActive || wasActive) return 1; // Normal size for adjacent lyrics
    return 0.92; // Slightly smaller for inactive lyrics
  };

  // Calculate opacity based on distance from active lyric
  const getOpacity = (index: number) => {
    const distance = Math.abs(index - activeLyricIndex);
    
    if (activeLyricIndex === -1) {
      // Before any lyrics are active
      const nextLyricIndex = lyrics?.findIndex(lyric => lyric.start > currentTimeInSeconds) ?? -1;
      if (nextLyricIndex === -1) return 0.4; // No upcoming lyrics
      
      const distanceFromNext = Math.abs(index - nextLyricIndex);
      return interpolate(distanceFromNext, [0, 3], [0.8, 0.3], {
        extrapolateRight: 'clamp',
      });
    }
    
    return interpolate(distance, [0, 3], [1, 0.3], {
      extrapolateRight: 'clamp',
    });
  };

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
            circle at ${width/2}px ${height/2 + CENTER_OFFSET}px,
            rgba(30, 215, 96, ${interpolate(
              Math.sin(currentTimeInSeconds * 2), 
              [-1, 1], 
              [0.03, 0.06]
            )}),
            transparent 70%
          )`,
        }}
      />
      
      {/* Subtle grid texture overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          opacity: 0.3,
        }}
      />
      
      <div style={{ width: '85%', textAlign: 'center', height: '100%', position: 'relative' }}>
        {lyrics?.map((lyric: LyricEntry, index: number) => {
          const isActive = index === activeLyricIndex;
          const position = calculatePosition(index);
          const scale = getTextScale(index);
          const opacity = getOpacity(index);
          const progress = isActive ? getActiveProgress(lyric) : 0;

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
                transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
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
              {/* The text container */}
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
                {/* Active lyric highlight effect */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${progress * 100}%`,
                      background: 'linear-gradient(90deg, rgba(30, 215, 96, 0.2) 0%, rgba(30, 215, 96, 0.05) 100%)',
                      transition: 'width 0.1s linear',
                      borderRadius: '4px',
                      zIndex: -1,
                    }}
                  />
                )}
                
                {/* Two-color text effect for active lyrics */}
                {isActive ? (
                  <div style={{ position: 'relative' }}>
                    {/* Background text (white) */}
                    <span style={{ color: '#fff' }}>{lyric.text}</span>
                    
                    {/* Foreground text (green highlight) with clipping */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${progress * 100}%`,
                        overflow: 'hidden',
                        whiteSpace: 'pre-wrap',
                        color: '#1ED760', // Spotify green
                      }}
                    >
                      {lyric.text}
                    </div>
                  </div>
                ) : (
                  // Inactive lyrics are just white/gray text
                  <span style={{ color: index === activeLyricIndex - 1 || index === activeLyricIndex + 1 ? '#e6e6e6' : '#b3b3b3' }}>
                    {lyric.text}
                  </span>
                )}
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

// Create a silent audio file as default
const createSilentAudio = () => {
  const audioContext = new AudioContext();
  const buffer = audioContext.createBuffer(1, 44100, 44100);
  const array = new Float32Array(44100);
  buffer.copyToChannel(array, 0);

  const arrayBuffer = buffer.getChannelData(0).buffer;
  const uint8Array = new Uint8Array(arrayBuffer);
  const blob = new Blob([uint8Array], { type: 'audio/mpeg' });
  return new File([blob], 'silent.mp3', { type: 'audio/mpeg' });
};

// Update Props interface to make all fields required for the Composition
interface LyricsVideoComponentProps {
  audioFile?: File;
  lyrics?: LyricEntry[];
  durationInSeconds?: number;
}

export const LyricsVideo: React.FC<LyricsVideoComponentProps> = ({
  audioFile,
  lyrics = [],
  durationInSeconds = 0
}) => {
  return (
    <div style={{ width: '100%', marginBottom: '20px' }}>
      <Composition
        id="lyrics-video"
        component={LyricsVideoContent as React.ComponentType<any>}
        durationInFrames={Math.max(30, durationInSeconds * 30)}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          audioFile: audioFile || createSilentAudio(),
          lyrics,
          durationInSeconds,
        }}
      />
    </div>
  );
};

export default LyricsVideo;