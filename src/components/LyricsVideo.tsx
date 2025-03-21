import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig, Easing, continueRender, delayRender, Sequence } from 'remotion';
import { LyricEntry, VideoMetadata } from '../types';
import styled, { ThemeProvider } from 'styled-components';
import { useAudioAnalyzer, getAnalysisUrl } from '../utils/audioAnalyzer';

// Define Inter font directly without using @remotion/google-fonts
const FONT_FAMILY = "'Inter', sans-serif";

// Define custom inline font loading instead of using @remotion/google-fonts
const fontStyles = `
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url('https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-display: block;
    src: url('https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: block;
    src: url('https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: block;
    src: url('https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2') format('woff2');
  }
`;

// Spotify-inspired constants (scaled up by 1.5 for 1080p)
const LYRIC_HEIGHT = 98; // Increased from 65
const LYRIC_MARGIN = 48; // Increased from 24
const TRANSITION_DURATION = 0.5;
const BASE_POSITION = 1080 / 2 - 45; // Adjusted for new height
const ALBUM_COVER_SIZE = 450; // Increased from 300
const ALBUM_COVER_MARGIN = 100; // Increased from 110

// Styling constants (scaled up for 1080p)
const INACTIVE_FONT_SIZE = 54; // Increased from 36
const ACTIVE_FONT_SIZE = 60; // Increased from 40
const INACTIVE_COLOR = [255, 255, 255];
const ACTIVE_COLOR = [30, 215, 96];
const INACTIVE_WEIGHT = 400;
const ACTIVE_WEIGHT = 700;

// Add these new effects near the top with other constants
const BACKGROUND_HORIZONTAL_RANGE = 20; // pixels of horizontal movement
const BACKGROUND_VERTICAL_RANGE = 15; // pixels of vertical movement
const BACKGROUND_ZOOM_RANGE = 0.1; // 10% zoom range

// Function to brighten a color
const brightenColor = (color: number[], factor: number = 3): number[] => {
  return color.map(c => Math.min(255, Math.round(c * factor)));
};

// Updated getAverageColor function to return both normal and bright versions
const getAverageColor = (imgElement: HTMLImageElement): { normal: number[], bright: number[] } => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return { 
    normal: [30, 215, 96],
    bright: [45, 255, 144]
  };

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

  const normalColor = [
    Math.round(r / count),
    Math.round(g / count),
    Math.round(b / count)
  ];

  return {
    normal: normalColor,
    bright: brightenColor(normalColor)
  };
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
  backgroundImagesMap?: {
    [key in VideoMetadata['videoType']]?: string;
  };
  metadata: VideoMetadata;
  instrumentalUrl?: string;
  vocalUrl?: string;
  littleVocalUrl?: string;
}

// Utility function to split text into roughly equal parts
const splitTextIntoLines = (text: string, preferredBreakPoint: number): string[] => {
  // If text is shorter than the threshold, return it as is
  if (text.length <= preferredBreakPoint) {
    return [text];
  }

  // Aim for the exact middle
  const middleIndex = Math.floor(text.length / 2);
  
  // Search for spaces within a reasonable range around the middle
  const searchRadius = Math.min(10, Math.floor(text.length / 4));
  
  // Find the closest space to the middle (checking both before and after)
  let bestBreakIndex = middleIndex;
  let minDistanceFromMiddle = text.length;
  
  // Check spaces before the middle
  for (let i = Math.max(0, middleIndex - searchRadius); i < middleIndex; i++) {
    if (text[i] === ' ') {
      const distance = middleIndex - i;
      if (distance < minDistanceFromMiddle) {
        minDistanceFromMiddle = distance;
        bestBreakIndex = i;
      }
    }
  }
  
  // Check spaces after the middle
  for (let i = middleIndex; i <= Math.min(text.length - 1, middleIndex + searchRadius); i++) {
    if (text[i] === ' ') {
      const distance = i - middleIndex;
      if (distance < minDistanceFromMiddle) {
        minDistanceFromMiddle = distance;
        bestBreakIndex = i;
      }
    }
  }
  
  // If no suitable space was found, just split at the middle
  if (bestBreakIndex === middleIndex && text[middleIndex] !== ' ') {
    bestBreakIndex = middleIndex;
  }
  
  const firstLine = text.substring(0, bestBreakIndex).trim();
  const secondLine = text.substring(bestBreakIndex).trim();
  
  return [firstLine, secondLine];
};

// Utility function to determine if a lyric has multiple lines, regardless of how it got them
const countLyricLines = (text: string): number => {
  if (!text) return 1;
  
  // Count both explicit newlines in the original text and those added by our lyric processing
  return (text.match(/\n/g) || []).length + 1;
};

// Additional margin to add per extra line of lyrics (increased for better visibility)
const EXTRA_LINE_MARGIN = 40;

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
  backgroundImagesMap = {},
  metadata
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;

  // Process lyrics based on line threshold
  const processedLyrics = useMemo(() => {
    if (!lyrics) {
      return lyrics;
    }
    
    return lyrics.map(lyric => {
      // Only process lyrics that exceed the threshold
      if (lyric.text.length <= metadata.lyricsLineThreshold) {
        return lyric;
      }
      
      // Split long lyrics into multiple lines
      const lines = splitTextIntoLines(lyric.text, metadata.lyricsLineThreshold);
      return {
        ...lyric,
        text: lines.join('\n') // Use newline character to create multiple lines
      };
    });
  }, [lyrics, metadata.lyricsLineThreshold]);

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
  const [accentColor, setAccentColor] = useState<{ normal: number[], bright: number[] }>({
    normal: [30, 215, 96],
    bright: [45, 255, 144]
  });

  useEffect(() => {
    if (albumArtUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const colors = getAverageColor(img);
        setAccentColor(colors);
      };
      img.src = albumArtUrl;
    }
  }, [albumArtUrl]);

  // Audio reactivity effect
  const audioReactiveEffect = useMemo(() => {
    return Math.abs(Math.sin(frame / (fps * 0.8)) * 0.5) + 0.5;
  }, [frame, fps]);

  // Replace the simple parallax effect with complex background animations
  const backgroundEffects = useMemo(() => {
    // Use different frequencies for each movement to create unpredictable patterns
    const horizontalOffset = Math.sin(frame / fps * 0.2) * BACKGROUND_HORIZONTAL_RANGE + 
                           Math.cos(frame / fps * 0.13) * (BACKGROUND_HORIZONTAL_RANGE * 0.5);
    
    const verticalOffset = Math.sin(frame / fps * 0.15) * BACKGROUND_VERTICAL_RANGE + 
                          Math.cos(frame / fps * 0.23) * (BACKGROUND_VERTICAL_RANGE * 0.7);
    
    // Create a zooming effect that pulses in and out
    const zoomFactor = 1 + (Math.sin(frame / fps * 0.17) * BACKGROUND_ZOOM_RANGE) +
                          (Math.cos(frame / fps * 0.11) * (BACKGROUND_ZOOM_RANGE * 0.5));
    
    return {
      transform: `scale(${zoomFactor})`,
      backgroundPosition: `calc(50% + ${horizontalOffset}px) calc(50% + ${verticalOffset}px)`,
      transition: 'transform 0.1s ease-out'
    };
  }, [frame, fps]);

  // Get the correct background image for the current video type
  const currentBackgroundImage = useMemo(() => {
    // First check if we have a specific background for this video type in the map
    if (backgroundImagesMap && backgroundImagesMap[metadata.videoType]) {
      return backgroundImagesMap[metadata.videoType];
    }
    // Fall back to the single backgroundImageUrl if provided
    return backgroundImageUrl || '';
  }, [backgroundImagesMap, metadata.videoType, backgroundImageUrl]);

  // Find the active lyric index - update to use processedLyrics
  const activeLyricIndex = useMemo(() => {
    return processedLyrics?.findIndex(
      (lyric) => currentTimeInSeconds >= lyric.start && currentTimeInSeconds <= lyric.end
    ) ?? -1;
  }, [processedLyrics, currentTimeInSeconds]);

  // Calculate scroll offset with smooth transition - update to use processedLyrics and account for multi-line lyrics
  const scrollOffset = useMemo(() => {
    if (activeLyricIndex >= 0) {
      const currentLyric = processedLyrics[activeLyricIndex];
      
      // Calculate extra margins for all lyrics up to the active one
      const extraMarginSum = processedLyrics.slice(0, activeLyricIndex).reduce((sum, lyric) => {
        const lineCount = countLyricLines(lyric.text);
        return sum + (lineCount - 1) * EXTRA_LINE_MARGIN;
      }, 0);
      
      // Calculate current offset including extra margins
      const currentOffset = activeLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) + extraMarginSum - BASE_POSITION;
      
      if (activeLyricIndex < processedLyrics.length - 1) {
        const nextLyric = processedLyrics[activeLyricIndex + 1];
        
        // Calculate extra margins for the next lyric
        const nextExtraMarginSum = processedLyrics.slice(0, activeLyricIndex + 1).reduce((sum, lyric) => {
          const lineCount = countLyricLines(lyric.text);
          return sum + (lineCount - 1) * EXTRA_LINE_MARGIN;
        }, 0);
        
        // Calculate next offset including extra margins
        const nextOffset = (activeLyricIndex + 1) * (LYRIC_HEIGHT + LYRIC_MARGIN) + nextExtraMarginSum - BASE_POSITION;
        
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
      // Find previous and next lyrics during the gap - update to use processedLyrics
      const previousLyricIndex = processedLyrics.reduce((prev, curr, i) => 
        curr.end <= currentTimeInSeconds && (prev === -1 || processedLyrics[prev].end < curr.end) ? i : prev, -1);
      
      const nextLyricIndex = processedLyrics.findIndex(lyric => lyric.start > currentTimeInSeconds);
      
      if (previousLyricIndex >= 0 && nextLyricIndex >= 0) {
        const previousLyric = processedLyrics[previousLyricIndex];
        const nextLyric = processedLyrics[nextLyricIndex];
        
        // Calculate extra margins for previous lyric
        const prevExtraMarginSum = processedLyrics.slice(0, previousLyricIndex).reduce((sum, lyric) => {
          const lineCount = countLyricLines(lyric.text);
          return sum + (lineCount - 1) * EXTRA_LINE_MARGIN;
        }, 0);
        
        // Calculate extra margins for next lyric
        const nextExtraMarginSum = processedLyrics.slice(0, nextLyricIndex).reduce((sum, lyric) => {
          const lineCount = countLyricLines(lyric.text);
          return sum + (lineCount - 1) * EXTRA_LINE_MARGIN;
        }, 0);
        
        const previousOffset = previousLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) + prevExtraMarginSum - BASE_POSITION;
        const nextOffset = nextLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) + nextExtraMarginSum - BASE_POSITION;
        
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
      
      if (nextLyricIndex >= 0) {
        // Calculate extra margins for next lyric
        const nextExtraMarginSum = processedLyrics.slice(0, nextLyricIndex).reduce((sum, lyric) => {
          const lineCount = countLyricLines(lyric.text);
          return sum + (lineCount - 1) * EXTRA_LINE_MARGIN;
        }, 0);
        
        return nextLyricIndex * (LYRIC_HEIGHT + LYRIC_MARGIN) + nextExtraMarginSum - BASE_POSITION;
      } else if (processedLyrics.length > 0) {
        // Calculate extra margins for last lyric
        const lastExtraMarginSum = processedLyrics.slice(0, processedLyrics.length - 1).reduce((sum, lyric) => {
          const lineCount = countLyricLines(lyric.text);
          return sum + (lineCount - 1) * EXTRA_LINE_MARGIN;
        }, 0);
        
        return (processedLyrics.length - 1) * (LYRIC_HEIGHT + LYRIC_MARGIN) + lastExtraMarginSum - BASE_POSITION;
      }
      
      return 0;
    }
  }, [activeLyricIndex, currentTimeInSeconds, processedLyrics]);

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

  const VISUALIZER_HEIGHT = 40;
  const VISUALIZER_WIDTH = ALBUM_COVER_SIZE;
  const VISUALIZER_WINDOW = 20; // seconds on each side

  // Update AudioVisualizer component to fix timing alignment
  const AudioVisualizer: React.FC<{ timeInSeconds: number }> = ({ timeInSeconds }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    const audioUrlToAnalyze = useMemo(() => {
      return getAnalysisUrl(
        metadata.videoType,
        audioUrl,
        vocalUrl,
        instrumentalUrl,
        littleVocalUrl
      );
    }, [metadata.videoType, audioUrl, vocalUrl, instrumentalUrl, littleVocalUrl]);
  
    const { isAnalyzing, error, volumeData } = useAudioAnalyzer(audioUrlToAnalyze);
    
    // Calculate the correct data range without the padding offset
    const startSecond = Math.max(0, Math.floor(timeInSeconds) - 20);
    const endSecond = Math.min(
      volumeData.length - 80, // Subtract total padding (40 at start + 40 at end)
      Math.floor(timeInSeconds) + 20
    );
  
    if (error) {
      return (
        <div style={{
          width: VISUALIZER_WIDTH,
          height: VISUALIZER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          color: '#ff4444',
          fontSize: '14px'
        }}>
          Failed to analyze audio
        </div>
      );
    }
    
    const getBoundaryEffect = (second: number, timeInSeconds: number): number => {
      const distance = Math.abs(second - timeInSeconds);
      if (distance > 18) {
        return 1.0 - ((distance - 18) / 2) * 0.3;
      }
      return 1.0;
    };
  
    return (
      <div style={{
        width: VISUALIZER_WIDTH,
        height: VISUALIZER_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        marginTop: '10px',
        padding: '10px 10px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: VISUALIZER_HEIGHT,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}>
            <div style={{
              display: 'flex',
              transform: `translateX(${-((timeInSeconds % 1) * 4)}px)`
            }}>
              {Array.from({ length: endSecond - startSecond + 1 }, (_, i) => {
                const second = startSecond + i;
                const boundaryMultiplier = getBoundaryEffect(second, timeInSeconds);
                const isCenter = second === Math.floor(timeInSeconds);
                const distanceFromCenter = Math.abs(second - timeInSeconds);
                const opacity = 1 - (distanceFromCenter / 20) * 0.5;
                
                // Get volume data with correct index (add 40 to account for initial padding)
                const volume = volumeData[second + 40] || 0.05;
                const scaledVolume = Math.min(1, volume * 3.5) * boundaryMultiplier;

                return (
                  <div
                    key={second}
                    style={{
                      width: '3px',
                      marginRight: '1px',
                      height: `${scaledVolume * VISUALIZER_HEIGHT * 0.8}px`,
                      backgroundColor: isCenter ? '#1DB954' : `rgba(255, 255, 255, ${opacity})`,
                      borderRadius: '4px',
                      transition: 'height 80ms ease-out'
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calculate gradient position for title
  const titleGradientPosition = useMemo(() => {
    // Complete cycle in 12 seconds (same as original animation duration)
    const cycleDuration = 12 * fps;
    // Use sine function for smooth back-and-forth movement
    const position = Math.sin((frame % cycleDuration) / cycleDuration * Math.PI * 2) * 200;
    // Map from -200 to 200 range
    return position;
  }, [frame, fps]);

  return (
    <ThemeProvider theme={{ 
      accentColor,
      titleGradientPosition, // Pass gradient position to theme
      metadataPosition: metadata.metadataPosition, // Pass metadata position to theme
      metadataWidth: metadata.metadataWidth // Pass metadata width to theme
    }}>
      {/* Add style tag directly in the component */}
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      <AbsoluteFill
        style={{
          backgroundColor: '#000',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Background container with effects - use currentBackgroundImage */}
        <div style={{
          position: 'absolute',
          top: -50,  // Extra padding to prevent edges showing during animation
          left: -50,
          right: -50,
          bottom: -50,
          backgroundImage: currentBackgroundImage 
            ? `linear-gradient(rgba(0, 0, 0, ${0.4 + backgroundPulse}), rgba(0, 0, 0, ${0.5 + backgroundPulse})), url(${currentBackgroundImage})` 
            : 'linear-gradient(180deg, #121212 0%, #060606 100%)',
          backgroundSize: 'cover',
          ...backgroundEffects,
        }} />

        {/* Rest of the content */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: `blur(${2 + audioReactiveEffect * 8}px)`,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1,
          }}
        />

        {/* Content layer */}
        <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>
          {/* Centered Metadata above album art */}
          <CenteredMetadataContainer>
            <ArtistName>{metadata.artist}</ArtistName>
            <SongTitle 
              style={{ 
                backgroundPosition: `${titleGradientPosition}% center` 
              }}
            >
              {metadata.songTitle}
            </SongTitle>
          </CenteredMetadataContainer>

          {/* Album Cover with Video Type below it */}
          <AlbumCoverContainer>
            <div
              style={{
                position: 'relative',
                width: ALBUM_COVER_SIZE,
                height: ALBUM_COVER_SIZE,
                backgroundColor: 'rgba(30, 30, 30, 0.6)',
                borderRadius: '24px',
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
            <AudioVisualizer timeInSeconds={currentTimeInSeconds} />
          </AlbumCoverContainer>

          {/* Lyrics Container - updated to use processedLyrics */}
          <div
            style={{
              width: '85%',
              maxWidth: '1450px', // Increased from 900
              textAlign: 'center',
              height: '100%',
              position: 'relative',
              marginLeft: 510, // Increased from 400
            }}
          >
            {processedLyrics?.map((lyric: LyricEntry, index: number) => {
              const progress = getLyricProgress(lyric, currentTimeInSeconds);
              
              // Count the number of lines in this lyric
              const lineCount = countLyricLines(lyric.text);
              // Add extra margin for each additional line beyond the first
              const extraMargin = (lineCount - 1) * EXTRA_LINE_MARGIN;
              
              // Calculate positions with the extra margin for multi-line lyrics
              const naturalPosition = index * (LYRIC_HEIGHT + LYRIC_MARGIN) + 
                // Sum up extra margins for all previous lyrics
                processedLyrics.slice(0, index).reduce((sum, prevLyric) => {
                  const prevLineCount = countLyricLines(prevLyric.text);
                  return sum + (prevLineCount - 1) * EXTRA_LINE_MARGIN;
                }, 0);
              
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
                    whiteSpace: 'pre-wrap', // This ensures newlines are respected
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

        {/* Add Audio components based on video type */}
        {metadata.videoType === 'Little Vocal' ? (
          littleVocalUrl ? (
            // Use pre-mixed little vocal track if available
            <Audio src={littleVocalUrl} volume={1} />
          ) : (
            // Otherwise mix instrumental and vocal
            <>
              {instrumentalUrl && <Audio src={instrumentalUrl} volume={1} />}
              {vocalUrl && <Audio src={vocalUrl} volume={0.12} />}
            </>
          )
        ) : metadata.videoType === 'Vocal Only' ? (
          <Audio src={vocalUrl || audioUrl} volume={1} />
        ) : metadata.videoType === 'Instrumental Only' ? (
          <Audio src={instrumentalUrl || audioUrl} volume={1} />
        ) : (
          // Default Lyrics Video case
          <Audio src={audioUrl} volume={1} />
        )}

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
    </ThemeProvider>
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
  top: calc(50% - ${ALBUM_COVER_SIZE / 2}px + ${props => props.theme.metadataPosition || -155}px);
  left: ${props => `calc(${ALBUM_COVER_MARGIN}px + ${ALBUM_COVER_SIZE / 2}px - ${(props.theme.metadataWidth || ALBUM_COVER_SIZE) / 2}px)`};
  width: ${props => props.theme.metadataWidth || ALBUM_COVER_SIZE}px;
  text-align: center;
  z-index: 2;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-family: ${FONT_FAMILY};
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
  font-family: ${FONT_FAMILY};
`;

const SongTitle = styled.h1`
  font-size: 48px;
  margin: 5px 0;
  font-weight: 700;
  font-family: ${FONT_FAMILY};
  background: ${props => `linear-gradient(135deg, 
    rgb(${props.theme.accentColor.normal.join(',')}) 0%, 
    rgb(${props.theme.accentColor.bright.join(',')}) 50%,
    rgb(${props.theme.accentColor.normal.join(',')}) 100%)`};
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
  background-size: 200% auto;
  /* Remove animation property as we're controlling position directly via inline style */
`;
