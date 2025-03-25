import { LyricEntry } from '../../types';

export interface AudioFiles {
  main: File | null;
  instrumental: File | null;
  vocal: File | null;
  littleVocal: File | null;
}

export interface VideoMetadata {
  artist: string;
  songTitle: string;
  videoType: 'Lyrics Video' | 'Vocal Only' | 'Instrumental Only' | 'Little Vocal';
  lyricsLineThreshold: number;
  metadataPosition: number;
  metadataWidth: number;
}

export interface UploadFormProps {
  onFilesChange: (
    audioFiles: AudioFiles,
    lyrics: LyricEntry[] | null, 
    albumArt: File | null, 
    background: { [key in VideoMetadata['videoType']]?: File | null },
    metadata: VideoMetadata,
    lyricsFile: File | null
  ) => void;
  onVideoPathChange: (path: string) => void;
  initialValues?: {
    audioFiles: AudioFiles;
    lyrics: LyricEntry[] | null;
    albumArtFile: File | null;
    backgroundFiles: { [key: string]: File | null };
    metadata: VideoMetadata;
    lyricsFile: File | null;
  };
}