import React, { useState } from 'react';
import { db, auth } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaImage, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { uploadFileToS3 } from '@/utils/aws/aws';

interface ReplyFormProps {
    parentId: string;
    onSuccess: () => void;
    threadDepth: number;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ parentId, onSuccess, threadDepth }) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!description.trim() && uploadedImages.length === 0) {
            toast.error('Please enter a message or add an image', { position: 'top-center' });
            return;
        }
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast.error('You must be logged in to reply', { position: 'top-center' });
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Upload any pending images
            if (selectedImages.length > 0 && uploadedImages.length === 0) {
                await handleUploadImages();
            }
            
            // Add the reply to the updates collection
            const replyData = {
                parentId,
                title: '', // Replies don't need titles
                description: description.trim(),
                images: uploadedImages,
                userId: currentUser.uid,
                createdAt: serverTimestamp(),
                threadDepth,
                childUpdates: [],
                useProfileLocation: false,
                visibilityRadius: '5',
                date: new Date().toISOString().split('T')[0],
                duration: '7 days'  
            };
            
            const replyRef = await addDoc(collection(db, 'updates'), replyData);
            
            // Update the parent document to add this reply to its childUpdates array
            await updateDoc(doc(db, 'updates', parentId), {
                childUpdates: arrayUnion(replyRef.id)
            });
            
            toast.success('Reply submitted successfully', { position: 'top-center' });
            setDescription('');
            setSelectedImages([]);
            setUploadedImages([]);
            onSuccess();
        } catch (error) {
            console.error('Error submitting reply:', error);
            toast.error('Failed to submit reply. Please try again.', { position: 'top-center' });
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
        if (selectedImages.length === 0) return [];
        
        setIsUploading(true);
        
        try {
            const uploadPromises = selectedImages.map(async (file) => {
                const fileName = `${Date.now()}-${file.name}`;
                return await uploadFileToS3(file, fileName);
            });
            
            const uploadedUrls = await Promise.all(uploadPromises);
            setUploadedImages(uploadedUrls);
            setSelectedImages([]);
            console.log('Uploaded images:', uploadedUrls);
            
            return uploadedUrls;
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images. Please try again.', { position: 'top-center' });
            return [];
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <textarea
                    className="w-full px-4 py-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    rows={4}
                    placeholder="Write your reply..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                />
            </div>
            
            {/* Selected images preview */}
            {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {selectedImages.map((file, index) => (
                        <div key={index} className="relative">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index}`}
                                className="w-full h-24 object-cover rounded"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                                <FaTimes size={12} />
                            </button>
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
            
            {/* Already uploaded images */}
            {uploadedImages.length > 0 && (
                <div className="text-sm text-green-500">
                    {uploadedImages.length} image{uploadedImages.length !== 1 && 's'} uploaded
                </div>
            )}
            
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={isSubmitting || selectedImages.length >= 4}
                >
                    <FaImage size={20} />
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
                    className={`px-4 py-2 rounded-full bg-blue-600 text-white ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center">
                            <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                            Sending...
                        </span>
                    ) : (
                        'Reply'
                    )}
                </button>
            </div>
        </form>
    );
};

export default ReplyForm;
