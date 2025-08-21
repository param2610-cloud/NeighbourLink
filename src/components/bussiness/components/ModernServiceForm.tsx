import React, { useRef, useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { BusinessCollection } from '../types';
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";
import { uploadFileToCloudinary, createUniqueFileName } from '@/utils/cloudinary/cloudinary';

interface ModernServiceFormProps {
  service: BusinessCollection['services'][0] | null;
  isNew: boolean;
  onSave: (service: BusinessCollection['services'][0]) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ModernServiceForm: React.FC<ModernServiceFormProps> = ({
  service,
  isNew,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<BusinessCollection['services'][0]>(
    service || {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      duration: '',
      imageUrl: [],
    }
  );
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof BusinessCollection['services'][0], value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files: FileList | File[]) => {
    if (!files.length) return;
    
    setUploadingImages(true);
    try {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map(file => 
        uploadFileToCloudinary(file, createUniqueFileName(file.name))
      );
      
      const newImageUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        imageUrl: [...(prev.imageUrl || []), ...newImageUrls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleImageUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: prev.imageUrl?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
        <h3 className="text-xl font-semibold text-white">
          {isNew ? 'Add New Service' : 'Edit Service'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Two Column Layout for lg+ screens, single column for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Image Upload Section */}
          <div className="space-y-4 order-2 lg:order-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Service Images
            </label>
            
            {/* Image Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg transition-colors ${
                dragActive
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {uploadingImages ? (
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {uploadingImages ? 'Uploading...' : 'Add Images'}
                </h4>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Drag & drop or click to browse
                </p>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose Images
                </button>
              </div>
            </div>

            {/* Image Preview Grid */}
            {formData.imageUrl && formData.imageUrl.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {formData.imageUrl.map((imageUrl, index) => (
                  <div key={index} className="relative group aspect-square">
                    <ImageDisplay
                      publicId={imageUrl}
                      className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Service Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter service name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                placeholder="Describe your service in detail..."
              />
            </div>

            {/* Price and Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="e.g., 1 hour, 30 minutes"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="submit"
            disabled={loading || uploadingImages || !formData.name.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Service'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || uploadingImages}
            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModernServiceForm;
