import React from 'react';
import { DropZone, DropText, FileName, FileTypeTag, FilePreviewContainer, PreviewImage } from './UploadForm.styles';

interface FileUploadSectionProps {
  label: string;
  dropText: string;
  isDragging: boolean;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement>;
  accept: string;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isImage?: boolean;
  tag?: string;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  label,
  dropText,
  isDragging,
  file,
  inputRef,
  accept,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onClick,
  onChange,
  isImage = false,
  tag
}) => {
  return (
    <div>
      <DropZone
        isDragging={isDragging}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onClick={onClick}
      >
        <DropText>{dropText}</DropText>
        <input 
          ref={inputRef}
          type="file" 
          accept={accept} 
          onChange={onChange}
          style={{ display: 'none' }}
        />
        {file && (
          isImage ? (
            <FilePreviewContainer>
              <PreviewImage 
                src={URL.createObjectURL(file)} 
                alt={label} 
              />
              <FileName>
                <span>{file.name}</span>
                {tag && <FileTypeTag>{tag}</FileTypeTag>}
              </FileName>
            </FilePreviewContainer>
          ) : (
            <FileName>
              <span>{file.name}</span>
              {tag && <FileTypeTag>{tag}</FileTypeTag>}
            </FileName>
          )
        )}
      </DropZone>
    </div>
  );
};

export default FileUploadSection;