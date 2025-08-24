import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { Conversation, getUserConversations, getMessages, markConversationAsRead, Message } from '../../services/messagingService';
import { formatDistanceToNow } from 'date-fns';
import { FaArrowLeft, FaSearch, FaVideo, FaPhone, FaInfoCircle } from 'react-icons/fa';
import { FiCalendar } from 'react-icons/fi';
import { GiHamburgerMenu } from "react-icons/gi";
import { BsChatDots } from "react-icons/bs";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { doc, getDoc } from 'firebase/firestore';
import Bottombar from '../authPage/structures/Bottombar';
import { Skeleton } from '../ui/skeleton';
import Sidebar from '../authPage/structures/Sidebar';
import { useMobileContext } from '@/contexts/MobileContext';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';
import MessageInput from './MessageInput';
import ExchangeCoordination from './ExchangeCoordination';
import ExchangeDetails from './ExchangeDetails';
import ItemReferenceCard from './ItemReferenceCard';

const ModernMessaging = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeMessages, setExchangeMessages] = useState<{ [messageId: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Fetch conversations
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

      // Auto-select conversation if specified in URL
      if (conversationId) {
        const conversation = convoList.find(c => c.id === conversationId);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUserId, conversationId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id || !currentUserId) return;

    setMessagesLoading(true);
    const unsubscribe = getMessages(selectedConversation.id, (messageList) => {
      setMessages(messageList);
      setMessagesLoading(false);

      if (messageList.length > 0) {
        markConversationAsRead(selectedConversation.id!, currentUserId);
      }
    });

    // Fetch other user details
    fetchOtherUser(selectedConversation);

    return () => unsubscribe();
  }, [selectedConversation?.id, currentUserId]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract exchange IDs from messages
  useEffect(() => {
    const exchanges: { [messageId: string]: string } = {};
    messages.forEach(message => {
      if (message.id) {
        const exchangeId = extractExchangeId(message.text);
        if (exchangeId) {
          exchanges[message.id] = exchangeId;
        }
      }
    });
    setExchangeMessages(exchanges);
  }, [messages]);

  const extractExchangeId = (text: string): string | null => {
    const exchangeIdRegex = /Exchange ID: ([a-zA-Z0-9]+)/;
    const match = text.match(exchangeIdRegex);
    return match ? match[1] : null;
  };

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

  const fetchOtherUser = async (conversation: Conversation) => {
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    if (otherUserId && userProfiles[otherUserId]) {
      setOtherUser(userProfiles[otherUserId]);
    } else if (otherUserId) {
      try {
        const userDoc = await getDoc(doc(db, 'Users', otherUserId));
        if (userDoc.exists()) {
          const userData = { id: otherUserId, ...userDoc.data() };
          setOtherUser(userData);
          setUserProfiles(prev => ({ ...prev, [otherUserId]: userData }));
        }
      } catch (error) {
        console.error("Error fetching other user:", error);
      }
    }
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
      return otherUser.email.split('@')[0];
    }
    
    return 'Unknown User';
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
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
    
    if (!text.trim()) {
      return isOwnMessage ? 'You sent an attachment' : 'Sent you an attachment';
    }
    
    return text.length > 30 ? `${prefix}${text.substring(0, 27)}...` : `${prefix}${text}`;
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Update URL without full navigation
    if (conversation.id) {
      window.history.pushState({}, '', `/messages/${conversation.id}`);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const otherUser = getOtherParticipant(conversation);
    const recipientName = getRecipientName(otherUser).toLowerCase();
    const messagePreview = getMessagePreview(conversation).toLowerCase();
    
    return recipientName.includes(searchQuery.toLowerCase()) || 
           messagePreview.includes(searchQuery.toLowerCase());
  });

  const formatMessageTime = (createdAt: any) => {
    if (!createdAt) return '';
    
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'now';
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 w-full max-w-full overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <GiHamburgerMenu 
                className="text-xl cursor-pointer" 
                onClick={toggleSidebar}
              />
              <h1 className="text-xl font-bold">
                <span className="text-indigo-600">Neighbour</span>
                <span className="text-blue-600">Link</span>
              </h1>
            </div>
            <BsChatDots className="text-xl" />
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden w-full max-w-full">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 z-50`}
        >
          <Sidebar
            handleLogout={handleLogout}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        {/* Overlay */}
        {isSidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-1 md:ml-64 min-w-0 max-w-full overflow-hidden">
          {/* Conversations List */}
          <div className={`${
            selectedConversation && isMobile ? 'hidden' : 'w-full md:w-96'
          } border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col min-w-0`}>
            
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                {!isMobile && (
                  <button
                    onClick={() => navigate('/')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <FaArrowLeft />
                  </button>
                )}
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <BsChatDots className="text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {searchQuery ? 'Try a different search term' : 'Start a conversation by responding to a post'}
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredConversations.map((conversation) => {
                    const otherUser = getOtherParticipant(conversation);
                    const unreadCount = conversation.unreadCount?.[currentUserId || ''] || 0;
                    const recipientName = getRecipientName(otherUser);
                    const isSelected = selectedConversation?.id === conversation.id;
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors ${
                          isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-r-indigo-500' : ''
                        }`}
                        onClick={() => handleConversationSelect(conversation)}
                      >
                        {/* Avatar */}
                        <div className="relative mr-3 flex-shrink-0">
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            {otherUser?.photo ? (
                              <ImageDisplay 
                                publicId={otherUser.photo} 
                                className="h-full w-full object-cover"
                              />
                            ) : otherUser?.photoURL ? (
                              <img
                                src={otherUser.photoURL}
                                alt={recipientName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 font-medium">
                                {recipientName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {/* Online indicator (placeholder) */}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                        </div>

                        {/* Message Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className={`font-medium truncate ${
                              unreadCount > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-900 dark:text-white'
                            }`}>
                              {recipientName}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                              {formatTimestamp(conversation.lastMessage?.timestamp || conversation.updatedAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              unreadCount > 0
                                ? 'text-gray-900 dark:text-gray-300 font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {getMessagePreview(conversation)}
                            </p>

                            {unreadCount > 0 && (
                              <span className="bg-indigo-600 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 ml-2 font-medium">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          
                          {/* Post reference */}
                          {conversation.postTitle && (
                            <div className="mt-1">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                Re: {conversation.postTitle.length > 15 
                                  ? conversation.postTitle.substring(0, 12) + '...' 
                                  : conversation.postTitle}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className={`${
            selectedConversation ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-white dark:bg-gray-900 min-w-0 max-w-full overflow-hidden`}>
            
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center">
                    {isMobile && (
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="mr-3 p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        <FaArrowLeft />
                      </button>
                    )}
                    
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
                      {otherUser?.photo ? (
                        <ImageDisplay 
                          publicId={otherUser.photo} 
                          className="h-full w-full object-cover"
                        />
                      ) : otherUser?.photoURL ? (
                        <img
                          src={otherUser.photoURL}
                          alt={getRecipientName(otherUser)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 font-medium text-sm">
                          {getRecipientName(otherUser).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {getRecipientName(otherUser)}
                      </h3>
                      <p className="text-xs text-green-500">Online</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Exchange coordination button - show for all conversations for now */}
                    <button 
                      onClick={() => {
                        console.log('Calendar button clicked');
                        console.log('Selected conversation:', selectedConversation);
                        console.log('Post ID:', selectedConversation.postId);
                        setShowExchangeModal(true);
                      }}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                      title="Arrange Meeting/Exchange"
                    >
                      <FiCalendar className="w-5 h-5" />
                    </button>
                    
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-w-0 max-w-full custom-scrollbar"
                  style={{
                    backgroundImage: "url('/assets/chat-bg.jpeg')",
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Post reference - show once at the top if this conversation is about a specific post */}
                  {selectedConversation.postId && selectedConversation.postTitle && (
                    <div className="mb-4">
                      <ItemReferenceCard
                        postId={selectedConversation.postId}
                        title={selectedConversation.postTitle}
                        imageUrl={selectedConversation.postImageUrl}
                      />
                    </div>
                  )}

                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <AiOutlineLoading3Quarters className="animate-spin text-2xl text-gray-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                        <BsChatDots className="text-2xl text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">No messages yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === currentUserId;
                        const showTimestamp = index === 0 || 
                          (messages[index - 1] && 
                           Math.abs(message.createdAt?.toMillis() - messages[index - 1].createdAt?.toMillis()) > 300000); // 5 minutes
                        
                        // Check if this message contains exchange coordination
                        const exchangeId = message.id ? exchangeMessages[message.id] : null;
                        
                        return (
                          <div key={message.id}>
                            {showTimestamp && (
                              <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-4">
                                {formatTimestamp(message.createdAt)}
                              </div>
                            )}
                            
                            {/* Special rendering for exchange messages */}
                            {exchangeId ? (
                              <div className="mb-6">
                                {/* Sender info for exchange */}
                                <div className={`flex items-center mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                  {!isOwnMessage && (
                                    <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-2">
                                      {otherUser?.photoURL || otherUser?.photo ? (
                                        otherUser?.photo ? (
                                          <ImageDisplay 
                                            publicId={otherUser.photo} 
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <img src={otherUser.photoURL} alt={getRecipientName(otherUser)} className="h-full w-full object-cover" />
                                        )
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-medium">
                                          {getRecipientName(otherUser).charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {isOwnMessage ? 'You arranged' : `${getRecipientName(otherUser)} arranged`} an exchange:
                                  </span>
                                </div>

                                {/* Exchange details */}
                                <ExchangeDetails
                                  exchangeId={exchangeId}
                                  conversationId={selectedConversation.id!}
                                  currentUserId={currentUserId!}
                                />
                              </div>
                            ) : (
                              /* Regular message rendering */
                              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
                                <div className={`max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
                                  isOwnMessage
                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                                }`}>
                                  {/* Message text */}
                                  {message.text && (
                                    <p className="break-words">{message.text}</p>
                                  )}
                                  
                                  {/* Media attachments */}
                                  {message.mediaUrls && message.mediaUrls.length > 0 && (
                                    <div className={`mt-2 grid ${message.mediaUrls.length > 1 ? 'grid-cols-2 gap-1' : ''}`}>
                                      {message.mediaUrls.map((url, i) => (
                                        <div key={i} className="mt-1">
                                          <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                            <ImageDisplay publicId={url} className="w-full h-auto max-w-full" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Message time */}
                                  <div className={`text-xs mt-1 ${
                                    isOwnMessage ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-w-0 max-w-full overflow-hidden">
                  {selectedConversation.id && currentUserId && otherUser && (
                    <MessageInput
                      conversationId={selectedConversation.id}
                      currentUserId={currentUserId}
                      otherUserId={otherUser.id}
                      postId={selectedConversation.postId}
                    />
                  )}
                </div>

                {/* Exchange Modal */}
                {showExchangeModal && selectedConversation.id && currentUserId && (
                  <ExchangeCoordination
                    conversationId={selectedConversation.id}
                    currentUserId={currentUserId}
                    postId={selectedConversation.postId || undefined}
                    onClose={() => setShowExchangeModal(false)}
                  />
                )}
              </>
            ) : (
              // No conversation selected
              <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50 dark:bg-gray-900">
                <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-6">
                  <BsChatDots className="text-3xl text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                  Choose from your existing conversations or start a new one to see messages here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      {isMobile && <Bottombar />}
    </div>
  );
};

export default ModernMessaging;
