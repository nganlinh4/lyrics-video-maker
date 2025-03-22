import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { LyricEntry } from '../types';
import VideoPreview from './VideoPreview';
import { Input, Select, InputLabel } from './StyledComponents';
import { analyzeAudio } from '../utils/audioAnalyzer';

const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

const FormContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: white;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
`;

const FileInput = styled.input`
  display: none;
`;

const DropZone = styled.div<{ isDragging?: boolean }>`
  width: 100%;
  padding: 2rem;
  margin: 0.5rem 0;
  border: 2px dashed ${props => props.isDragging ? '#6e8efb' : '#ddd'};
  border-radius: 4px;
  background-color: ${props => props.isDragging ? 'rgba(110, 142, 251, 0.1)' : 'transparent'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #6e8efb;
    background-color: rgba(110, 142, 251, 0.1);
  }
`;

const BulkDropZone = styled(DropZone)`
  background-color: #f8f9fa;
  border: 3px dashed #6e8efb;
  padding: 3rem;
  margin-bottom: 2rem;

  &:hover {
    background-color: rgba(110, 142, 251, 0.15);
  }
`;

const PreviewImage = styled.img`
  max-width: 100px;
  max-height: 100px;
  margin-top: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Button = styled.button`
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
  font-weight: bold;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const InfoBox = styled.div`
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
`;

const CodeExample = styled.pre`
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
  margin: 0.5rem 0;
`;

const FileName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #555;
`;

const DropText = styled.p`
  margin: 0;
  text-align: center;
  color: #666;
`;

const ErrorMessage = styled.div`
  color: #e53935;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
  border-radius: 4px;
  border-left: 4px solid #e53935;
`;

const FileTypeTag = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  background-color: #e3f2fd;
  color: #1976d2;
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
    metadata: VideoMetadata
  ) => void;
  onVideoPathChange: (path: string) => void;
  initialValues?: {
    audioFiles: AudioFiles;
    lyrics: LyricEntry[] | null;
    albumArtFile: File | null;
    backgroundFiles: { [key: string]: File | null };
    metadata: VideoMetadata;
  };
}

const UploadForm: React.FC<UploadFormProps> = ({ onFilesChange, onVideoPathChange, initialValues }) => {
  const [mainAudioFile, setMainAudioFile] = useState<File | null>(initialValues?.audioFiles.main || null);
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(initialValues?.audioFiles.instrumental || null);
  const [vocalFile, setVocalFile] = useState<File | null>(initialValues?.audioFiles.vocal || null);
  const [littleVocalFile, setLittleVocalFile] = useState<File | null>(initialValues?.audioFiles.littleVocal || null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(initialValues?.albumArtFile || null);
  const [backgroundFiles, setBackgroundFiles] = useState<{ [key in VideoMetadata['videoType']]?: File | null }>(
    initialValues?.backgroundFiles || {}
  );
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(initialValues?.lyrics || null);
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

    onFilesChange(audioFiles, lyrics, albumArtFile, backgroundFiles, metadata);
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
        completeMetadata
      );
    }, 500), // Wait 500ms after typing stops before updating
    [mainAudioFile, instrumentalFile, vocalFile, littleVocalFile, lyrics, albumArtFile, backgroundFiles]
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
        { artist, songTitle, videoType: value as VideoMetadata['videoType'], lyricsLineThreshold: 41, metadataPosition: -155, metadataWidth: 800 }
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
        updateFiles(); // Make sure this is called after setting the lyrics
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
    videoType?: VideoMetadata['videoType']
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
              updateFiles();
            } else {
              throw new Error('Invalid lyrics format');
            }
          } catch (err) {
            setError('Invalid lyrics file format');
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

      onFilesChange(audioFiles, lyrics, detectedAlbumArt, detectedBackgrounds, metadata);
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
      { artist: '', songTitle: '', videoType: 'Lyrics Video', lyricsLineThreshold: 41, metadataPosition: -155, metadataWidth: 800 }
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
      <h2>Upload Files</h2>
      
      <InfoBox>
        <strong>Quick Upload:</strong> Drop all your files at once! The system will automatically detect:
        <ul>
          <li>Audio files based on names (containing "music", "vocals", "+")</li>
          <li>JSON files for lyrics</li>
          <li>Square images for album art</li>
          <li>Non-square images for background</li>
        </ul>
      </InfoBox>

      <BulkDropZone
        isDragging={isDragging['bulk']}
        onDrop={handleBulkDrop}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, 'bulk')}
        onDragLeave={(e) => handleDragLeave(e, 'bulk')}
      >
        <DropText>
          <strong>Drop All Files Here</strong>
          <br />
          Drag and drop all your files at once for automatic categorization
        </DropText>
        {(mainAudioFile || instrumentalFile || vocalFile || littleVocalFile || lyricsFile || albumArtFile || Object.keys(backgroundFiles).length > 0) && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Detected Files:</h4>
            {mainAudioFile && <FileName>Main Audio: {mainAudioFile.name}<FileTypeTag>Main</FileTypeTag></FileName>}
            {instrumentalFile && <FileName>Instrumental: {instrumentalFile.name}<FileTypeTag>Music</FileTypeTag></FileName>}
            {vocalFile && <FileName>Vocals: {vocalFile.name}<FileTypeTag>Vocals</FileTypeTag></FileName>}
            {littleVocalFile && <FileName>Little Vocal: {littleVocalFile.name}<FileTypeTag>Little</FileTypeTag></FileName>}
            {lyricsFile && <FileName>Lyrics: {lyricsFile.name}<FileTypeTag>JSON</FileTypeTag></FileName>}
            {albumArtFile && <FileName>Album Art: {albumArtFile.name}<FileTypeTag>Square</FileTypeTag></FileName>}
            {Object.entries(backgroundFiles).map(([type, file]) => (
              <FileName key={type}>{type} Background: {file?.name}<FileTypeTag>Background</FileTypeTag></FileName>
            ))}
          </div>
        )}
      </BulkDropZone>

      <InfoBox>
        <strong>Note:</strong> You'll need the following files:
        <ol>
          <li>An audio file (MP3 or WAV)</li>
          <li>A JSON file with synchronized lyrics</li>
          <li>Album art image (optional)</li>
          <li>Background image (optional)</li>
        </ol>
        <CodeExample>
{`[
  {"start": 0.5, "end": 2.5, "text": "First line of lyrics"},
  {"start": 3.0, "end": 5.5, "text": "Second line of lyrics"},
  {"start": 6.0, "end": 9.0, "text": "Third line of lyrics"}
]`}
        </CodeExample>
        Each lyric entry needs "start" and "end" times (in seconds) and the "text" to display.
      </InfoBox>

      <div>
        <InputLabel>Artist Name</InputLabel>
        <Input
          type="text"
          name="artist"
          value={artist}
          onChange={handleMetadataChange}
          placeholder="Enter artist name"
        />
      </div>

      <div>
        <InputLabel>Song Title</InputLabel>
        <Input
          type="text"
          name="songTitle"
          value={songTitle}
          onChange={handleMetadataChange}
          placeholder="Enter song title"
        />
      </div>

      <div>
        <InputLabel>Video Type</InputLabel>
        <Select
          name="videoType"
          value={videoType}
          onChange={handleMetadataChange}
        >
          <option value="Lyrics Video">Lyrics Video</option>
          <option value="Vocal Only">Vocal Only</option>
          <option value="Instrumental Only">Instrumental Only</option>
          <option value="Little Vocal">Little Vocal</option>
        </Select>
      </div>

      <div>
        <InputLabel>Main Audio File (MP3, WAV)</InputLabel>
        <DropZone
          isDragging={isDragging['main']}
          onDrop={(e) => handleDrop(e, 'main')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'main')}
          onDragLeave={(e) => handleDragLeave(e, 'main')}
          onClick={() => mainAudioInputRef.current?.click()}
        >
          <DropText>Drag and drop an audio file here or click to browse</DropText>
          <FileInput 
            ref={mainAudioInputRef}
            type="file" 
            accept="audio/*" 
            onChange={(e) => handleAudioChange(e, 'main')}
          />
          {mainAudioFile && (
            <FileName>Selected: {mainAudioFile.name}</FileName>
          )}
        </DropZone>
      </div>

      <div>
        <InputLabel>Instrumental Audio (Optional)</InputLabel>
        <DropZone
          isDragging={isDragging['instrumental']}
          onDrop={(e) => handleDrop(e, 'instrumental')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'instrumental')}
          onDragLeave={(e) => handleDragLeave(e, 'instrumental')}
          onClick={() => instrumentalInputRef.current?.click()}
        >
          <DropText>Drag and drop instrumental audio or click to browse</DropText>
          <FileInput 
            ref={instrumentalInputRef}
            type="file" 
            accept="audio/*" 
            onChange={(e) => handleAudioChange(e, 'instrumental')}
          />
          {instrumentalFile && (
            <FileName>Selected: {instrumentalFile.name}</FileName>
          )}
        </DropZone>
      </div>

      <div>
        <InputLabel>Vocal Audio (Optional)</InputLabel>
        <DropZone
          isDragging={isDragging['vocal']}
          onDrop={(e) => handleDrop(e, 'vocal')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'vocal')}
          onDragLeave={(e) => handleDragLeave(e, 'vocal')}
          onClick={() => vocalInputRef.current?.click()}
        >
          <DropText>Drag and drop vocal audio or click to browse</DropText>
          <FileInput 
            ref={vocalInputRef}
            type="file" 
            accept="audio/*" 
            onChange={(e) => handleAudioChange(e, 'vocal')}
          />
          {vocalFile && (
            <FileName>Selected: {vocalFile.name}</FileName>
          )}
        </DropZone>
      </div>
      
      <div>
        <InputLabel>Little Vocal Audio (Optional)</InputLabel>
        <DropZone
          isDragging={isDragging['littleVocal']}
          onDrop={(e) => handleDrop(e, 'littleVocal')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'littleVocal')}
          onDragLeave={(e) => handleDragLeave(e, 'littleVocal')}
          onClick={() => littleVocalInputRef.current?.click()}
        >
          <DropText>Drag and drop pre-mixed little vocal audio or click to browse</DropText>
          <FileInput 
            ref={littleVocalInputRef}
            type="file" 
            accept="audio/*" 
            onChange={(e) => handleAudioChange(e, 'littleVocal')}
          />
          {littleVocalFile && (
            <FileName>Selected: {littleVocalFile.name}</FileName>
          )}
        </DropZone>
      </div>
      
      <div>
        <InputLabel>Lyrics File (JSON)</InputLabel>
        <DropZone
          isDragging={isDragging['lyrics']}
          onDrop={(e) => handleDrop(e, 'lyrics')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'lyrics')}
          onDragLeave={(e) => handleDragLeave(e, 'lyrics')}
          onClick={() => lyricsInputRef.current?.click()}
        >
          <DropText>Drag and drop a JSON file here or click to browse</DropText>
          <FileInput 
            ref={lyricsInputRef}
            type="file" 
            accept=".json" 
            onChange={handleLyricsChange}
          />
          {lyricsFile && (
            <FileName>Selected: {lyricsFile.name}</FileName>
          )}
        </DropZone>
      </div>
      
      <div>
        <InputLabel>Album Art (Optional)</InputLabel>
        <DropZone
          isDragging={isDragging['albumArt']}
          onDrop={(e) => handleDrop(e, 'albumArt')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'albumArt')}
          onDragLeave={(e) => handleDragLeave(e, 'albumArt')}
          onClick={() => albumArtInputRef.current?.click()}
        >
          <DropText>Drag and drop an image file here or click to browse</DropText>
          <FileInput 
            ref={albumArtInputRef}
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageChange(e, 'albumArt')}
          />
          {albumArtFile && (
            <>
              <PreviewImage src={URL.createObjectURL(albumArtFile)} alt="Album Art Preview" />
              <FileName>Selected: {albumArtFile.name}</FileName>
            </>
          )}
        </DropZone>
      </div>

      <Section>
        <h3>Background Images (Optional)</h3>
        <InfoBox>
          <strong>Note:</strong> You can upload a different background image for each video type. 
          Square images will be detected as album art, non-square images as backgrounds.
        </InfoBox>

        <div>
          <InputLabel>Background for Lyrics Video</InputLabel>
          <DropZone
            isDragging={isDragging['backgroundLyrics']}
            onDrop={(e) => handleDrop(e, 'background', 'Lyrics Video')}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'backgroundLyrics')}
            onDragLeave={(e) => handleDragLeave(e, 'backgroundLyrics')}
            onClick={() => backgroundLyricsInputRef.current?.click()}
          >
            <DropText>Drag and drop an image file here or click to browse</DropText>
            <FileInput 
              ref={backgroundLyricsInputRef}
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageChange(e, 'background', 'Lyrics Video')}
            />
            {backgroundFiles['Lyrics Video'] && (
              <>
                <PreviewImage src={URL.createObjectURL(backgroundFiles['Lyrics Video'])} alt="Lyrics Video Background" />
                <FileName>Selected: {backgroundFiles['Lyrics Video']?.name}</FileName>
              </>
            )}
          </DropZone>
        </div>

        <div>
          <InputLabel>Background for Vocal Only</InputLabel>
          <DropZone
            isDragging={isDragging['backgroundVocal']}
            onDrop={(e) => handleDrop(e, 'background', 'Vocal Only')}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'backgroundVocal')}
            onDragLeave={(e) => handleDragLeave(e, 'backgroundVocal')}
            onClick={() => backgroundVocalInputRef.current?.click()}
          >
            <DropText>Drag and drop an image file here or click to browse</DropText>
            <FileInput 
              ref={backgroundVocalInputRef}
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageChange(e, 'background', 'Vocal Only')}
            />
            {backgroundFiles['Vocal Only'] && (
              <>
                <PreviewImage src={URL.createObjectURL(backgroundFiles['Vocal Only'])} alt="Vocal Only Background" />
                <FileName>Selected: {backgroundFiles['Vocal Only']?.name}</FileName>
              </>
            )}
          </DropZone>
        </div>

        <div>
          <InputLabel>Background for Instrumental Only</InputLabel>
          <DropZone
            isDragging={isDragging['backgroundInstrumental']}
            onDrop={(e) => handleDrop(e, 'background', 'Instrumental Only')}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'backgroundInstrumental')}
            onDragLeave={(e) => handleDragLeave(e, 'backgroundInstrumental')}
            onClick={() => backgroundInstrumentalInputRef.current?.click()}
          >
            <DropText>Drag and drop an image file here or click to browse</DropText>
            <FileInput 
              ref={backgroundInstrumentalInputRef}
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageChange(e, 'background', 'Instrumental Only')}
            />
            {backgroundFiles['Instrumental Only'] && (
              <>
                <PreviewImage src={URL.createObjectURL(backgroundFiles['Instrumental Only'])} alt="Instrumental Only Background" />
                <FileName>Selected: {backgroundFiles['Instrumental Only']?.name}</FileName>
              </>
            )}
          </DropZone>
        </div>

        <div>
          <InputLabel>Background for Little Vocal</InputLabel>
          <DropZone
            isDragging={isDragging['backgroundLittleVocal']}
            onDrop={(e) => handleDrop(e, 'background', 'Little Vocal')}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, 'backgroundLittleVocal')}
            onDragLeave={(e) => handleDragLeave(e, 'backgroundLittleVocal')}
            onClick={() => backgroundLittleVocalInputRef.current?.click()}
          >
            <DropText>Drag and drop an image file here or click to browse</DropText>
            <FileInput 
              ref={backgroundLittleVocalInputRef}
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageChange(e, 'background', 'Little Vocal')}
            />
            {backgroundFiles['Little Vocal'] && (
              <>
                <PreviewImage src={URL.createObjectURL(backgroundFiles['Little Vocal'])} alt="Little Vocal Background" />
                <FileName>Selected: {backgroundFiles['Little Vocal']?.name}</FileName>
              </>
            )}
          </DropZone>
        </div>
      </Section>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button 
          type="button" 
          onClick={resetForm}
          style={{ background: '#f44336' }}
        >
          Reset
        </Button>
      </div>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FormContainer>
  );
};

export default UploadForm;
