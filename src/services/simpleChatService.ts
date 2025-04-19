import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc, 
  getDoc,
  serverTimestamp, 
  Timestamp,
  getDocs,
  updateDoc
} from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  mediaUrls?: string[]; // URLs to images, videos or other files
  mediaTypes?: string[]; // Types of media (image, video, file, etc.)
  read: boolean;
  createdAt: Timestamp;
}

export interface ChatConversation {
  id?: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  unreadCount?: { [userId: string]: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Get all conversations for a user
export const getUserChats = (userId: string, callback: (conversations: ChatConversation[]) => void) => {
  const conversationsQuery = query(
    collection(db, 'simple_conversations'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(conversationsQuery, (snapshot) => {
    const conversations: ChatConversation[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as ChatConversation);
    
    callback(conversations);
  });
};

// Get messages for a conversation
export const getChatMessages = (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
  const messagesQuery = query(
    collection(db, 'simple_messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as ChatMessage);
    
    callback(messages);
  });
};

// Create a new conversation
export const createChatConversation = async (participants: string[]): Promise<string> => {
  const conversation: Omit<ChatConversation, 'id'> = {
    participants,
    unreadCount: participants.reduce((acc, userId) => {
      acc[userId] = 0;
      return acc;
    }, {} as { [userId: string]: number }),
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // Check if conversation already exists
  const existingConvQuery = query(
    collection(db, 'simple_conversations'),
    where('participants', '==', participants.sort())
  );
  
  const existingConvs = await getDocs(existingConvQuery);
  
  if (!existingConvs.empty) {
    return existingConvs.docs[0].id;
  }
  
  const docRef = await addDoc(collection(db, 'simple_conversations'), conversation);
  return docRef.id;
};

// Send a message
export const sendChatMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  mediaUrls: string[] = [],
  mediaTypes: string[] = []
): Promise<string> => {
  // Get conversation details
  const conversationRef = doc(db, 'simple_conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) {
    throw new Error("Conversation does not exist");
  }
  
  const conversationData = conversationSnap.data() as ChatConversation;
  
  // Create message
  const message: Omit<ChatMessage, 'id'> = {
    conversationId,
    senderId,
    text,
    mediaUrls,
    mediaTypes,
    read: false,
    createdAt: serverTimestamp() as Timestamp
  };
  
  // Add message to Firestore
  const messageRef = await addDoc(collection(db, 'simple_messages'), message);
  
  // Update conversation with last message
  const participants = conversationData.participants;
  const unreadCount = conversationData.unreadCount ? { ...conversationData.unreadCount } : {};
  
  // Increment unread count for all participants except sender
  participants.forEach(userId => {
    if (userId !== senderId) {
      unreadCount[userId] = (unreadCount[userId] || 0) + 1;
    }
  });
  
  await updateDoc(conversationRef, {
    lastMessage: {
      text: text || (mediaUrls.length > 0 ? 'Sent media' : ''),
      senderId,
      timestamp: serverTimestamp()
    },
    unreadCount,
    updatedAt: serverTimestamp()
  });
  
  return messageRef.id;
};

// Mark messages as read
export const markChatAsRead = async (conversationId: string, userId: string) => {
  const conversationRef = doc(db, 'simple_conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) return;
  
  const conversationData = conversationSnap.data() as ChatConversation;
  const unreadCount = { ...conversationData.unreadCount };
  
  // Reset unread count for this user
  if (unreadCount && typeof unreadCount[userId] === 'number' && unreadCount[userId] > 0) {
    unreadCount[userId] = 0;
    await updateDoc(conversationRef, { unreadCount });
  }
  
  // Mark all messages from other users as read
  const messagesQuery = query(
    collection(db, 'simple_messages'),
    where('conversationId', '==', conversationId),
    where('senderId', '!=', userId),
    where('read', '==', false)
  );
  
  const messagesSnap = await getDocs(messagesQuery);
  
  const batch = [];
  for (const doc of messagesSnap.docs) {
    batch.push(updateDoc(doc.ref, { read: true }));
  }
  
  await Promise.all(batch);
};

// Find existing conversation between two users or create a new one
export const getOrCreateChatWithUser = async (currentUserId: string, otherUserId: string) => {
  // Create participant array and sort it for consistent lookup
  const participants = [currentUserId, otherUserId].sort();
  
  // Query for existing conversation
  const q = query(
    collection(db, 'simple_conversations'),
    where('participants', '==', participants)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }
  
  // If not found, create new conversation
  return createChatConversation(participants);
};
