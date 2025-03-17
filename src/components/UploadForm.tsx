import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { LyricEntry } from '../types';
import remotionService from '../services/remotionService';
import VideoPreview from './VideoPreview';

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

const InputLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
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

const Progress = styled.div<{ progress: number }>`
  width: 100%;
  height: 20px;
  background: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 1rem;
  position: relative;

  &::after {
    content: '';
    display: block;
    width: ${props => props.progress}%;
    height: 100%;
    background: linear-gradient(90deg, #6e8efb 0%, #a777e3 100%);
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #333;
  z-index: 1;
`;

const ErrorMessage = styled.div`
  color: #e53935;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
  border-radius: 4px;
  border-left: 4px solid #e53935;
`;

const SuccessMessage = styled.div`
  color: #43a047;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #e8f5e9;
  border-radius: 4px;
  border-left: 4px solid #43a047;
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

interface UploadFormProps {
  onFilesChange: (audioFile: File | null, lyrics: LyricEntry[] | null, albumArt: File | null, background: File | null) => void;
  onVideoPathChange: (path: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onFilesChange, onVideoPathChange }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<{[key: string]: boolean}>({});
  const [videoPath, setVideoPath] = useState<string | null>(null);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);
  const albumArtInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file (MP3, WAV, etc.)');
        return;
      }
      setAudioFile(file);
      setError(null);
      onFilesChange(file, lyrics, albumArtFile, backgroundFile);
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
          throw new Error('Lyrics file must contain a JSON array');
        }
        
        const validLyrics = parsedLyrics.every((lyric: any) => 
          typeof lyric.start === 'number' && 
          typeof lyric.end === 'number' && 
          typeof lyric.text === 'string'
        );
        
        if (!validLyrics) {
          throw new Error('Each lyric entry must have start, end (numbers) and text (string) properties');
        }
        
        setLyrics(parsedLyrics);
        setError(null);
        onFilesChange(audioFile, parsedLyrics, albumArtFile, backgroundFile);
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
        onFilesChange(audioFile, lyrics, file, backgroundFile);
      } else {
        setBackgroundFile(file);
        onFilesChange(audioFile, lyrics, albumArtFile, file);
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

  const handleDrop = async (e: React.DragEvent, type: 'audio' | 'lyrics' | 'albumArt' | 'background') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      switch (type) {
        case 'audio':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setAudioFile(file);
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
              onFilesChange(audioFile, parsedLyrics, albumArtFile, backgroundFile);
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
            onFilesChange(audioFile, lyrics, file, backgroundFile);
          } else {
            setBackgroundFile(file);
            onFilesChange(audioFile, lyrics, albumArtFile, file);
          }
          break;
      }
      setError(null);
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setLyricsFile(null);
    setAlbumArtFile(null);
    setBackgroundFile(null);
    setLyrics(null);
    setError(null);
    setSuccess(null);
    setProgress(0);
    
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (lyricsInputRef.current) lyricsInputRef.current.value = '';
    if (albumArtInputRef.current) albumArtInputRef.current.value = '';
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !lyrics) {
      setError('Please upload both audio and lyrics files');
      return;
    }

    try {
      setIsRendering(true);
      setError(null);
      setSuccess(null);

      const audio = new Audio(URL.createObjectURL(audioFile));
      const duration = await new Promise<number>(resolve => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
        });
      });

      const outputPath = await remotionService.renderVideo(
        audioFile,
        lyrics,
        duration,
        {
          albumArtUrl: albumArtFile ? URL.createObjectURL(albumArtFile) : undefined,
          backgroundImageUrl: backgroundFile ? URL.createObjectURL(backgroundFile) : undefined,
        },
        (progress) => {
          setProgress(progress.progress * 100);
          if (progress.status === 'error') {
            setError(progress.error || 'An error occurred during rendering');
            setIsRendering(false);
          }
        }
      );

      setProgress(100);
      onVideoPathChange(outputPath);
      setVideoPath(outputPath);
      onVideoPathChange(outputPath);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRendering(false);
    }
  };

  return (
    <FormContainer>
      <h2>Create Lyrics Video</h2>
      
      <Section>
        <h3>Step 1: Upload Files</h3>
        
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

        <form onSubmit={handleSubmit}>
          <div>
            <InputLabel>Audio File (MP3, WAV, etc.)</InputLabel>
            <DropZone
              isDragging={isDragging['audio']}
              onDrop={(e) => handleDrop(e, 'audio')}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'audio')}
              onDragLeave={(e) => handleDragLeave(e, 'audio')}
              onClick={() => audioInputRef.current?.click()}
            >
              <DropText>Drag and drop an audio file here or click to browse</DropText>
              <FileInput 
                ref={audioInputRef}
                type="file" 
                accept="audio/*" 
                onChange={handleAudioChange}
                disabled={isRendering}
              />
              {audioFile && (
                <FileName>Selected: {audioFile.name}</FileName>
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
                disabled={isRendering}
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
                disabled={isRendering}
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
                disabled={isRendering}
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
              type="submit" 
              disabled={!audioFile || !lyrics || isRendering}
            >
              {isRendering ? 'Rendering...' : 'Create Video'}
            </Button>
            
            <Button 
              type="button" 
              onClick={resetForm}
              disabled={isRendering}
              style={{ background: '#f44336' }}
            >
              Reset
            </Button>
          </div>
          
          {isRendering && (
            <div style={{ marginTop: '1rem' }}>
              <Progress progress={progress}>
                <ProgressText>{Math.round(progress)}%</ProgressText>
              </Progress>
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                Rendering your video... Please wait.
              </div>
            </div>
          )}
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </form>
      </Section>
      
      {videoPath && (
        <Section>
          <h3>Step 2: Your Rendered Video</h3>
          <VideoPreview videoUrl={videoPath} />
        </Section>
      )}
    </FormContainer>
  );
};

export default UploadForm;
