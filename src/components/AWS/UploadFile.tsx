import { uploadFileToS3 } from '@/aws';
import React, { useState } from 'react';

const UploadFiletoAWS = () => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setIsUploading(true);
      setError(null);
      
      try {
        const url = await uploadFileToS3(file, file.name);
        setPhotoUrl(url);
        console.log("Photo URL:", url);
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
      
      {photoUrl && (
        <div className="preview">
          <p>File uploaded successfully!</p>
          <a href={photoUrl} target="_blank" rel="noopener noreferrer">
            View uploaded file
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadFiletoAWS;