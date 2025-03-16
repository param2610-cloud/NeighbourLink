import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./awsConfig";

export const uploadFile = async (file: File, filename: string): Promise<string> => {
  try {
    const params = {
      Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
      Key: `uploads/${filename}`,
      Body: file,
      ContentType: file.type,
    };

    await s3.send(new PutObjectCommand(params));
    
    // Generate and return the URL for the uploaded file
    const fileUrl = `https://${params.Bucket}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${params.Key}`;
    console.log("File uploaded successfully!");
    return fileUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};