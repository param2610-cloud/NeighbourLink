import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { Message, Conversation, getMessages, markConversationAsRead } from '../../services/messagingService';
import { formatDistanceToNow } from 'date-fns';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IoMdArrowBack } from 'react-icons/io';
import { FiCalendar } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import ExchangeCoordination from './ExchangeCoordination';
import ItemReferenceCard from './ItemReferenceCard';
import MessageInput from './MessageInput';
import ExchangeDetails from './ExchangeDetails';


const extractExchangeId = (text: string): string | null => {
  const exchangeIdRegex = /Exchange ID: ([a-zA-Z0-9]+)/;
  const match = text.match(exchangeIdRegex);
  return match ? match[1] : null;
};

const ChatDetail = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;


  const [exchangeMessages, setExchangeMessages] = useState<{ [messageId: string]: string }>({});

  useEffect(() => {
    if (!conversationId || !currentUserId) return;


    const fetchConversation = async () => {
      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);

        if (!conversationSnap.exists()) {
          setError("Conversation not found");
          setLoading(false);
          return;
        }

        const conversationData = { id: conversationSnap.id, ...conversationSnap.data() } as Conversation;
        setConversation(conversationData);


        const otherUserId = conversationData.participants.find(id => id !== currentUserId);

        if (otherUserId) {
          const userRef = doc(db, 'Users', otherUserId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setOtherUser({ id: otherUserId, ...userSnap.data() });
          }
        }


        await markConversationAsRead(conversationId, currentUserId);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        setError("Could not load conversation details");
      }
    };

    fetchConversation();


    const unsubscribe = getMessages(conversationId, (messageList) => {
      setMessages(messageList);
      setLoading(false);


      if (messageList.length > 0) {
        markConversationAsRead(conversationId, currentUserId);
      }
    });

    return () => unsubscribe();
  }, [conversationId, currentUserId]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  useEffect(() => {
    const exchanges: { [messageId: string]: string } = {};

    messages.forEach(message => {
      const exchangeId = extractExchangeId(message.text);
      if (exchangeId && message.id) {
        exchanges[message.id] = exchangeId;
      }
    });

    setExchangeMessages(exchanges);
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
    if (!user) return 'User';
    
    
    if (user.displayName && user.displayName.trim()) {
      return user.displayName;
    }
    
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    
    if (user.email) {
      
      return user.email.split('@')[0];
    }
    
    return 'User'; 
  };


  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <AiOutlineLoading3Quarters size={40} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6">
        <h3 className="text-lg font-medium text-red-500 mb-2">Error</h3>
        <p className="text-gray-600 dark:text-gray-400">{error || "Conversation could not be loaded"}</p>
        <button
          onClick={() => navigate('/messages')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 flex items-center bg-white dark:bg-gray-800 shadow-sm z-10">
        <button
          onClick={() => navigate('/messages')}
          className="p-1 mr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <IoMdArrowBack size={24} />
        </button>

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

        {/* Exchange coordination button */}
        {conversation?.postId && (
          <button
            onClick={() => setShowExchangeModal(true)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full dark:text-indigo-400 dark:hover:bg-indigo-900/30"
            title="Arrange Exchange"
          >
            <FiCalendar size={20} />
          </button>
        )}
      </div>

      {/* Item reference card - if related to a post */}
      {conversation.postId && (
        <ItemReferenceCard
          postId={conversation.postId}
          title={conversation.postTitle || 'Post'}
          imageUrl={conversation.postImageUrl}
        />
      )}

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


                  if (message.id && exchangeMessages[message.id]) {
                    return (
                      <div key={message.id} className="mb-6">
                        {/* Sender info */}
                        <div className={`flex items-center mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {!isMine && (
                            <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-2">
                              {otherUser?.photoURL ? (
                                <img src={otherUser.photoURL} alt={getDisplayName(otherUser)} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                                  {getDisplayName(otherUser).charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {isMine ? 'You arranged' : `${getDisplayName(otherUser)} arranged`} an exchange:
                          </span>
                        </div>

                        {/* Exchange details */}
                        <ExchangeDetails
                          exchangeId={exchangeMessages[message.id]}
                          conversationId={conversationId || ''}
                          currentUserId={currentUserId || ''}
                        />
                      </div>
                    );
                  }


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
                        <div className={`rounded-2xl px-4 py-2 ${isMine
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                          {message.text}
                        </div>

                        {/* Media attachments */}
                        {message.mediaUrls && message.mediaUrls.length > 0 && (
                          <div className={`mt-1 grid ${message.mediaUrls.length > 1 ? 'grid-cols-2 gap-1' : ''
                            }`}>
                            {message.mediaUrls.map((url, i) => (
                              <div
                                key={i}
                                className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                              >
                                <ImageDisplay objectKey={url} />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className={`text-xs mt-1 ${isMine ? 'text-right text-gray-500' : 'text-gray-500'
                          }`}>
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
      <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        {otherUser?.id && (<MessageInput
          conversationId={conversationId || ''}
          currentUserId={currentUserId || ''}
          otherUserId={otherUser?.id || ''}
          postId={conversation.postId}
        />)}
      </div>

      {/* Exchange coordination modal */}
      {showExchangeModal && (
        <ExchangeCoordination
          conversationId={conversationId || ''}
          currentUserId={currentUserId || ''}
          postId={conversation.postId || ''}
          onClose={() => setShowExchangeModal(false)}
        />
      )}
    </div>
  );
};

export default ChatDetail;
