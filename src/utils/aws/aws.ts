import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';


const s3Client = new S3Client( {
  region: "ap-south-1",
  credentials: {
    accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY ,
    secretAccessKey: import.meta.env.VITE_S3_SECRET_ACCESS_KEY ,
  },
});


export const uploadFileToS3 = async (file: File, fileName: string): Promise<string> => {
  
  const arrayBuffer = await file.arrayBuffer();
  
  const params = {
    Bucket: import.meta.env.VITE_AWS_BUCKET_NAME ,
    Key: fileName,
    Body: new Uint8Array(arrayBuffer),
    ContentType: file.type,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    // return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
    return params.Key;
  } catch (error: unknown) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFileFromS3 = async (fileName: string) => {
  const params = {
    Bucket: import.meta.env.VITE_AWS_BUCKET_NAME ,
    Key: fileName,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    console.log("File deleted successfully:", fileName);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};


export const getPreSignedUrl = async (fileName: string) => {
  const params = {
    Bucket: import.meta.env.VITE_AWS_BUCKET_NAME ,
    Key: fileName,
  };

  try {
    const command = new GetObjectCommand(params);
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log("Pre-signed URL:", url);
    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw error;
  }
};
export async function getSignedImageUrl(objectKey:string) {
  try {
    
    const getCommand = new GetObjectCommand({
      Bucket: import.meta.env.VITE_AWS_BUCKET_NAME || 'neighbourlink',
      Key: objectKey,
    });
    
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); 
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}
export const createUniqueFileName = (originalName: string): string => {
  console.log("Original Name:", originalName);
  
  // const extension = originalName.split('.').pop() || '';
  return `${uuidv4()}`;
};
