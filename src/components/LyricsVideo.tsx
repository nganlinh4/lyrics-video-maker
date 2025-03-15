import React, { useEffect, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig, Composition } from 'remotion';
import { LyricEntry, Props } from '../types';

export const LyricsVideoContent: React.FC<Props> = ({ audioFile, lyrics, durationInSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!audioFile || audioFile.size === 0) return;
    
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [audioFile]);

  return (
    <AbsoluteFill 
      style={{ 
        backgroundColor: 'black', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      {audioUrl && <Audio src={audioUrl} />}
      <div style={{ width: '80%', textAlign: 'center' }}>
        {lyrics?.map((lyric: LyricEntry, index: number) => {
          const fadeDuration = 0.2;
          const opacity = interpolate(
            currentTimeInSeconds,
            [
              lyric.start - fadeDuration,
              lyric.start,
              lyric.end,
              lyric.end + fadeDuration
            ],
            [0, 1, 1, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div
              key={index}
              style={{
                opacity,
                fontSize: '48px',
                color: 'white',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                position: 'absolute',
                width: '100%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {lyric.text}
            </div>
          );
        })}
      </div>
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
