import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import s3 from "./awsConfig";

const listFiles = async () => {
  const params = {
    Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
  };

  try {
    const command = new ListObjectsV2Command(params);
    const response = await s3.send(command);
    console.log("Files:", response.Contents);
  } catch (error) {
    console.error("List error:", error);
  }
};

listFiles();
