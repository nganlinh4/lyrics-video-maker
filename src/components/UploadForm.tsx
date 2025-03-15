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
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
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
  font-size: 0.9rem;
  color: #555;
  margin-top: 0.5rem;
`;

const UploadForm: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string>('');
  const audioInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file (MP3, WAV, etc.)');
        return;
      }
      setAudioFile(file);
      setError(null);
    }
  };

  const handleLyricsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLyricsFile(file);
      
      try {
        // Read and parse the JSON file
        const text = await file.text();
        const parsedLyrics = JSON.parse(text);
        
        // Validate the lyrics format
        if (!Array.isArray(parsedLyrics)) {
          throw new Error('Lyrics file must contain a JSON array');
        }
        
        // Check if each lyric entry has the required properties
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
      } catch (err) {
        setError(`Invalid lyrics file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLyrics(null);
      }
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setLyricsFile(null);
    setLyrics(null);
    setError(null);
    setSuccess(null);
    setProgress(0);
    setVideoPath('');
    
    // Reset file inputs
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (lyricsInputRef.current) lyricsInputRef.current.value = '';
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

      // Start the rendering process
      const outputPath = await remotionService.renderVideo(audioFile, lyrics, (progress) => {
        setProgress(progress.progress * 100);
        if (progress.status === 'error') {
          setError(progress.error || 'An error occurred during rendering');
          setIsRendering(false);
        }
      });


      setProgress(100);
      setSuccess(`Video rendered successfully!`);
      setVideoPath(outputPath);

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
          <strong>Note:</strong> You'll need two files to create a lyrics video:
          <ol>
            <li>An audio file (MP3 or WAV)</li>
            <li>A JSON file with synchronized lyrics in the following format:</li>
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
          </div>
          
          <div>
            <InputLabel>Lyrics File (JSON)</InputLabel>
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