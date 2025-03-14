import  { useState } from "react";
import { uploadFileToS3 } from "../aws";

function FileUpload() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e:any) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const fileName = `uploads/${Date.now()}-${file.name}`; // Unique file name
    try {
      const fileUrl = await uploadFileToS3(file, fileName);
      console.log("File URL:", fileUrl);
      // Save the fileUrl to Firestore or state
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}

export default FileUpload;