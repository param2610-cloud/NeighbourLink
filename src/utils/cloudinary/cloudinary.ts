import { v4 as uuidv4 } from 'uuid';

// Cloudinary configuration
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadFileToCloudinary = async (file: File, fileName: string): Promise<string> => {
  try {
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary env is missing. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    if (fileName) {
      // Cloudinary public_id must not include extension or special characters.
      const sanitizedPublicId = fileName
        .replace(/\.[^./]+$/, '')
        .replace(/[^a-zA-Z0-9/_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

      if (sanitizedPublicId) {
        formData.append('public_id', sanitizedPublicId);
      }
    }
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json().catch(() => ({}));
    console.log(data);
    
    
    if (!response.ok) {
      const message = data?.error?.message || `Upload failed with status ${response.status}`;
      throw new Error(message);
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
  if(publicId.startsWith("pandal_images")){
    return `https://res.cloudinary.com/dqd7ywrxm/image/upload/${publicId}.jpg`
  }
  
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

export const getPandelGalleryImageUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
};