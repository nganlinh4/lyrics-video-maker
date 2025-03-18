import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { LyricEntry } from '../types';
import VideoPreview from './VideoPreview';
import { Input, Select, InputLabel } from './StyledComponents';

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
}

interface UploadFormProps {
  onFilesChange: (
    audioFiles: AudioFiles,
    lyrics: LyricEntry[] | null, 
    albumArt: File | null, 
    background: File | null,
    metadata: VideoMetadata
  ) => void;
  onVideoPathChange: (path: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onFilesChange, onVideoPathChange }) => {
  const [mainAudioFile, setMainAudioFile] = useState<File | null>(null);
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(null);
  const [vocalFile, setVocalFile] = useState<File | null>(null);
  const [littleVocalFile, setLittleVocalFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<{[key: string]: boolean}>({});
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [artist, setArtist] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [videoType, setVideoType] = useState<VideoMetadata['videoType']>('Lyrics Video');
  
  const mainAudioInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);
  const albumArtInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const instrumentalInputRef = useRef<HTMLInputElement>(null);
  const vocalInputRef = useRef<HTMLInputElement>(null);
  const littleVocalInputRef = useRef<HTMLInputElement>(null);

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
      videoType
    };

    onFilesChange(audioFiles, lyrics, albumArtFile, backgroundFile, metadata);
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Update the state based on which field changed
    if (name === 'artist') {
      setArtist(value);
    } else if (name === 'songTitle') {
      setSongTitle(value);
    } else if (name === 'videoType') {
      setVideoType(value as VideoMetadata['videoType']);
    }

    // Use a proper React effect instead of setTimeout to ensure state is updated
    setTimeout(() => {
      const metadata: VideoMetadata = {
        artist: name === 'artist' ? value : artist,
        songTitle: name === 'songTitle' ? value : songTitle,
        videoType: name === 'videoType' ? value as VideoMetadata['videoType'] : videoType
      };

      onFilesChange(
        { main: mainAudioFile, instrumental: instrumentalFile, vocal: vocalFile, littleVocal: littleVocalFile },
        lyrics,
        albumArtFile,
        backgroundFile,
        metadata
      );
    }, 0);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'instrumental' | 'vocal' | 'littleVocal') => {
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
      updateFiles(); // Make sure this is called after setting the file
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'albumArt' | 'background') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.)');
        return;
      }
      if (type === 'albumArt') {
        setAlbumArtFile(file);
        updateFiles();
      } else {
        setBackgroundFile(file);
        updateFiles();
      }
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

  const handleDrop = async (e: React.DragEvent, type: 'main' | 'lyrics' | 'albumArt' | 'background' | 'instrumental' | 'vocal' | 'littleVocal') => {
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
          break;
        case 'instrumental':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setInstrumentalFile(file);
          break;
        case 'vocal':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setVocalFile(file);
          break;
        case 'littleVocal':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setLittleVocalFile(file);
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
            updateFiles();
          } else {
            setBackgroundFile(file);
            updateFiles();
          }
          break;
      }
      setError(null);
    }
  };

  const resetForm = () => {
    setMainAudioFile(null);
    setInstrumentalFile(null);
    setVocalFile(null);
    setLittleVocalFile(null);
    setLyricsFile(null);
    setAlbumArtFile(null);
    setBackgroundFile(null);
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
      null,
      { artist: '', songTitle: '', videoType: 'Lyrics Video' }
    );
    
    if (mainAudioInputRef.current) mainAudioInputRef.current.value = '';
    if (lyricsInputRef.current) lyricsInputRef.current.value = '';
    if (albumArtInputRef.current) albumArtInputRef.current.value = '';
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    if (instrumentalInputRef.current) instrumentalInputRef.current.value = '';
    if (vocalInputRef.current) vocalInputRef.current.value = '';
    if (littleVocalInputRef.current) littleVocalInputRef.current.value = '';
  };

  return (
    <FormContainer>
      <h2>Upload Files</h2>
      
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

      <div>
        <InputLabel>Background Image (Optional)</InputLabel>
        <DropZone
          isDragging={isDragging['background']}
          onDrop={(e) => handleDrop(e, 'background')}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, 'background')}
          onDragLeave={(e) => handleDragLeave(e, 'background')}
          onClick={() => backgroundInputRef.current?.click()}
        >
          <DropText>Drag and drop an image file here or click to browse</DropText>
          <FileInput 
            ref={backgroundInputRef}
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageChange(e, 'background')}
          />
          {backgroundFile && (
            <>
              <PreviewImage src={URL.createObjectURL(backgroundFile)} alt="Background Preview" />
              <FileName>Selected: {backgroundFile.name}</FileName>
            </>
          )}
        </DropZone>
      </div>

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
