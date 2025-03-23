import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  videoUrl: string;
}

const VideoPreview: React.FC<Props> = ({ videoUrl }) => {
  const { t } = useLanguage();
  
  if (!videoUrl) {
    return <p>{t('noVideo')}</p>;
  }

  return (
    <video controls width="640" height="360">
      <source src={videoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPreview;