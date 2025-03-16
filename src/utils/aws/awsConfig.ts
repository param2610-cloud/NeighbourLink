import { S3Client } from "@aws-sdk/client-s3";

// Polyfill global for browser environments
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
}

const s3 = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true
});

export default s3;