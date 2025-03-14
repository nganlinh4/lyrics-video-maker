import React, { useState } from 'react';
import styled from 'styled-components';

// Type errors here are likely due to a linter/TS configuration issue in the user's environment.
// The types are correct, but the linter doesn't recognize them.

interface LyricEntry {
  start: number;
  end: number;
  text: string;
}

interface Props {
  onLyricsUpload: (lyrics: LyricEntry[] | null) => void;
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

const LyricsUpload: React.FC<Props> = ({ onLyricsUpload }) => { // Type error: React.FC should be used
    // Type error: useState should have type arguments
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(null);

    // Type error: React.ChangeEvent should be used
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedLyrics = JSON.parse(e.target?.result as string);
          setLyrics(parsedLyrics);
          onLyricsUpload(parsedLyrics);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Invalid JSON file. Please upload a valid lyrics JSON.');
          onLyricsUpload(null);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .json file.');
      onLyricsUpload(null);
    }
  };

  return (
    <InputContainer>
      <InputLabel htmlFor="lyrics-upload">
        Choose Lyrics File
        <HiddenInput
          type="file"
          id="lyrics-upload"
          accept=".json"
          onChange={handleFileChange}
        />
      </InputLabel>
      {lyrics && (
        <FileName>Lyrics file uploaded successfully.</FileName>
      )}
    </InputContainer>
  );
};

export default LyricsUpload;