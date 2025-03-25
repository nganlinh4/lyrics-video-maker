import React from 'react';
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
          </FileName>
        </CompactFilePreview>
      ))}
    </CompactFileGrid>
  );
};

export default FilePreviewSection;