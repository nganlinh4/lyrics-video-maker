import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  FormContainer,
  Section,
  InfoBox,
  Button,
  ErrorMessage,
  FormGridWide,
  BackgroundGrid,
  DropZone,
  DropText
} from './UploadForm.styles';
import { UploadFormProps } from './UploadForm.types';
import { useUploadFormHandlers } from './UploadForm.hooks';
import FilePreviewSection from './FilePreviewSection';
import MetadataFormSection from './MetadataFormSection';
import FileUploadSection from './FileUploadSection';

const UploadForm: React.FC<UploadFormProps> = ({ 
  onFilesChange, 
  onVideoPathChange, 
  initialValues 
}) => {
  const { t } = useLanguage();
  const {
    mainAudioFile,
    instrumentalFile,
    vocalFile,
    littleVocalFile,
    lyrics,
    lyricsFile,
    albumArtFile,
    backgroundFiles,
    error,
    isDragging,
    videoPath,
    artist,
    songTitle,
    videoType,
    mainAudioInputRef,
    lyricsInputRef,
    albumArtInputRef,
    instrumentalInputRef,
    vocalInputRef,
    littleVocalInputRef,
    backgroundLyricsInputRef,
    backgroundVocalInputRef,
    backgroundInstrumentalInputRef,
    backgroundLittleVocalInputRef,
    handleMetadataChange,
    handleAudioChange,
    handleLyricsChange,
    handleImageChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleBulkDrop,
    resetForm,
    handleBackgroundClick
  } = useUploadFormHandlers(initialValues, onFilesChange, onVideoPathChange);

  return (
    <FormContainer>      
      <InfoBox>
        <strong>{t('quickUpload')}:</strong> {t('quickUploadDescription')}
      </InfoBox>

      <Section>
        <h3>{t('requiredFiles')}</h3>
        <InfoBox>{t('audioFilesByNames')}, {t('jsonForLyrics')}, {t('squareImages')}, {t('nonSquareImages')}</InfoBox>
        <DropZone
          isDragging={isDragging['bulk']}
          onDrop={handleBulkDrop}
          onDragOver={handleDragOver}
          onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, 'bulk')}
          onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, 'bulk')}
        >
          <DropText>
            <strong>{t('dropAllFiles')}</strong>
            <br />
            {t('dragAndDropAll')}
          </DropText>
          {(mainAudioFile || instrumentalFile || vocalFile || littleVocalFile || lyricsFile || albumArtFile || Object.keys(backgroundFiles).length > 0) && (
            <div style={{ marginTop: '0.75rem', width: '100%' }}>
              <h4>{t('detectedFiles')}</h4>
              <FilePreviewSection
                mainAudioFile={mainAudioFile}
                instrumentalFile={instrumentalFile}
                vocalFile={vocalFile}
                littleVocalFile={littleVocalFile}
                lyricsFile={lyricsFile}
                albumArtFile={albumArtFile}
                backgroundFiles={backgroundFiles}
              />
            </div>
          )}
        </DropZone>
      </Section>

      <MetadataFormSection
        artist={artist}
        songTitle={songTitle}
        videoType={videoType}
        handleMetadataChange={handleMetadataChange}
        t={t}
      />

      <Section>
        <FormGridWide>
          <FileUploadSection
            label={t('mainAudioFile')}
            dropText={t('dragAndDropAudio')}
            isDragging={isDragging['main']}
            file={mainAudioFile}
            inputRef={mainAudioInputRef as React.RefObject<HTMLInputElement>}
            accept="audio/*"
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'main')}
            onDragOver={handleDragOver}
            onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, 'main')}
            onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, 'main')}
            onClick={() => mainAudioInputRef.current?.click()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAudioChange(e, 'main')}
            tag="Main"
          />

          <FileUploadSection
            label={t('lyricsFile')}
            dropText={t('dragAndDropJson')}
            isDragging={isDragging['lyrics']}
            file={lyricsFile}
            inputRef={lyricsInputRef as React.RefObject<HTMLInputElement>}
            accept=".json"
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'lyrics')}
            onDragOver={handleDragOver}
            onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, 'lyrics')}
            onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, 'lyrics')}
            onClick={() => lyricsInputRef.current?.click()}
            onChange={handleLyricsChange}
            tag="JSON"
          />
        </FormGridWide>

        <FormGridWide>
          <FileUploadSection
            label={t('instrumentalAudio')}
            dropText={t('dragAndDropAudio')}
            isDragging={isDragging['instrumental']}
            file={instrumentalFile}
            inputRef={instrumentalInputRef as React.RefObject<HTMLInputElement>}
            accept="audio/*"
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'instrumental')}
            onDragOver={handleDragOver}
            onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, 'instrumental')}
            onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, 'instrumental')}
            onClick={() => instrumentalInputRef.current?.click()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAudioChange(e, 'instrumental')}
            tag="Music"
          />

          <FileUploadSection
            label={t('vocalAudio')}
            dropText={t('dragAndDropAudio')}
            isDragging={isDragging['vocal']}
            file={vocalFile}
            inputRef={vocalInputRef as React.RefObject<HTMLInputElement>}
            accept="audio/*"
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'vocal')}
            onDragOver={handleDragOver}
            onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, 'vocal')}
            onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, 'vocal')}
            onClick={() => vocalInputRef.current?.click()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAudioChange(e, 'vocal')}
            tag="Vocals"
          />
        </FormGridWide>

        <FormGridWide>
          <FileUploadSection
            label={t('littleVocalAudio')}
            dropText={t('dragAndDropAudio')}
            isDragging={isDragging['littleVocal']}
            file={littleVocalFile}
            inputRef={littleVocalInputRef as React.RefObject<HTMLInputElement>}
            accept="audio/*"
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'littleVocal')}
            onDragOver={handleDragOver}
            onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, 'littleVocal')}
            onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, 'littleVocal')}
            onClick={() => littleVocalInputRef.current?.click()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAudioChange(e, 'littleVocal')}
            tag="Little"
          />

          <FileUploadSection
            label={t('albumArtOptional')}
            dropText={t('dragAndDropImage')}
            isDragging={isDragging['albumArt']}
            file={albumArtFile}
            inputRef={albumArtInputRef as React.RefObject<HTMLInputElement>}
            accept="image/*"
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'albumArt')}
            onDragOver={handleDragOver}
            onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, 'albumArt')}
            onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, 'albumArt')}
            onClick={() => albumArtInputRef.current?.click()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e, 'albumArt')}
            isImage={true}
            tag="Square"
          />
        </FormGridWide>
      </Section>

      <Section>
        <h3>{t('backgroundForType')} {t(videoType.toLowerCase().replace(' ', ''))}</h3>
        <InfoBox>
          <strong>{t('backgroundNote')}</strong>
        </InfoBox>

        <BackgroundGrid>
          {['Lyrics Video', 'Vocal Only', 'Instrumental Only', 'Little Vocal'].map((type) => (
            <FileUploadSection
              key={type}
              label={t(type.toLowerCase().replace(' ', ''))}
              dropText={t('dragAndDropImage')}
              isDragging={isDragging[`background${type.replace(' ', '')}`]}
              file={backgroundFiles[type as keyof typeof backgroundFiles]}
              inputRef={{
                'Lyrics Video': backgroundLyricsInputRef,
                'Vocal Only': backgroundVocalInputRef,
                'Instrumental Only': backgroundInstrumentalInputRef,
                'Little Vocal': backgroundLittleVocalInputRef
              }[type] as React.RefObject<HTMLInputElement>}
              accept="image/*"
              onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, 'background', type as any)}
              onDragOver={handleDragOver}
              onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleDragEnter(e, `background${type.replace(' ', '')}`)}
              onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e, `background${type.replace(' ', '')}`)}
              onClick={() => handleBackgroundClick(type as any)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e, 'background', type as any)}
              isImage={true}
              tag={type}
            />
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