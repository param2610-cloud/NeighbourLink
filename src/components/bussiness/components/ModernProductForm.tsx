import React, { useRef, useState } from 'react';
import { Upload, X, Camera, Package } from 'lucide-react';
import { BusinessCollection } from '../types';
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";
import { uploadFileToCloudinary, createUniqueFileName } from '@/utils/cloudinary/cloudinary';

interface ModernProductFormProps {
  product: BusinessCollection['products'][0] | null;
  isNew: boolean;
  onSave: (product: BusinessCollection['products'][0]) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ModernProductForm: React.FC<ModernProductFormProps> = ({
  product,
  isNew,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<BusinessCollection['products'][0]>(
    product || {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: [],
    }
  );

  const [dragActive, setDragActive] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof BusinessCollection['products'][0], value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );

    if (validFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const fileName = createUniqueFileName(file.name);
        return await uploadFileToCloudinary(file, fileName);
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const validUploads = uploadedImages.filter(Boolean);

      if (validUploads.length > 0) {
        setFormData(prev => ({
          ...prev,
          imageUrl: [...(prev.imageUrl || []), ...validUploads]
        }));
      }
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
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Package className="w-6 h-6" />
          {isNew ? 'Add New Product' : 'Edit Product'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Two Column Layout for lg+ screens, single column for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Image Upload Section */}
          <div className="space-y-4 order-2 lg:order-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Images
            </label>
            
            {/* Image Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg transition-colors ${
                dragActive
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'
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
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
                  className="inline-flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm rounded-lg transition-colors"
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
            {/* Product Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter product name"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                placeholder="Describe your product in detail..."
              />
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Available quantity"
                  min="0"
                />
              </div>
            </div>

            {/* Stock Status Indicator */}
            {formData.stock !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${
                  formData.stock > 10 ? 'bg-green-500' :
                  formData.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`font-medium ${
                  formData.stock > 10 ? 'text-green-700 dark:text-green-400' :
                  formData.stock > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                }`}>
                  {formData.stock > 10 ? 'In Stock' :
                   formData.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="submit"
            disabled={loading || uploadingImages || !formData.name.trim() || !formData.price}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Product'
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

export default ModernProductForm;
