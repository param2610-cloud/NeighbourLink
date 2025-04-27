import { v4 as uuidv4 } from 'uuid';

// Cloudinary configuration
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadFileToCloudinary = async (file: File, fileName: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (fileName) {
      formData.append('public_id', fileName);
    }
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    
    // Return the public_id (similar to S3 object key)
    return data.public_id;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // This would require a backend endpoint for security reasons
  // You shouldn't expose your API secret in frontend code
  console.log("File deletion requested:", publicId);
};

interface CloudinaryOptions {
  resource_type?: string;
  transformations?: string;
}

export const getCloudinaryUrl = (publicId: string, options: CloudinaryOptions = {}) => {
  const cloudName = 'dqd7ywrxm';
  const resourceType = options.resource_type || 'image';
  const transformations = options.transformations || '';
  
  // URL encode the publicId to handle spaces and special characters
  const encodedId = encodeURIComponent(publicId);
  
  // Add .jpg extension for image resources if not already present
  const extension = resourceType === 'image' && !encodedId.endsWith('.jpg') ? '.jpg' : '';
  
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformations}${encodedId}${extension}`;
};

export const createUniqueFileName = (originalName: string): string => {
  console.log("Creating unique file name for:", originalName);
  
  // const extension = originalName.split('.').pop() || '';
  return `${uuidv4()}`;
};