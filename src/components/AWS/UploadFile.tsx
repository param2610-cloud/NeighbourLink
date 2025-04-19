import { uploadFileToS3, getSignedImageUrl } from '@/utils/aws/aws';
import React, { useState, useEffect } from 'react';

const UploadFiletoAWS = () => {
  const [, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null >(null);
  const [objectKey, setObjectKey] = useState<string | null>(null); // Add state for the S3 object key
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setIsUploading(true);
      setError(null);
      
      try {
        // Store the S3 key separately from the URL
        const key = file.name;
        const url = await uploadFileToS3(file, key);
        setPhotoUrl(url);
        setObjectKey(key); // Save the S3 object key
        console.log("Photo URL:", url);
        console.log("Object Key:", key);
      } catch (err) {
        setError("Upload failed. Please try again.");
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="upload-container">
      <input 
        type="file" 
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {isUploading && <p>Uploading...</p>}
      {error && <p className="error">{error}</p>}
      
      {photoUrl && objectKey && (
        <div className="preview">
          <p>File uploaded successfully!</p>
          <a href={photoUrl} target="_blank" rel="noopener noreferrer">
            View uploaded file
          </a>
          <ImageDisplay objectKey={objectKey} /> {/* Pass objectKey, not photoUrl */}
        </div>
      )}
    </div>
  );
};

export interface ImageDisplayProps {
  objectKey: string;
  className?: string; // Make className optional
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ objectKey, className = '' }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const signedUrl = await getSignedImageUrl(objectKey);
        setImageUrl(signedUrl);
      } catch (err) {
        setError('Failed to load image');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [objectKey]);

  if (loading) return <div>Loading image...</div>;
  if (error) return <div className="error">{error}</div>;
  console.log('imageUrl:', imageUrl); // Log the image URL for debugging
  
  
  return <img src={imageUrl} alt="S3 Image" className={`s3-image ${className}`} />;
};

export default UploadFiletoAWS;