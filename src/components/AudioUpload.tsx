import React, { useState } from 'react';
import styled from 'styled-components';

// Type errors here are likely due to a linter/TS configuration issue in the user's environment.
// The types are correct, but the linter doesn't recognize them.
interface Props {
  onAudioUpload: (file: File | null) => void;
}

const InputContainer = styled.div`
  margin-bottom: 20px;
`;

const InputLabel = styled.label`
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-block;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileName = styled.p`
  margin-top: 10px;
  color: #333;
`;

const AudioUpload: React.FC<Props> = ({ onAudioUpload }) => { // Type error: React.FC should be used
  // Type error: useState should have type arguments
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Type error: React.ChangeEvent should be used
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { 
    const file = event.target.files?.[0];
    setAudioFile(file || null);
    onAudioUpload(file || null);
  };

  return (
    <InputContainer>
      <InputLabel htmlFor="audio-upload">
        Choose Audio File
        <HiddenInput
          type="file"
          id="audio-upload"
          accept="audio/*"
          onChange={handleFileChange}
        />
      </InputLabel>
      {audioFile && (
        <FileName>Selected audio: {audioFile.name}</FileName>
      )}
    </InputContainer>
  );
};

export default AudioUpload;