export interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

export interface Props {
  audioFile: File;
  lyrics: LyricEntry[];
  durationInSeconds: number;
}


