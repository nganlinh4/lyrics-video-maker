export interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

export interface VideoMetadata {
  artist: string;
  songTitle: string;
  videoType: 'Lyrics Video' | 'Vocal Only' | 'Instrumental Only' | 'Little Vocal';
  lyricsLineThreshold: number; // No longer optional
  metadataPosition: number; // No longer optional
}

export interface AudioFiles {
  main: File | null;
  instrumental?: File | null;
  vocal?: File | null;
  littleVocal?: File | null; // Added new option for pre-mixed Little Vocal audio
}

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

// Interface for components that can work with either a File or URL
export interface AudioProps {
  audioFile?: File;
  audioUrl?: string;
  lyrics: LyricEntry[];
  durationInSeconds: number;
  albumArtUrl?: string;
  backgroundImageUrl?: string;
}


