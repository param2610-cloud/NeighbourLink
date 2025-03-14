export interface S3UploadParams {
    Bucket: string;
    Key: string;
    Body: File;
    ContentType: string;
}

export interface S3UploadResponse {
    Location: string;
    [key: string]: any;
}