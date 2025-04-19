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

// Remove unused import
// import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  mediaUrls?: string[];
  read: boolean;
  createdAt: Timestamp;
}

export interface Conversation {
  id?: string;
  participants: string[];
  postId?: string;
  postTitle?: string;
  postImageUrl?: string;
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
export const getUserConversations = (userId: string, callback: (conversations: Conversation[]) => void) => {
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(conversationsQuery, async (snapshot) => {
    const conversations: Conversation[] = [];
    
    for (const doc of snapshot.docs) {
      const conversationData = { id: doc.id, ...doc.data() } as Conversation;
      conversations.push(conversationData);
    }
    
    callback(conversations);
  });
};

// Get messages for a conversation
export const getMessages = (conversationId: string, callback: (messages: Message[]) => void) => {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: Message[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Message);
    
    callback(messages);
  });
};

// Create a new conversation
export const createConversation = async (
  participants: string[], 
  postId?: string, 
  postTitle?: string, 
  postImageUrl?: string
): Promise<string> => {
  const conversation: Omit<Conversation, 'id'> = {
    participants,
    // Use optional properties correctly by only adding them if they exist
    ...(postId ? { postId } : {}),
    ...(postTitle ? { postTitle } : {}),
    ...(postImageUrl ? { postImageUrl } : {}),
    unreadCount: participants.reduce((acc, userId) => {
      acc[userId] = 0;
      return acc;
    }, {} as { [userId: string]: number }),
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // Check if conversation already exists
  const existingConvQuery = query(
    collection(db, 'conversations'),
    where('participants', '==', participants.sort()),
    where('postId', '==', postId || null)
  );
  
  const existingConvs = await getDocs(existingConvQuery);
  
  if (!existingConvs.empty) {
    return existingConvs.docs[0].id;
  }
  
  const docRef = await addDoc(collection(db, 'conversations'), conversation);
  return docRef.id;
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  mediaUrls: string[] = []
): Promise<string> => {
  // Get conversation details
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) {
    throw new Error("Conversation does not exist");
  }
  
  const conversationData = conversationSnap.data() as Conversation;
  
  // Create message
  const message: Omit<Message, 'id'> = {
    conversationId,
    senderId,
    text,
    mediaUrls,
    read: false,
    createdAt: serverTimestamp() as Timestamp
  };
  
  // Add message to Firestore
  const messageRef = await addDoc(collection(db, 'messages'), message);
  
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
      text,
      senderId,
      timestamp: serverTimestamp()
    },
    unreadCount,
    updatedAt: serverTimestamp()
  });
  
  return messageRef.id;
};

// Mark messages as read
export const markConversationAsRead = async (conversationId: string, userId: string) => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) return;
  
  const conversationData = conversationSnap.data() as Conversation;
  const unreadCount = { ...conversationData.unreadCount };
  
  // Reset unread count for this user - fixed condition to avoid "always truthy" warning
  if (unreadCount && typeof unreadCount[userId] === 'number' && unreadCount[userId] > 0) {
    unreadCount[userId] = 0;
    await updateDoc(conversationRef, { unreadCount });
  }
  
  // Mark all messages from other users as read
  const messagesQuery = query(
    collection(db, 'messages'),
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

// Get user profile details
export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'Users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  return { id: userId, ...userSnap.data() };
};

// Get conversation with specific user about specific post
export const getOrCreateConversationWithUser = async (
  currentUserId: string, 
  otherUserId: string, 
  postId?: string,
  postTitle?: string,
  postImageUrl?: string
) => {
  // First, check if there's a conversation with the specific post
  if (postId) {
    const postSpecificQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUserId),
      where('postId', '==', postId)
    );
    
    const postQuerySnapshot = await getDocs(postSpecificQuery);
    
    // Find conversation with the other user
    for (const doc of postQuerySnapshot.docs) {
      const convo = doc.data() as Conversation;
      if (convo.participants.includes(otherUserId)) {
        return doc.id;
      }
    }
  }
  
  // If no post-specific conversation, check for any conversation between these users
  const generalQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUserId)
  );
  
  const generalQuerySnapshot = await getDocs(generalQuery);
  
  // Find any conversation with the other user
  for (const doc of generalQuerySnapshot.docs) {
    const convo = doc.data() as Conversation;
    if (convo.participants.includes(otherUserId)) {
      return doc.id;
    }
  }
  
  // If not found, create new conversation
  return createConversation(
    [currentUserId, otherUserId], 
    postId,
    postTitle,
    postImageUrl
  );
};
