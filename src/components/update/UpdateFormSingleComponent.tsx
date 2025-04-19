import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FaArrowLeft, FaImage, FaTimes } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { uploadFileToS3 } from '@/utils/aws/aws';
import { ImageDisplay } from '@/components/AWS/UploadFile';

const NewUpdateForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setFirebaseUser(user);
            } else {
                // Redirect to login if not authenticated
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() && !description.trim() && uploadedImages.length === 0) {
            toast.error('Please enter a title, description or add images', { position: 'top-center' });
            return;
        }
        
        if (!firebaseUser) {
            toast.error('You must be logged in to create an update', { position: 'top-center' });
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Upload any pending images
            if (selectedImages.length > 0 && uploadedImages.length === 0) {
                await handleUploadImages();
            }
            
            // Add the update to the updates collection
            const updateData = {
                title: title.trim(),
                description: description.trim(),
                images: uploadedImages,
                userId: firebaseUser.uid,
                createdAt: serverTimestamp(),
                parentId: null,  // This is a top-level update
                childUpdates: [],
                threadDepth: 0,  // Top-level update
                useProfileLocation: false,
                visibilityRadius: '5',
                date: new Date().toISOString().split('T')[0],
                duration: '7 days'  // Default duration
            };
            
            const updateRef = await addDoc(collection(db, 'updates'), updateData);
            
            toast.success('Update created successfully', { position: 'top-center' });
            navigate(`/update/${updateRef.id}`);
        } catch (error) {
            console.error('Error creating update:', error);
            toast.error('Failed to create update. Please try again.', { position: 'top-center' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            
            // Limit to 4 images total
            const totalImages = selectedImages.length + newFiles.length;
            if (totalImages > 4) {
                toast.warning('Maximum 4 images allowed', { position: 'top-center' });
                return;
            }
            
            setSelectedImages(prev => [...prev, ...newFiles]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadImages = async () => {
        if (selectedImages.length === 0) return;
        
        setIsUploading(true);
        
        try {
            const uploadPromises = selectedImages.map(async (file) => {
                const fileName = `${Date.now()}-${file.name}`;
                return await uploadFileToS3(file, fileName);
            });
            
            const uploadedUrls = await Promise.all(uploadPromises);
            setUploadedImages(uploadedUrls);
            setSelectedImages([]);
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images. Please try again.', { position: 'top-center' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header with back button */}
                <div 
                    className="flex gap-2 items-center text-blue-600 dark:text-blue-400 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft /> Back
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Update</h1>
                <div className="w-6"></div> {/* Spacer for alignment */}
                
                {/* Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title (optional)
                            </label>
                            <input
                                type="text"
                                id="title"
                                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Add a title to your update"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                className="w-full px-4 py-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={6}
                                placeholder="What's happening?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        {/* Selected images preview */}
                        {selectedImages.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedImages.map((file, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index}`}
                                            className="w-full h-32 object-cover rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <FaTimes size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Already uploaded images preview */}
                        {uploadedImages.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                                {uploadedImages.map((objectKey, index) => (
                                    <div key={index} className="relative">
                                        <ImageDisplay 
                                            objectKey={objectKey}
                                            className="w-full h-32 object-cover rounded" 
                                        />
                                        {/* No remove button for already uploaded images */}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Image upload progress */}
                        {isUploading && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <AiOutlineLoading3Quarters className="animate-spin" />
                                <span>Uploading images...</span>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                disabled={isSubmitting || selectedImages.length >= 4}
                            >
                                <FaImage size={20} className="mr-2" />
                                Add Images
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    disabled={isSubmitting}
                                />
                            </button>
                            
                            <button
                                type="submit"
                                className={`px-6 py-2 rounded-md ${
                                    isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                } text-white`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                                        Posting...
                                    </span>
                                ) : (
                                    'Post Update'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewUpdateForm;
