import React from 'react';
import { UpdateWithUserData } from '@/interface/main';
import { ImageDisplay } from '@/components/AWS/UploadFile';
import { formatDistanceToNow } from 'date-fns';

interface UpdateCardProps {
  update: UpdateWithUserData;
  isReply?: boolean;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update, isReply = false }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };
  console.log('update:', update); // Log the update object for debugging
  
  return (
    <div className="p-4">
      <div className="flex items-center mb-2">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
          {update.userData?.photoURL ? (
            <ImageDisplay objectKey={update.userData.photoURL} className="h-10 w-10 object-cover" />
          ) : (
            <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
              {update.userData?.firstName?.[0] || '?'}
            </div>
          )}
        </div>
        
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {update.userData?.firstName} {update.userData?.lastName || ''}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(update.createdAt)}
          </div>
        </div>
      </div>
      
      {update.title && (
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {update.title}
        </h3>
      )}
      
      {update.description && (
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          {update.description}
        </p>
      )}
      
      {update.images && update.images.length > 0 && (
        <div className={`grid ${update.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
          {update.images.map((image, index) => (
            <div key={index} className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <ImageDisplay objectKey={image} className="w-full h-48 object-cover" />
            </div>
          ))}
        </div>
      )}
      
      {!isReply && update.replyCount !== undefined && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {update.replyCount} {update.replyCount === 1 ? 'reply' : 'replies'}
        </div>
      )}
    </div>
  );
};

export default UpdateCard;
