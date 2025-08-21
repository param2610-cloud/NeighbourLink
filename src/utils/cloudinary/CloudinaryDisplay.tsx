import React from 'react';
import { getCloudinaryUrl } from './cloudinary';

export interface ImageDisplayProps {
  publicId: string;
  className?: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ publicId, className = '' }) => {
  if (!publicId) return <div className="error">No image ID provided</div>;
  
  const imageUrl = getCloudinaryUrl(publicId);
  
  return <img src={imageUrl} alt="Image" className={`cloudinary-image ${className}`} />;
};

export interface VideoDisplayProps {
  publicId: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({ 
  publicId, 
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  controls = true
}) => {
  if (!publicId) return <div className="error">No video ID provided</div>;
  
  const videoUrl = getCloudinaryUrl(publicId, { resource_type: 'video' });
  
  return (
    <video
      src={videoUrl}
      className={`video-player ${className}`}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      controls={controls}
    />
  );
};