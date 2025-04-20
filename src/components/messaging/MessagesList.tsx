import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase'; // Import db directly
import { Conversation, getUserConversations } from '../../services/messagingService';
import { formatDistanceToNow } from 'date-fns';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import { FaArrowLeft } from 'react-icons/fa';
import { GiHamburgerMenu } from "react-icons/gi";
import Bottombar from '../authPage/structures/Bottombar';
import { Skeleton } from '../ui/skeleton';
import Sidebar from '../authPage/structures/Sidebar';
import { useMobileContext } from '@/contexts/MobileContext';

const MessagesList = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;
  const { isMobile } = useMobileContext();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  async function handleLogout() {
    try {
      await auth.signOut();
      window.location.href = "/login";
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging out:", error.message);
      }
    }
  }

  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = getUserConversations(currentUserId, (convoList) => {
      setConversations(convoList);
      setLoading(false);

      const userIds = new Set<string>();
      convoList.forEach(convo => {
        convo.participants.forEach(userId => {
          if (userId !== currentUserId) {
            userIds.add(userId);
          }
        });
      });

      fetchUserProfiles(Array.from(userIds));
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const fetchUserProfiles = async (userIds: string[]) => {
    const profiles: { [key: string]: any } = {};

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'Users', userId));

          if (userDoc.exists()) {
            profiles[userId] = {
              id: userId,
              ...userDoc.data()
            };
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      })
    );

    setUserProfiles(profiles);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    return otherUserId ? userProfiles[otherUserId] : null;
  };

  const getRecipientName = (otherUser: any) => {
    if (!otherUser) return 'Unknown User';
    
    if (otherUser.firstName || otherUser.lastName) {
      return `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
    }
    
    if (otherUser.displayName && otherUser.displayName.trim()) {
      return otherUser.displayName;
    }
    
    if (otherUser.email) {
      return otherUser.email.split('@')[0]; // Use email prefix
    }
    
    return 'Unknown User';
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // For today's messages, just show the time
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // For yesterday's messages, show "Yesterday"
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // For older messages, show relative time
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '';
    }
  };

  const getMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return 'Start a conversation';
    }
    
    const isOwnMessage = conversation.lastMessage.senderId === currentUserId;
    const prefix = isOwnMessage ? 'You: ' : '';
    const text = conversation.lastMessage.text || '';
    
    // If there's no text but might be media
    if (!text.trim()) {
      return isOwnMessage ? 'You sent an attachment' : 'Sent you an attachment';
    }
    
    // Truncate text if needed
    return text.length > 30 ? `${prefix}${text.substring(0, 27)}...` : `${prefix}${text}`;
  };

  const navigateToChat = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="p-4 border-b ">
          <div className="h-8 w-48 mb-4">
        <Skeleton className="h-full w-full" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Responsive Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 z-40`}
      >
        <Sidebar
          handleLogout={handleLogout}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {/* Overlay to close sidebar when clicking outside (only on mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Enhanced Top Navigation */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
          <div className="flex items-center justify-between p-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={toggleSidebar}
            >
              <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
            </div>

            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                Neighbour
              </h1>
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
              Link
              </h1>
              <span className="mx-2 text-blue-500 dark:text-gray-400">
                |
              </span>
              <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                Messages
              </h2>
            </div>

            <div className="opacity-0 w-8 h-8">
              {/* Empty div for layout balance */}
            </div>
          </div>
        </div>

        <div className="p-4 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Messages</h1>
          <div className="flex gap-2 justify-start mb-3 items-center hover:cursor-pointer text-blue-600 dark:text-blue-400"
            onClick={() => navigate('/')}
          ><FaArrowLeft /> Back</div>
        </div>

        <div className="flex-1 pb-24">
          {conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">No conversations yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Start a conversation by responding to a post
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                const unreadCount = conversation.unreadCount?.[currentUserId || ''] || 0;
                const recipientName = getRecipientName(otherUser);
                
                return (
                  <div
                    key={conversation.id}
                    className={`border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      unreadCount > 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                    onClick={() => conversation.id && navigateToChat(conversation.id)}
                  >
                    <div className="flex p-4">
                      {/* Recipient profile picture */}
                      <div className="h-12 w-12 rounded-full overflow-hidden mr-4 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {otherUser?.photo ? (
                          <ImageDisplay 
                            objectKey={otherUser.photo} 
                            className="h-full w-full object-cover"
                          />
                        ) : otherUser?.photoURL ? (
                          <img
                            src={otherUser.photoURL}
                            alt={recipientName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200">
                            {recipientName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Message preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className={`font-medium truncate ${
                            unreadCount > 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {recipientName}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 flex-shrink-0">
                            {formatTimestamp(conversation.lastMessage?.timestamp || conversation.updatedAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm truncate ${
                            unreadCount > 0
                              ? 'text-gray-900 dark:text-white font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {getMessagePreview(conversation)}
                          </p>

                          {unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 ml-2">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        
                        {/* Optional: Show post reference if available */}
                        {conversation.postTitle && (
                          <div className="mt-1">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                              Re: {conversation.postTitle.length > 20 
                                ? conversation.postTitle.substring(0, 17) + '...' 
                                : conversation.postTitle}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      
        {/* Bottom Navigation */}
        {isMobile && <Bottombar />}
      </div>
    </div>
  );
};

export default MessagesList;
