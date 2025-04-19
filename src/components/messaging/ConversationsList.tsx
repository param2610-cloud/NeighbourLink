import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { doc, getDoc } from 'firebase/firestore';
import { ChatConversation, getUserChats } from '../../services/simpleChatService';

interface ConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
  className?: string;
}

const ConversationsList: React.FC<ConversationsListProps> = ({ onSelectConversation, className = '' }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = getUserChats(currentUserId, (convoList) => {
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

  const getOtherParticipant = (conversation: ChatConversation) => {
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    return otherUserId ? userProfiles[otherUserId] : null;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <AiOutlineLoading3Quarters size={30} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 text-center ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-400">No conversations yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Start chatting with someone to see conversations here
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-y-auto ${className}`}>
      {conversations.map((conversation) => {
        const otherUser = getOtherParticipant(conversation);
        const unreadCount = conversation.unreadCount?.[currentUserId || ''] || 0;
        
        return (
          <div
            key={conversation.id}
            className="border-b dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => conversation.id && onSelectConversation(conversation.id)}
          >
            <div className="flex p-4">
              {/* User avatar */}
              <div className="h-12 w-12 rounded-full overflow-hidden mr-4 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {otherUser?.photoURL ? (
                  <img
                    src={otherUser.photoURL}
                    alt={otherUser.displayName || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200">
                    {(otherUser?.displayName || otherUser?.firstName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message preview */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {otherUser?.displayName || 
                     `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 
                     'User'}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(conversation.lastMessage?.timestamp || conversation.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <p className={`text-sm truncate ${unreadCount > 0
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {conversation.lastMessage?.text || 'No messages yet'}
                  </p>

                  {unreadCount > 0 && (
                    <span className="bg-indigo-600 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationsList;
