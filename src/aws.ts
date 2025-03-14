import AWS from "aws-sdk";
import { S3UploadParams, S3UploadResponse } from "./interface/main";

const s3 = new AWS.S3({
  accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY, 
  secretAccessKey: import.meta.env.VITE_S3_SECRET_ACCESS_KEY, 
  region: "ap-south-1", 
});



export const uploadFileToS3 = async (file: File, fileName: string): Promise<string> => {
    const params: S3UploadParams = {
        Bucket: "neighbourlink", 
        Key: fileName, 
        Body: file, 
        ContentType: file.type, 
    };

    try {
        const data: S3UploadResponse = await s3.upload(params).promise();
        console.log("File uploaded successfully:", data.Location);
        return data.Location; 
    } catch (error: unknown) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const deleteFileFromS3 = async (fileName:string) => {
  const params = {
    Bucket: "neighbourlink", 
    Key: fileName,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log("File deleted successfully:", fileName);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
export const getPreSignedUrl = async (fileName:string) => {
    const params = {
      Bucket: "neighbourlink", 
      Key: fileName, 
      Expires: 3600, 
    };
  
    try {
      const url = await s3.getSignedUrlPromise("getObject", params);
      console.log("Pre-signed URL:", url);
      return url;
    } catch (error) {
      console.error("Error generating pre-signed URL:", error);
      throw error;
    }
  };