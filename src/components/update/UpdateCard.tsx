import React, { useState } from 'react';
import { UpdateWithUserData } from '@/interface/main';
import { ImageDisplay } from '@/components/AWS/UploadFile';
import { format } from 'date-fns';

interface UpdateCardProps {
    update: UpdateWithUserData;
    isMainUpdate?: boolean;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update, isMainUpdate = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = update.images?.length || 0;

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Unknown date';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM dd, yyyy • h:mm a');
    };

    // Add visual indication of thread depth
    const getThreadDepthIndicator = () => {
        if (!update.threadDepth || update.threadDepth === 0) return null;
        
        return (
            <div className="mb-2 flex items-center">
                <div className="flex items-center">
                    {[...Array(Math.min(update.threadDepth, 3))].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600 mx-0.5"
                        />
                    ))}
                    {update.threadDepth > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            +{update.threadDepth - 3} more
                        </span>
                    )}
                </div>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    Reply {update.threadDepth > 1 ? `(Nested level ${update.threadDepth})` : ''}
                </span>
            </div>
        );
    };

    return (
        <div className={`p-4 ${isMainUpdate ? 'bg-white dark:bg-gray-800' : 'bg-white/90 dark:bg-gray-800/90'}`}>
            {/* Thread depth indicator */}
            {!isMainUpdate && getThreadDepthIndicator()}
            
            {/* User info */}
            <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700">
                    {update.userData?.photoURL ? (
                        <img 
                            src={update.userData.photoURL} 
                            alt={`${update.userData.firstName || 'User'}'s profile`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                            {(update.userData?.firstName?.[0] || '') + (update.userData?.lastName?.[0] || '')}
                        </div>
                    )}
                </div>
                <div className="ml-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                        {update.userData?.firstName} {update.userData?.lastName || ''}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(update.createdAt)}
                    </p>
                </div>
            </div>

            {/* Update content */}
            {isMainUpdate && update.title && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {update.title}
                </h2>
            )}
            
            <div className="text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-line">
                {update.description}
            </div>

            {/* Images */}
            {update.images && update.images.length > 0 && (
                <div className="relative w-full h-64 md:h-80 mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {update.images.map((image, index) =>{ 
                        console.log('Image:', image, 'Index:', index, 'Current:', currentImageIndex);
                        
                        return  (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-300 ${
                                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    )})}

                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                {update.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Reply count */}
            {!isMainUpdate && update.replyCount !== undefined && update.replyCount > 0 && (
                <div className="text-sm text-blue-500 dark:text-blue-400 mt-2">
                    {update.replyCount} {update.replyCount === 1 ? 'reply' : 'replies'}
                </div>
            )}
        </div>
    );
};

export default UpdateCard;
