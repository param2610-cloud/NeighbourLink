import React, { useState } from 'react';
import { db, auth } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaImage, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { uploadFileToS3 } from '@/utils/aws/aws';
import { ImageDisplay } from '@/components/AWS/UploadFile';
import { addNotification } from '@/utils/notification/NotificationHook';

interface ReplyFormProps {
    parentId: string;
    onSuccess: () => void;
    threadDepth: number;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ parentId, onSuccess, threadDepth }) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
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
            
            // Get the parent update details to find the author
            const parentUpdateRef = doc(db, 'updates', parentId);
            const parentUpdateSnap = await getDoc(parentUpdateRef);
            
            if (parentUpdateSnap.exists()) {
                const parentUpdateData = parentUpdateSnap.data();
                const parentAuthorId = parentUpdateData.userId;
                
                // Only send notification if parent author is different from current user
                if (parentAuthorId && parentAuthorId !== currentUser.uid) {
                    // Get current user details for the notification
                    const currentUserRef = doc(db, 'Users', currentUser.uid);
                    const currentUserSnap = await getDoc(currentUserRef);
                    let senderName = 'Someone';
                    
                    if (currentUserSnap.exists()) {
                        const userData = currentUserSnap.data();
                        senderName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Someone';
                    }
                    
                    // Create notification for the parent update author
                    addNotification({
                        title: 'New Reply to Your Update',
                        description: `${senderName} replied to your update${parentUpdateData.title ? `: ${parentUpdateData.title}` : ''}`,
                        receipt: [parentAuthorId],
                        action_url: `/update/${parentId}`
                    });
                }
            }
            
            toast.success('Reply submitted successfully', { position: 'top-center' });
            setDescription('');
            setUploadedImages([]);
            onSuccess();
        } catch (error) {
            console.error('Error submitting reply:', error);
            toast.error('Failed to submit reply. Please try again.', { position: 'top-center' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const newFiles = Array.from(e.target.files);
            
        // Limit to 4 images total
        const totalImages = uploadedImages.length + newFiles.length;
        if (totalImages > 4) {
            toast.warning('Maximum 4 images allowed', { position: 'top-center' });
            return;
        }
        
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];
                const fileName = `${Date.now()}-${file.name}`;
                
                // Upload the file and get the object key
                const objectKey = await uploadFileToS3(file, fileName);
                
                // Add the object key to the uploadedImages array
                setUploadedImages(prev => [...prev, objectKey]);
                
                // Update progress
                setUploadProgress(Math.round(((i + 1) / newFiles.length) * 100));
            }
            
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images. Please try again.', { position: 'top-center' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
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
            
            {/* Image upload progress */}
            {isUploading && (
                <div className="mb-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        <div
                            className="h-2 bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Uploading... {uploadProgress}%
                    </p>
                </div>
            )}
            
            {/* Uploaded images */}
            {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((objectKey, index) => (
                        <div key={index} className="relative group">
                            <ImageDisplay 
                                objectKey={objectKey}
                                className="w-full h-24 object-cover rounded" 
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={isSubmitting || isUploading || uploadedImages.length >= 4}
                >
                    <FaImage size={20} />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isSubmitting || isUploading || uploadedImages.length >= 4}
                    />
                </button>
                
                <button
                    type="submit"
                    className={`px-4 py-2 rounded-full bg-blue-600 text-white ${
                        isSubmitting || isUploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                    disabled={isSubmitting || isUploading}
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
