import React from 'react';
import { Input, Select, InputLabel } from '../StyledComponents';
import { FormGrid } from './UploadForm.styles';

interface MetadataFormSectionProps {
  artist: string;
  songTitle: string;
  videoType: string;
  handleMetadataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  t: (key: string) => string;
}

const MetadataFormSection: React.FC<MetadataFormSectionProps> = ({
  artist,
  songTitle,
  videoType,
  handleMetadataChange,
  t
}) => {
  return (
    <FormGrid>
      <div>
        <InputLabel>{t('artistName')}</InputLabel>
        <Input
          type="text"
          name="artist"
          value={artist}
          onChange={handleMetadataChange}
          placeholder={t('artistName')}
        />
      </div>

      <div>
        <InputLabel>{t('songTitle')}</InputLabel>
        <Input
          type="text"
          name="songTitle"
          value={songTitle}
          onChange={handleMetadataChange}
          placeholder={t('songTitle')}
        />
      </div>

      <div>
        <InputLabel>{t('videoType')}</InputLabel>
        <Select
          name="videoType"
          value={videoType}
          onChange={handleMetadataChange}
        >
          <option value="Lyrics Video">{t('lyricsVideo')}</option>
          <option value="Vocal Only">{t('vocalOnly')}</option>
          <option value="Instrumental Only">{t('instrumentalOnly')}</option>
          <option value="Little Vocal">{t('littleVocalVideo')}</option>
        </Select>
      </div>
    </FormGrid>
  );
};

export default MetadataFormSection;