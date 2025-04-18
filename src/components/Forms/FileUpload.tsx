import React from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  acceptTypes?: { [key: string]: string[] };
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  files, 
  setFiles, 
  acceptTypes = { 'image/*': [] },
  maxFiles 
}) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: acceptTypes,
    maxFiles,
    onDrop: acceptedFiles => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  return (
    <div className="space-y-4">
      <div {...getRootProps({ className: "border-2 border-dashed rounded-md p-6 text-center cursor-pointer" })}>
        <input {...getInputProps()} />
        <p>Drag & drop files here, or click to select files</p>
      </div>
      
      {files.length > 0 && (
        <div>
          <h3 className="font-medium">Selected Files:</h3>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {files.map((file, index) => (
              <div key={index} className="relative">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Preview ${index}`}
                  className="w-full h-24 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFiles(files.filter((_, i) => i !== index));
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;