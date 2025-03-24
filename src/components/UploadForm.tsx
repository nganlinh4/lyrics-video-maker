import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { LyricEntry } from '../types';
import VideoPreview from './VideoPreview';
import { Input, Select, InputLabel } from './StyledComponents';
import { analyzeAudio } from '../utils/audioAnalyzer';
import { useLanguage } from '../contexts/LanguageContext';

const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

const FormContainer = styled.div`
  margin: 1.5rem auto;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  background: var(--card-background);
  color: var(--text-color);
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin: 0.5rem auto;
  }
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  
  h3 {
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: var(--heading-color, var(--text-color));
  }
`;

const FileInput = styled.input`
  display: none;
`;

const DropZone = styled.div<{ isDragging?: boolean }>`
  width: 100%;
  padding: 1rem;
  margin: 0.5rem 0 1rem;
  border: 2px dashed ${props => props.isDragging ? 'var(--accent-color)' : 'var(--border-color)'};
  border-radius: 8px;
  background-color: ${props => props.isDragging ? 'var(--hover-color)' : 'transparent'};
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: var(--accent-color);
    background-color: var(--hover-color);
    transform: translateY(-2px);
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${props => props.isDragging ? 'rgba(var(--accent-color-rgb), 0.05)' : 'transparent'};
    z-index: 0;
    transition: all 0.3s ease;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const BulkDropZone = styled(DropZone)`
  background-color: rgba(110, 142, 251, 0.05);
  border: 3px dashed #6e8efb;
  padding: 2rem 1.5rem;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    background-color: rgba(110, 142, 251, 0.1);
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(110, 142, 251, 0.15);
  }
  
  .upload-icon {
    font-size: 2rem;
    color: #6e8efb;
    margin-bottom: 0.75rem;
    opacity: 0.8;
  }
`;

const PreviewImage = styled.img`
  max-width: 70px;
  max-height: 70px;
  margin-top: 0.75rem;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-color-secondary) 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 0.75rem;
  width: 100%;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 14px rgba(0, 0, 0, 0.18);
    
    &:before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
  }

  &:disabled {
    background: var(--disabled-color);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const InfoBox = styled.div`
  background-color: var(--info-background, rgba(25, 118, 210, 0.05));
  border-left: 4px solid var(--accent-color, #1976D2);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  color: var(--text-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  ul {
    margin-top: 0.5rem;
    padding-left: 1.25rem;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
  
  strong {
    color: var(--accent-color, #1976D2);
  }
`;

const CodeExample = styled.pre`
  background-color: var(--code-background, #2d2d2d);
  padding: 1.25rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9rem;
  margin: 0.75rem 0;
  color: var(--code-text-color, #f8f8f2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
`;

const FileName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--text-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  
  &:hover {
    background-color: var(--hover-color-darker, rgba(0, 0, 0, 0.08));
  }
  
  svg {
    color: var(--accent-color);
    font-size: 1.1rem;
  }
`;

const DropText = styled.p`
  margin: 0;
  text-align: center;
  color: var(--text-color);
  font-size: 0.9rem;
  
  svg {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--accent-color);
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color, #f44336);
  margin-top: 1.25rem;
  padding: 1rem;
  background-color: var(--error-background, rgba(244, 67, 54, 0.08));
  border-radius: 8px;
  border-left: 4px solid var(--error-color, #f44336);
  font-size: 0.95rem;
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  
  @keyframes shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-3px); }
    40%, 60% { transform: translateX(3px); }
  }
`;

const FileTypeTag = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.65rem;
  font-weight: 600;
  margin-left: 0.5rem;
  background-color: var(--accent-background, rgba(25, 118, 210, 0.1));
  color: var(--accent-text-color, #1976D2);
  letter-spacing: 0.4px;
  text-transform: uppercase;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGridWide = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BackgroundGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormTitle = styled.h2`
  font-size: 1.8rem;
  color: var(--heading-color, var(--text-color));
  margin-bottom: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--accent-color);
  padding-bottom: 0.75rem;
  display: inline-block;
`;

const AnimatedIcon = styled.div`
  svg {
    transition: all 0.3s ease;
  }
  
  &:hover svg {
    transform: scale(1.2);
  }
`;

interface AudioFiles {
  main: File | null;
  instrumental: File | null;
  vocal: File | null;
  littleVocal: File | null;
}

interface VideoMetadata {
  artist: string;
  songTitle: string;
  videoType: 'Lyrics Video' | 'Vocal Only' | 'Instrumental Only' | 'Little Vocal';
  lyricsLineThreshold: number;
  metadataPosition: number;
  metadataWidth: number;
}

interface UploadFormProps {
  onFilesChange: (
    audioFiles: AudioFiles,
    lyrics: LyricEntry[] | null, 
    albumArt: File | null, 
    background: { [key in VideoMetadata['videoType']]?: File | null },
    metadata: VideoMetadata,
    lyricsFile: File | null  // Add lyricsFile parameter
  ) => void;
  onVideoPathChange: (path: string) => void;
  initialValues?: {
    audioFiles: AudioFiles;
    lyrics: LyricEntry[] | null;
    albumArtFile: File | null;
    backgroundFiles: { [key: string]: File | null };
    metadata: VideoMetadata;
    lyricsFile: File | null;  // Add lyricsFile to initialValues
  };
}

const UploadForm: React.FC<UploadFormProps> = ({ onFilesChange, onVideoPathChange, initialValues }) => {
  const { t } = useLanguage();
  const [mainAudioFile, setMainAudioFile] = useState<File | null>(initialValues?.audioFiles.main || null);
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(initialValues?.audioFiles.instrumental || null);
  const [vocalFile, setVocalFile] = useState<File | null>(initialValues?.audioFiles.vocal || null);
  const [littleVocalFile, setLittleVocalFile] = useState<File | null>(initialValues?.audioFiles.littleVocal || null);
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(initialValues?.lyrics || null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(initialValues?.lyricsFile || null);  // Initialize from initialValues
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(initialValues?.albumArtFile || null);
  const [backgroundFiles, setBackgroundFiles] = useState<{ [key in VideoMetadata['videoType']]?: File | null }>(
    initialValues?.backgroundFiles || {}
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<{[key: string]: boolean}>({});
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [artist, setArtist] = useState(initialValues?.metadata.artist || '');
  const [songTitle, setSongTitle] = useState(initialValues?.metadata.songTitle || '');
  const [videoType, setVideoType] = useState<VideoMetadata['videoType']>(
    initialValues?.metadata.videoType || 'Lyrics Video'
  );
  
  const mainAudioInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);
  const albumArtInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const instrumentalInputRef = useRef<HTMLInputElement>(null);
  const vocalInputRef = useRef<HTMLInputElement>(null);
  const littleVocalInputRef = useRef<HTMLInputElement>(null);
  const backgroundLyricsInputRef = useRef<HTMLInputElement>(null);
  const backgroundVocalInputRef = useRef<HTMLInputElement>(null);
  const backgroundInstrumentalInputRef = useRef<HTMLInputElement>(null);
  const backgroundLittleVocalInputRef = useRef<HTMLInputElement>(null);

  const updateFiles = () => {
    const audioFiles: AudioFiles = {
      main: mainAudioFile,
      instrumental: instrumentalFile,
      vocal: vocalFile,
      littleVocal: littleVocalFile
    };

    const metadata: VideoMetadata = {
      artist,
      songTitle,
      videoType,
      lyricsLineThreshold: 41,
      metadataPosition: -155,
      metadataWidth: 800
    };

    onFilesChange(audioFiles, lyrics, albumArtFile, backgroundFiles, metadata, lyricsFile);
  };

  const debouncedUpdateFiles = React.useCallback(
    debounce((newMetadata: VideoMetadata) => {
      const completeMetadata = {
        ...newMetadata,
        lyricsLineThreshold: 41,
        metadataPosition: -155,
        metadataWidth: 800
      };
      onFilesChange(
        { main: mainAudioFile, instrumental: instrumentalFile, vocal: vocalFile, littleVocal: littleVocalFile },
        lyrics,
        albumArtFile,
        backgroundFiles,
        completeMetadata,
        lyricsFile
      );
    }, 500),
    [mainAudioFile, instrumentalFile, vocalFile, littleVocalFile, lyrics, albumArtFile, backgroundFiles, lyricsFile]
  );

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Immediately update the local state
    if (name === 'artist') {
      setArtist(value);
    } else if (name === 'songTitle') {
      setSongTitle(value);
    } else if (name === 'videoType') {
      setVideoType(value as VideoMetadata['videoType']);
      // For video type, update immediately since it's a select
      onFilesChange(
        { main: mainAudioFile, instrumental: instrumentalFile, vocal: vocalFile, littleVocal: littleVocalFile },
        lyrics,
        albumArtFile,
        backgroundFiles,
        { artist, songTitle, videoType: value as VideoMetadata['videoType'], lyricsLineThreshold: 41, metadataPosition: -155, metadataWidth: 800 },
        lyricsFile
      );
      return;
    }

    // Debounce the preview update for text inputs
    const newMetadata: VideoMetadata = {
      artist: name === 'artist' ? value : artist,
      songTitle: name === 'songTitle' ? value : songTitle,
      videoType,
      lyricsLineThreshold: 41,
      metadataPosition: -155,
      metadataWidth: 800
    };
    
    debouncedUpdateFiles(newMetadata);
  };

  // New function to handle audio analysis when an audio file is uploaded
  const analyzeAudioFile = async (file: File): Promise<void> => {
    if (!file) return;
    
    // Create a temporary URL for the file
    const url = URL.createObjectURL(file);
    
    try {
      // Start analysis (this will cache the results)
      await analyzeAudio(url);
      console.log(`Analysis complete for ${file.name}`);
    } catch (err) {
      console.error(`Error analyzing audio file ${file.name}:`, err);
    } finally {
      // Clean up the URL
      URL.revokeObjectURL(url);
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'instrumental' | 'vocal' | 'littleVocal') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file (MP3, WAV)');
        return;
      }
      
      switch(type) {
        case 'main':
          setMainAudioFile(file);
          break;
        case 'instrumental':
          setInstrumentalFile(file);
          break;
        case 'vocal':
          setVocalFile(file);
          break;
        case 'littleVocal':
          setLittleVocalFile(file);
          break;
      }
      
      setError(null);
      
      // Analyze the audio file right after upload
      await analyzeAudioFile(file);
      
      updateFiles(); // Call this after analysis is complete
    }
  };

  const handleLyricsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLyricsFile(file);
      
      try {
        const text = await file.text();
        const parsedLyrics = JSON.parse(text);
        if (!Array.isArray(parsedLyrics)) {
          throw new Error('Lyrics must be an array');
        }
        
        setLyrics(parsedLyrics);
        setError(null);
        // Update parent component immediately with both lyrics and file
        onFilesChange(
          { 
            main: mainAudioFile, 
            instrumental: instrumentalFile, 
            vocal: vocalFile, 
            littleVocal: littleVocalFile 
          },
          parsedLyrics,
          albumArtFile,
          backgroundFiles,
          { 
            artist, 
            songTitle, 
            videoType, 
            lyricsLineThreshold: 41, 
            metadataPosition: -155, 
            metadataWidth: 800 
          },
          file
        );
      } catch (err) {
        setError(`Invalid lyrics file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLyrics(null);
      }
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'albumArt' | 'background', 
    videoType?: VideoMetadata['videoType']
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.)');
        return;
      }
      
      if (type === 'albumArt') {
        setAlbumArtFile(file);
      } else {
        if (videoType) {
          // Set specific background file for the video type
          setBackgroundFiles(prev => ({ ...prev, [videoType]: file }));
        } else {
          // For backward compatibility, set as the generic background file
          setBackgroundFiles(prev => ({ ...prev, 'Lyrics Video': file }));
        }
      }
      updateFiles();
      setError(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: false }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (
    e: React.DragEvent, 
    type: 'main' | 'lyrics' | 'albumArt' | 'background' | 'instrumental' | 'vocal' | 'littleVocal',
    videoType: VideoMetadata['videoType'] = 'Lyrics Video' // Provide default value
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      switch (type) {
        case 'main':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setMainAudioFile(file);
          // Analyze the audio file 
          await analyzeAudioFile(file);
          break;
        case 'instrumental':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setInstrumentalFile(file);
          // Analyze the audio file
          await analyzeAudioFile(file);
          break;
        case 'vocal':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setVocalFile(file);
          // Analyze the audio file
          await analyzeAudioFile(file);
          break;
        case 'littleVocal':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setLittleVocalFile(file);
          // Analyze the audio file
          await analyzeAudioFile(file);
          break;
        case 'lyrics':
          if (!file.name.endsWith('.json')) {
            setError('Please upload a valid JSON file');
            return;
          }
          setLyricsFile(file);
          try {
            const text = await file.text();
            const parsedLyrics = JSON.parse(text);
            if (Array.isArray(parsedLyrics)) {
              setLyrics(parsedLyrics);
              // Update parent component immediately
              onFilesChange(
                { 
                  main: mainAudioFile, 
                  instrumental: instrumentalFile, 
                  vocal: vocalFile, 
                  littleVocal: littleVocalFile 
                },
                parsedLyrics,
                albumArtFile,
                backgroundFiles,
                { 
                  artist, 
                  songTitle, 
                  videoType, 
                  lyricsLineThreshold: 41, 
                  metadataPosition: -155, 
                  metadataWidth: 800 
                },
                file
              );
              setError(null);
            } else {
              throw new Error('Invalid lyrics format');
            }
          } catch (err) {
            setError('Invalid lyrics file format');
            setLyrics(null);
            return;
          }
          break;
        case 'albumArt':
        case 'background':
          if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file');
            return;
          }
          if (type === 'albumArt') {
            setAlbumArtFile(file);
          } else if (videoType) {
            // Set specific background file for the video type
            setBackgroundFiles(prev => ({ ...prev, [videoType]: file }));
          } else {
            // Default to Lyrics Video if no video type specified
            setBackgroundFiles(prev => ({ ...prev, 'Lyrics Video': file }));
          }
          updateFiles();
          break;
      }
      setError(null);
      updateFiles();
    }
  };

  const handleBulkDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, bulk: false }));

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const files = Array.from(e.dataTransfer.files);
    setError(null);

    // Categorize files
    let detectedMain: File | null = null;
    let detectedInstrumental: File | null = null;
    let detectedVocal: File | null = null;
    let detectedLittleVocal: File | null = null;
    let detectedLyrics: File | null = null;
    let detectedAlbumArt: File | null = null;
    const detectedBackgrounds: { [key: string]: File } = {};
    let backgroundImages: File[] = [];
    let backgroundIndex = 0;

    // Process each file
    for (const file of files) {
      // Handle JSON files (lyrics)
      if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const parsedLyrics = JSON.parse(text);
          if (Array.isArray(parsedLyrics)) {
            setLyrics(parsedLyrics);
            detectedLyrics = file;
            continue;
          }
        } catch (err) {
          setError('Invalid lyrics JSON file');
          return;
        }
      }

      // Handle audio files
      if (file.type.startsWith('audio/')) {
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes('[music+vocals]')) {
          detectedLittleVocal = file;
          await analyzeAudioFile(file);
        } else if (nameLower.includes('music') || nameLower.includes('instrumental')) {
          detectedInstrumental = file;
          await analyzeAudioFile(file);
        } else if (nameLower.includes('vocal') || nameLower.includes('voc')) {
          if (nameLower.includes('little') || nameLower.includes('low')) {
            detectedLittleVocal = file;
          } else {
            detectedVocal = file;
          }
          await analyzeAudioFile(file);
        } else {
          detectedMain = file;
          await analyzeAudioFile(file);
        }
        continue;
      }

      // Handle image files
      if (file.type.startsWith('image/')) {
        // Create an image object to check dimensions
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            URL.revokeObjectURL(imageUrl);
            // Check if image is square (allowing for small rounding differences)
            const isSquare = Math.abs(img.width - img.height) <= 2;
            if (isSquare) {
              detectedAlbumArt = file;
            } else {
              // Add to background images array to be processed later
              backgroundImages.push(file);
            }
            resolve();
          };
          img.src = imageUrl;
        });
      }
    }

    // Distribute background images to different video types
    const videoTypes: VideoMetadata['videoType'][] = [
      'Lyrics Video', 'Vocal Only', 'Instrumental Only', 'Little Vocal'
    ];
    
    backgroundImages.forEach((file, index) => {
      if (index < videoTypes.length) {
        detectedBackgrounds[videoTypes[index]] = file;
      }
    });

    // Update state with detected files
    if (detectedMain) setMainAudioFile(detectedMain);
    if (detectedInstrumental) setInstrumentalFile(detectedInstrumental);
    if (detectedVocal) setVocalFile(detectedVocal);
    if (detectedLittleVocal) setLittleVocalFile(detectedLittleVocal);
    if (detectedLyrics) setLyricsFile(detectedLyrics);
    if (detectedAlbumArt) setAlbumArtFile(detectedAlbumArt);
    setBackgroundFiles(detectedBackgrounds);

    // Log detected files for debugging
    console.log('Detected files:', {
      main: detectedMain?.name,
      instrumental: detectedInstrumental?.name,
      vocal: detectedVocal?.name,
      littleVocal: detectedLittleVocal?.name,
      backgrounds: Object.entries(detectedBackgrounds).map(([type, file]) => `${type}: ${file.name}`)
    });

    // Update the form
    setTimeout(() => {
      const audioFiles: AudioFiles = {
        main: detectedMain,
        instrumental: detectedInstrumental,
        vocal: detectedVocal,
        littleVocal: detectedLittleVocal
      };

      const metadata: VideoMetadata = {
        artist,
        songTitle,
        videoType,
        lyricsLineThreshold: 41,
        metadataPosition: -155,
        metadataWidth: 800
      };

      onFilesChange(audioFiles, lyrics, detectedAlbumArt, detectedBackgrounds, metadata, detectedLyrics);
    }, 0);
  };

  const resetForm = () => {
    setMainAudioFile(null);
    setInstrumentalFile(null);
    setVocalFile(null);
    setLittleVocalFile(null);
    setLyricsFile(null);
    setAlbumArtFile(null);
    setBackgroundFiles({});
    setLyrics(null);
    setError(null);
    setVideoPath(null);
    setArtist('');
    setSongTitle('');
    setVideoType('Lyrics Video');
    onFilesChange(
      { main: null, instrumental: null, vocal: null, littleVocal: null },
      null,
      null,
      {},
      { artist: '', songTitle: '', videoType: 'Lyrics Video', lyricsLineThreshold: 41, metadataPosition: -155, metadataWidth: 800 },
      null
    );
    
    if (mainAudioInputRef.current) mainAudioInputRef.current.value = '';
    if (lyricsInputRef.current) lyricsInputRef.current.value = '';
    if (albumArtInputRef.current) albumArtInputRef.current.value = '';
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    if (instrumentalInputRef.current) instrumentalInputRef.current.value = '';
    if (vocalInputRef.current) vocalInputRef.current.value = '';
    if (littleVocalInputRef.current) littleVocalInputRef.current.value = '';
    if (backgroundLyricsInputRef.current) backgroundLyricsInputRef.current.value = '';
    if (backgroundVocalInputRef.current) backgroundVocalInputRef.current.value = '';
    if (backgroundInstrumentalInputRef.current) backgroundInstrumentalInputRef.current.value = '';
    if (backgroundLittleVocalInputRef.current) backgroundLittleVocalInputRef.current.value = '';
  };

  return (
    <FormContainer>      
      <InfoBox>
        <strong>{t('quickUpload')}:</strong> {t('quickUploadDescription')}
      </InfoBox>

      <BulkDropZone
        isDragging={isDragging['bulk']}
        onDrop={handleBulkDrop}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, 'bulk')}
        onDragLeave={(e) => handleDragLeave(e, 'bulk')}
      >
        <DropText>
          <strong>{t('dropAllFiles')}</strong>
          <br />
          {t('dragAndDropAll')}
        </DropText>
        {(mainAudioFile || instrumentalFile || vocalFile || littleVocalFile || lyricsFile || albumArtFile || Object.keys(backgroundFiles).length > 0) && (
          <div style={{ marginTop: '0.75rem', width: '100%' }}>
            <h4>{t('detectedFiles')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '0.5rem' }}>
              {mainAudioFile && <FileName>{mainAudioFile.name}<FileTypeTag>Main</FileTypeTag></FileName>}
              {instrumentalFile && <FileName>{instrumentalFile.name}<FileTypeTag>Music</FileTypeTag></FileName>}
              {vocalFile && <FileName>{vocalFile.name}<FileTypeTag>Vocals</FileTypeTag></FileName>}
              {littleVocalFile && <FileName>{littleVocalFile.name}<FileTypeTag>Little</FileTypeTag></FileName>}
              {lyricsFile && <FileName>{lyricsFile.name}<FileTypeTag>JSON</FileTypeTag></FileName>}
              {albumArtFile && <FileName>{albumArtFile.name}<FileTypeTag>Square</FileTypeTag></FileName>}
              {Object.entries(backgroundFiles).map(([type, file]) => (
                <FileName key={type}>{file?.name}<FileTypeTag>BG</FileTypeTag></FileName>
              ))}
            </div>
          </div>
        )}
      </BulkDropZone>

      <FormGrid>
        <div>
          <InputLabel>{t('artistName')}</InputLabel>
          <Input
            type="text"
            name="artist"
            value={artist}
            onChange={handleMetadataChange}
            placeholder={t('artistName')}
          />
        </div>

        <div>
          <InputLabel>{t('songTitle')}</InputLabel>
          <Input
            type="text"
            name="songTitle"
            value={songTitle}
            onChange={handleMetadataChange}
            placeholder={t('songTitle')}
          />
        </div>

        <div>
          <InputLabel>{t('videoType')}</InputLabel>
          <Select
            name="videoType"
            value={videoType}
            onChange={handleMetadataChange}
          >
            <option value="Lyrics Video">{t('lyricsVideo')}</option>
            <option value="Vocal Only">{t('vocalOnly')}</option>
            <option value="Instrumental Only">{t('instrumentalOnly')}</option>
            <option value="Little Vocal">{t('littleVocalVideo')}</option>
          </Select>
        </div>
      </FormGrid>

      <Section>
        <FormGridWide>
          <div>
            <InputLabel>{t('mainAudioFile')}</InputLabel>
            <DropZone
              isDragging={isDragging['main']}
              onDrop={(e) => handleDrop(e, 'main')}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'main')}
              onDragLeave={(e) => handleDragLeave(e, 'main')}
              onClick={() => mainAudioInputRef.current?.click()}
            >
              <DropText>{t('dragAndDropAudio')}</DropText>
              <FileInput 
                ref={mainAudioInputRef}
                type="file" 
                accept="audio/*" 
                onChange={(e) => handleAudioChange(e, 'main')}
              />
              {mainAudioFile && (
                <FileName>{mainAudioFile.name}</FileName>
              )}
            </DropZone>
          </div>

          <div>
            <InputLabel>{t('lyricsFile')}</InputLabel>
            <DropZone
              isDragging={isDragging['lyrics']}
              onDrop={(e) => handleDrop(e, 'lyrics')}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'lyrics')}
              onDragLeave={(e) => handleDragLeave(e, 'lyrics')}
              onClick={() => lyricsInputRef.current?.click()}
            >
              <DropText>{t('dragAndDropJson')}</DropText>
              <FileInput 
                ref={lyricsInputRef}
                type="file" 
                accept=".json" 
                onChange={handleLyricsChange}
              />
              {lyricsFile && (
                <FileName>{lyricsFile.name}</FileName>
              )}
            </DropZone>
          </div>
        </FormGridWide>

        <FormGridWide>
          <div>
            <InputLabel>{t('instrumentalAudio')}</InputLabel>
            <DropZone
              isDragging={isDragging['instrumental']}
              onDrop={(e) => handleDrop(e, 'instrumental')}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'instrumental')}
              onDragLeave={(e) => handleDragLeave(e, 'instrumental')}
              onClick={() => instrumentalInputRef.current?.click()}
            >
              <DropText>{t('dragAndDropAudio')}</DropText>
              <FileInput 
                ref={instrumentalInputRef}
                type="file" 
                accept="audio/*" 
                onChange={(e) => handleAudioChange(e, 'instrumental')}
              />
              {instrumentalFile && (
                <FileName>{instrumentalFile.name}</FileName>
              )}
            </DropZone>
          </div>

          <div>
            <InputLabel>{t('vocalAudio')}</InputLabel>
            <DropZone
              isDragging={isDragging['vocal']}
              onDrop={(e) => handleDrop(e, 'vocal')}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'vocal')}
              onDragLeave={(e) => handleDragLeave(e, 'vocal')}
              onClick={() => vocalInputRef.current?.click()}
            >
              <DropText>{t('dragAndDropAudio')}</DropText>
              <FileInput 
                ref={vocalInputRef}
                type="file" 
                accept="audio/*" 
                onChange={(e) => handleAudioChange(e, 'vocal')}
              />
              {vocalFile && (
                <FileName>{vocalFile.name}</FileName>
              )}
            </DropZone>
          </div>
        </FormGridWide>

        <FormGridWide>
          <div>
            <InputLabel>{t('littleVocalAudio')}</InputLabel>
            <DropZone
              isDragging={isDragging['littleVocal']}
              onDrop={(e) => handleDrop(e, 'littleVocal')}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'littleVocal')}
              onDragLeave={(e) => handleDragLeave(e, 'littleVocal')}
              onClick={() => littleVocalInputRef.current?.click()}
            >
              <DropText>{t('dragAndDropAudio')}</DropText>
              <FileInput 
                ref={littleVocalInputRef}
                type="file" 
                accept="audio/*" 
                onChange={(e) => handleAudioChange(e, 'littleVocal')}
              />
              {littleVocalFile && (
                <FileName>{littleVocalFile.name}</FileName>
              )}
            </DropZone>
          </div>

          <div>
            <InputLabel>{t('albumArtOptional')}</InputLabel>
            <DropZone
              isDragging={isDragging['albumArt']}
              onDrop={(e) => handleDrop(e, 'albumArt')}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'albumArt')}
              onDragLeave={(e) => handleDragLeave(e, 'albumArt')}
              onClick={() => albumArtInputRef.current?.click()}
            >
              <DropText>{t('dragAndDropImage')}</DropText>
              <FileInput 
                ref={albumArtInputRef}
                type="file" 
                accept="image/*" 
                onChange={(e) => handleImageChange(e, 'albumArt')}
              />
              {albumArtFile && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PreviewImage src={URL.createObjectURL(albumArtFile)} alt="Album Art Preview" />
                  <FileName style={{ marginLeft: '0.5rem' }}>{albumArtFile.name}</FileName>
                </div>
              )}
            </DropZone>
          </div>
        </FormGridWide>
      </Section>

      <Section>
        <h3>{t('backgroundImages')}</h3>
        <InfoBox>
          <strong>{t('backgroundNote')}</strong>
        </InfoBox>

        <BackgroundGrid>
          {['Lyrics Video', 'Vocal Only', 'Instrumental Only', 'Little Vocal'].map((type) => (
            <div key={type}>
              <InputLabel>{t(type.toLowerCase().replace(' ', ''))}</InputLabel>
              <DropZone
                isDragging={isDragging[`background${type.replace(' ', '')}`]}
                onDrop={(e) => handleDrop(e, 'background', type as VideoMetadata['videoType'])}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, `background${type.replace(' ', '')}`)}
                onDragLeave={(e) => handleDragLeave(e, `background${type.replace(' ', '')}`)}
                onClick={() => {
                  const ref = {
                    'Lyrics Video': backgroundLyricsInputRef,
                    'Vocal Only': backgroundVocalInputRef,
                    'Instrumental Only': backgroundInstrumentalInputRef,
                    'Little Vocal': backgroundLittleVocalInputRef
                  }[type]!;
                  ref.current?.click();
                }}
              >
                <DropText>{t('dragAndDropImage')}</DropText>
                <FileInput 
                  ref={{
                    'Lyrics Video': backgroundLyricsInputRef,
                    'Vocal Only': backgroundVocalInputRef,
                    'Instrumental Only': backgroundInstrumentalInputRef,
                    'Little Vocal': backgroundLittleVocalInputRef
                  }[type]}
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageChange(e, 'background', type as VideoMetadata['videoType'])}
                />
                {backgroundFiles[type as VideoMetadata['videoType']] && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <PreviewImage 
                      src={URL.createObjectURL(backgroundFiles[type as VideoMetadata['videoType']]!)} 
                      alt={`${type} Background`} 
                    />
                    <FileName style={{ marginLeft: '0.5rem' }}>
                      {backgroundFiles[type as VideoMetadata['videoType']]?.name}
                    </FileName>
                  </div>
                )}
              </DropZone>
            </div>
          ))}
        </BackgroundGrid>
      </Section>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button 
          type="button" 
          onClick={resetForm}
          style={{ background: '#f44336' }}
        >
          {t('reset')}
        </Button>
      </div>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FormContainer>
  );
};

export default UploadForm;
