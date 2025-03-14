import  { useEffect, useState } from "react";
import { getPreSignedUrl } from "../aws";

function FileViewer({ fileName }:{fileName:string}) {
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    const fetchFileUrl = async () => {
      try {
        const url = await getPreSignedUrl(fileName);
        setFileUrl(url);
      } catch (error) {
        console.error("Error fetching file URL:", error);
      }
    };
    fetchFileUrl();
  }, [fileName]);

  return (
    <div>
      {fileUrl ? (
        <img src={fileUrl} alt="Uploaded file" />
      ) : (
        <p>Loading file...</p>
      )}
    </div>
  );
}

export default FileViewer;