import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { 
  
  CompactFileGrid,
  CompactFilePreview,
  FileIcon,
  FileName,
  CompactFileTag,
  PreviewImage
} from './UploadForm.styles';
import { 
  BsMusicNoteBeamed, 
  BsFileEarmarkText 
} from 'react-icons/bs';
import { 
  MdOutlineLibraryMusic 
} from 'react-icons/md';
import { 
  HiOutlineMicrophone 
} from 'react-icons/hi';

interface FilePreviewSectionProps {
  mainAudioFile: File | null;
  instrumentalFile: File | null;
  vocalFile: File | null;
  littleVocalFile: File | null;
  lyricsFile: File | null;
  albumArtFile: File | null;
  backgroundFiles: Record<string, File | null>;
}

const FilePreviewSection: React.FC<FilePreviewSectionProps> = ({
  mainAudioFile,
  instrumentalFile,
  vocalFile,
  littleVocalFile,
  lyricsFile,
  albumArtFile,
  backgroundFiles
}) => {
  const [fileStatus, setFileStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkFiles = async () => {
      const status = {
        main: !!mainAudioFile,
        instrumental: !!instrumentalFile,
        vocal: !!vocalFile,
        littleVocal: !!littleVocalFile
      };
      setFileStatus(status);
    };
    checkFiles();
  }, [mainAudioFile, instrumentalFile, vocalFile, littleVocalFile]);

  return (
    <CompactFileGrid>
      {mainAudioFile && (
        <CompactFilePreview>
          <FileIcon type="Main">
            <BsMusicNoteBeamed />
          </FileIcon>
          <FileName>
            <span>{mainAudioFile.name}</span>
            <CompactFileTag>Main</CompactFileTag>
            {fileStatus.main && <CompactFileTag status="success">✓</CompactFileTag>}
            <FileSize>{formatFileSize(mainAudioFile.size)}</FileSize>
          </FileName>
        </CompactFilePreview>
      )}
      {instrumentalFile && (
        <CompactFilePreview>
          <FileIcon type="Music">
            <MdOutlineLibraryMusic />
          </FileIcon>
          <FileName>
            <span>{instrumentalFile.name}</span>
            <CompactFileTag>Music</CompactFileTag>
            {fileStatus.instrumental && <CompactFileTag status="success">✓</CompactFileTag>}
            <FileSize>{formatFileSize(instrumentalFile.size)}</FileSize>
          </FileName>
        </CompactFilePreview>
      )}
      {vocalFile && (
        <CompactFilePreview>
          <FileIcon type="Vocals">
            <HiOutlineMicrophone />
          </FileIcon>
          <FileName>
            <span>{vocalFile.name}</span>
            <CompactFileTag>Vocals</CompactFileTag>
            {fileStatus.vocal && <CompactFileTag status="success">✓</CompactFileTag>}
            <FileSize>{formatFileSize(vocalFile.size)}</FileSize>
          </FileName>
        </CompactFilePreview>
      )}
      {littleVocalFile && (
        <CompactFilePreview>
          <FileIcon type="Little">
            <HiOutlineMicrophone />
          </FileIcon>
          <FileName>
            <span>{littleVocalFile.name}</span>
            <CompactFileTag>Little</CompactFileTag>
            {fileStatus.littleVocal && <CompactFileTag status="success">✓</CompactFileTag>}
            <FileSize>{formatFileSize(littleVocalFile.size)}</FileSize>
          </FileName>
        </CompactFilePreview>
      )}
      {lyricsFile && (
        <CompactFilePreview>
          <FileIcon type="JSON">
            <BsFileEarmarkText />
          </FileIcon>
          <FileName>
            <span>{lyricsFile.name}</span>
            <CompactFileTag>JSON</CompactFileTag>
            <CompactFileTag status="success">✓</CompactFileTag>
            <FileSize>{formatFileSize(lyricsFile.size)}</FileSize>
          </FileName>
        </CompactFilePreview>
      )}
      {albumArtFile && (
        <CompactFilePreview>
          <PreviewImage 
            src={URL.createObjectURL(albumArtFile)} 
            alt="Album Art Preview" 
          />
          <FileName>
            <span>{albumArtFile.name}</span>
            <CompactFileTag>Square</CompactFileTag>
            <CompactFileTag status="success">✓</CompactFileTag>
            <FileSize>{formatFileSize(albumArtFile.size)}</FileSize>
          </FileName>
        </CompactFilePreview>
      )}
      {Object.entries(backgroundFiles).map(([type, file]) => (
        <CompactFilePreview key={type}>
          <PreviewImage 
            src={URL.createObjectURL(file!)} 
            alt={`${type} Background`} 
          />
          <FileName>
            <span>{file?.name}</span>
            <CompactFileTag>BG</CompactFileTag>
            <CompactFileTag status="success">✓</CompactFileTag>
            <FileSize>{file ? formatFileSize(file.size) : ''}</FileSize>
          </FileName>
        </CompactFilePreview>
      ))}
    </CompactFileGrid>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileSize = styled.span`
  font-size: 0.7rem;
  color: var(--text-secondary);
`;

export default FilePreviewSection;