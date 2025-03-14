
import { deleteFileFromS3 } from "../aws";

function FileDelete({ fileName }:{fileName:string}) {
  const handleDelete = async () => {
    try {
      await deleteFileFromS3(fileName);
      console.log("File deleted successfully");
      // Update Firestore or state to remove the file reference
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div>
      <button onClick={handleDelete}>Delete File</button>
    </div>
  );
}

export default FileDelete;