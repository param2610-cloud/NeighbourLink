import { useState, useRef } from 'react';
import { sendMessage } from '../../services/messagingService';
import { IoMdSend, IoMdImage, IoMdAttach } from 'react-icons/io';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import { createUniqueFileName, uploadFileToS3 } from '@/utils/aws/aws';
// import { sendChatMessageNotification } from '../../services/notificationService';
// import { auth } from '../../firebase';

interface MessageInputProps {
  conversationId: string;
  currentUserId: string;
  otherUserId: string; 
  postId?: string; 
}

const QuickResponses = [
  "I'm interested in your post.",
  "Is this still available?",
  "When can we meet?",
  "I can help with that.",
  "Thank you!"
];

const MessageInput: React.FC<MessageInputProps> = ({ 
  conversationId,
  currentUserId,
  otherUserId
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSendMessage = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || !conversationId) return;
    
    try {
      await sendMessage(conversationId, currentUserId, message.trim(), uploadedFiles);

      // Send notification to recipient if it's not the current user
      if (otherUserId !== currentUserId) {
        if(otherUserId !== '' && conversationId) {
          // const currentUser = auth.currentUser;
          // const displayName = currentUser?.displayName || "User";
          // const messageText = message.trim();
          console.log("Other User Id", otherUserId);
          // await sendChatMessageNotification(
          //   conversationId,
          //   otherUserId,
          //   displayName,
          //   messageText.length > 50 ? messageText.substring(0, 47) + "..." : messageText
          // );
        }
      }
      
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
    
    const uploadedUrls: string[] = [];
    // let currentProgress = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = createUniqueFileName(file.name);
        
        await uploadFileToS3(
          file,
          fileName,
          );
        
        uploadedUrls.push(fileName);
      }
      
      setUploadedFiles((prev) => [...prev, ...uploadedUrls]);
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
  
  const useQuickResponse = (response: string) => {
    setMessage(response);
    setShowQuickResponses(false);
  };
  
  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative">
      {/* Quick responses */}
      {showQuickResponses && (
        <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 rounded-t-lg shadow-md border dark:border-gray-700 z-10 mb-2 max-h-40 overflow-y-auto">
          {QuickResponses.map((response, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-3 border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              onClick={() => useQuickResponse(response)}
            >
              {response}
            </button>
          ))}
        </div>
      )}
      
      {/* Uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                <ImageDisplay objectKey={file} className="w-full h-full object-cover" />
              </div>
              <button
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                onClick={() => removeUploadedFile(index)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload progress */}
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
        <button
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          onClick={() => setShowQuickResponses(!showQuickResponses)}
        >
          <IoMdAttach size={24} />
        </button>
        
        <label className="cursor-pointer p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
          <IoMdImage size={24} />
          <input
            type="file"
            accept="image/*"
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

export default MessageInput;
