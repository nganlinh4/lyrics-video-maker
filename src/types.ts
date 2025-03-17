export interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

export interface Props {
  audioUrl: string;
  lyrics: LyricEntry[];
  durationInSeconds: number;
  albumArtUrl?: string;
  backgroundImageUrl?: string;
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


