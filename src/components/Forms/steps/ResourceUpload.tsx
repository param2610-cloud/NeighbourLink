import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";

interface ResourceUploadProps {
  form: UseFormReturn<any>;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const ResourceUpload: React.FC<ResourceUploadProps> = ({ form, uploadedFiles, setUploadedFiles }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': []
    },
    onDrop: acceptedFiles => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Upload Images</h2>
      
      <div {...getRootProps({ className: "border-2 border-dashed rounded-md p-6 text-center cursor-pointer" })}>
        <input {...getInputProps()} />
        <p>Drag & drop images here, or click to select files</p>
        <p className="text-sm text-gray-500 mt-2">
          Images will be uploaded when you submit the form
        </p>
      </div>
      
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="font-medium">Selected Files:</h3>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {uploadedFiles.map((file, index) => (
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
                    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="pt-4">
        <h3 className="font-medium mb-2">Review Information</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <p><strong>Title:</strong> {form.getValues('title')}</p>
          <p><strong>Category:</strong> {form.getValues('category') === 'Other' 
            ? form.getValues('customCategory') 
            : form.getValues('category')}</p>
          <p><strong>Type:</strong> {form.getValues('resourceType')}</p>
          <p><strong>Urgency:</strong> {form.getValues('urgency') === 1 
            ? "Low" 
            : form.getValues('urgency') === 2 
              ? "Medium" 
              : "High"}</p>
          <p><strong>Duration:</strong> {form.getValues('duration')}</p>
          <p><strong>Visibility Radius:</strong> {form.getValues('visibilityRadius')} km</p>
          <p><strong>Anonymous:</strong> {form.getValues('isAnonymous') ? "Yes" : "No"}</p>
          
          {/* Display location info if custom location is selected */}
          {form.getValues('locationType') === 'custom' && (
            <p>
              <strong>Location:</strong> {form.getValues('address') || 
                `${form.getValues('latitude')}, ${form.getValues('longitude')}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceUpload;