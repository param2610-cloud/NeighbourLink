import { useState, useRef } from 'react';
import { sendChatMessage } from '../../services/simpleChatService';
import { IoMdSend, IoMdImage, IoMdAttach, IoMdClose, IoMdDocument, IoMdFilm } from 'react-icons/io';

import { createUniqueFileName, uploadFileToS3 } from '@/utils/aws/aws';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';
import { uploadFileToCloudinary } from '@/utils/cloudinary/cloudinary';

interface SimpleChatInputProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
}

const SimpleChatInput: React.FC<SimpleChatInputProps> = ({ 
  conversationId,
  currentUserId,
  // otherUserId
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, type: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSendMessage = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || !conversationId) return;
    
    try {
      const mediaUrls = uploadedFiles.map(file => file.url);
      const mediaTypes = uploadedFiles.map(file => file.type);
      
      await sendChatMessage(conversationId, currentUserId, message.trim(), mediaUrls, mediaTypes);
      setMessage('');
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = createUniqueFileName(file.name);
        
        await uploadFileToCloudinary(file, fileName);
        
        // Determine file type
        let fileType = 'file';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
        }
        
        setUploadedFiles(prev => [...prev, { url: fileName, type: fileType }]);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    switch(fileType) {
      case 'image':
        return <IoMdImage className="text-blue-500" />;
      case 'video':
        return <IoMdFilm className="text-purple-500" />;
      default:
        return <IoMdDocument className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden flex items-center justify-center">
                {file.type === 'image' ? (
                  <ImageDisplay publicId={file.url} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    {getFileIcon(file.type)}
                    <span className="text-xs mt-1 truncate w-full text-center">
                      {file.url.split('/').pop()?.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
              <button
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                onClick={() => removeUploadedFile(index)}
              >
                <IoMdClose size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      
      {isUploading && (
        <div className="mb-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            <div
              className="h-2 bg-indigo-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <label className="cursor-pointer p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
          <IoMdAttach size={24} />
          <input
            type="file"
            accept="application/pdf,application/msword,application/vnd.ms-excel,text/plain"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
        
        <label className="cursor-pointer p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
          <IoMdImage size={24} />
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isUploading}
          />
        </label>
        
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden">
          <textarea
            className="w-full bg-transparent border-0 resize-none p-3 outline-none text-gray-800 dark:text-gray-200 min-h-[40px] max-h-32"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isUploading}
            style={{
              height: 'auto',
              minHeight: '40px',
              maxHeight: '120px'
            }}
          />
        </div>
        
        <button
          className={`p-3 rounded-full ${
            message.trim() || uploadedFiles.length > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleSendMessage}
          disabled={(!message.trim() && uploadedFiles.length === 0) || isUploading}
        >
          <IoMdSend size={20} />
        </button>
      </div>
    </div>
  );
};

export default SimpleChatInput;
