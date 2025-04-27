import { useEffect, useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IoMdArrowBack } from 'react-icons/io';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ChatMessage, getChatMessages, markChatAsRead } from '../../services/simpleChatService';

import SimpleChatInput from './SimpleChatInput';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';

interface SimpleChatInterfaceProps {
  conversationId: string;
  onBack?: () => void;
}

const SimpleChatInterface: React.FC<SimpleChatInterfaceProps> = ({ conversationId, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    // Fetch conversation details and other user info
    const fetchConversationDetails = async () => {
      try {
        const conversationRef = doc(db, 'simple_conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (!conversationSnap.exists()) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }
        
        const conversationData = conversationSnap.data();
        const otherUserId = conversationData.participants.find(
          (id: string) => id !== currentUserId
        );
        
        if (otherUserId) {
          const userRef = doc(db, 'Users', otherUserId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setOtherUser({ id: otherUserId, ...userSnap.data() });
          }
        }
        
        // Mark conversation as read
        await markChatAsRead(conversationId, currentUserId);
      } catch (error) {
        console.error('Error fetching conversation details:', error);
        setError('Could not load conversation details');
      }
    };
    
    fetchConversationDetails();
    
    // Get messages and update in real-time
    const unsubscribe = getChatMessages(conversationId, (messageList) => {
      setMessages(messageList);
      setLoading(false);
      
      // Mark conversation as read when new messages arrive
      if (messageList.length > 0) {
        markChatAsRead(conversationId, currentUserId);
      }
    });
    
    return () => unsubscribe();
  }, [conversationId, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const getDisplayName = (user: any) => {
    return user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = message.createdAt?.toDate?.() || new Date();
      const dateStr = date.toLocaleDateString();
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      groups[dateStr].push(message);
    });
    
    return Object.entries(groups);
  };

  // Render media based on type
  const renderMedia = (url: string, type: string) => {
    if (type === 'image') {
      return (
        <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <ImageDisplay publicId={url} />
        </div>
      );
    } else if (type === 'video') {
      return (
        <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <video controls className="max-w-full">
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      // For other file types, show a download link
      return (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <div className="mr-2 text-blue-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <span className="text-sm">Download File</span>
        </a>
      );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <AiOutlineLoading3Quarters size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <h3 className="text-lg font-medium text-red-500 mb-2">Error</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Messages
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 flex items-center bg-white dark:bg-gray-800 shadow-sm z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 mr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IoMdArrowBack size={24} />
          </button>
        )}

        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          {otherUser?.photoURL ? (
            <img
              src={otherUser.photoURL}
              alt={getDisplayName(otherUser)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200">
              {getDisplayName(otherUser).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="ml-3 flex-1">
          <h2 className="font-medium text-gray-900 dark:text-white">
            {getDisplayName(otherUser)}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Start the conversation by sending a message below
            </p>
          </div>
        ) : (
          <div>
            {groupMessagesByDate().map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center my-4">
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-3 py-1 rounded-full">
                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {dateMessages.map((message, index) => {
                  const isMine = message.senderId === currentUserId;
                  const showAvatar =
                    index === 0 ||
                    dateMessages[index - 1]?.senderId !== message.senderId;

                  return (
                    <div
                      key={message.id}
                      className={`flex mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && showAvatar && (
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-2">
                          {otherUser?.photoURL ? (
                            <img
                              src={otherUser.photoURL}
                              alt={getDisplayName(otherUser)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200">
                              {getDisplayName(otherUser).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[75%] ${!isMine && !showAvatar ? 'ml-10' : ''}`}>
                        {message.text && (
                          <div className={`rounded-2xl px-4 py-2 ${isMine
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}>
                            {message.text}
                          </div>
                        )}

                        {/* Media attachments */}
                        {message.mediaUrls && message.mediaUrls.length > 0 && (
                          <div className={`mt-1 grid ${message.mediaUrls.length > 1 ? 'grid-cols-2 gap-1' : ''}`}>
                            {message.mediaUrls.map((url, i) => (
                              <div key={i} className="mt-1">
                                {renderMedia(
                                  url, 
                                  message.mediaTypes && message.mediaTypes[i] ? message.mediaTypes[i] : 'image', 
                                  
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={`text-xs mt-1 ${isMine ? 'text-right text-gray-500' : 'text-gray-500'}`}>
                          {formatMessageTimestamp(message.createdAt)}
                          {isMine && message.read && (
                            <span className="ml-1 text-blue-500">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      {currentUserId && otherUser && (
        <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <SimpleChatInput
            conversationId={conversationId}
            currentUserId={currentUserId}
            otherUserId={otherUser.id}
          />
        </div>
      )}
    </div>
  );
};

export default SimpleChatInterface;
