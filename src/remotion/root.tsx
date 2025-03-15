import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { LyricsVideoContent, LyricsVideoProps } from '../components/LyricsVideo';

// This file will be used by Remotion for rendering
const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="lyrics-video"
        component={LyricsVideoContent as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={1000} // Will be overridden by props
        fps={30}
        width={1280}
        height={720}
        // Props will be passed via command line
      />
    </>
  );
};

registerRoot(RemotionRoot);