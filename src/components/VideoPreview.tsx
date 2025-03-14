import React from 'react';

interface Props {
  videoUrl: string;
}

const VideoPreview: React.FC<Props> = ({ videoUrl }) => {
  if (!videoUrl) {
    return <p>No video to preview.</p>;
  }

  return (
    <video controls width="640" height="360">
      <source src={videoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPreview;