import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./awsConfig";

export const deleteFile = async (fileName:string) => {
  const params = {
    Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
    Key: `uploads/${fileName}`,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
    alert("File deleted successfully!");
  } catch (error) {
    console.error("Delete error:", error);
  }
};


