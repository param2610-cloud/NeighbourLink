import { db } from "../firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { NotificationType } from "../notification";
import axios from "axios";

// Firebase Cloud Functions URL for sending notifications
const NOTIFICATION_API_URL = "https://us-central1-neighbourlink-b1b32.cloudfunctions.net/sendNotification";

/**
 * Sends notification to a specific user by ID
 */
export const sendNotificationToUser = async (
  userId: string, 
  title: string, 
  body: string, 
  notificationType: NotificationType,
  data: any
) => {
  try {
    // Validate userId to prevent invalid document references
    if (!userId) {
      console.error("Invalid userId provided to sendNotificationToUser");
      return;
    }
    
    // Get the user document to retrieve FCM token
    const userRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().fcmToken) {
      const token = userDoc.data().fcmToken;
      
      // Send notification via Cloud Function
      await axios.post(NOTIFICATION_API_URL, {
        token,
        notification: {
          title,
          body
        },
        data: {
          type: notificationType,
          ...data
        }
      });
    }else{
      console.error("User does not have an FCM token");
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

/**
 * Sends emergency notifications to users within a specified radius
 */
export const sendEmergencyNotifications = async (
  postId: string,
  title: string,
  body: string,
  coordinates: { lat: string, lng: string },
  radiusKm: number
) => {
  try {
    // Get all users with emergency notifications enabled
    const usersQuery = query(
      collection(db, "Users"), 
      where("notifyEmergency", "==", true)
    );
    
    const userSnapshot = await getDocs(usersQuery);
    
    // Filter users by distance from the emergency
    userSnapshot.forEach(async (userDoc) => {
      const userData = userDoc.data();
      
      // If user has location data
      if (userData.coordinates && userData.fcmToken) {
        const userCoordinates = userData.coordinates;
        
        // Calculate distance between emergency and user
        const distance = calculateDistance(
          parseFloat(coordinates.lat),
          parseFloat(coordinates.lng),
          parseFloat(userCoordinates.lat),
          parseFloat(userCoordinates.lng)
        );
        
        // If user is within radius, send notification
        if (distance <= radiusKm) {
          await axios.post(NOTIFICATION_API_URL, {
            token: userData.fcmToken,
            notification: {
              title,
              body
            },
            data: {
              type: NotificationType.EMERGENCY_ALERT,
              postId: postId,
              distance: Math.round(distance * 10) / 10
            }
          });
        }
      }
    });
  } catch (error) {
    console.error("Error sending emergency notifications:", error);
  }
};

/**
 * Sends notification for new responses to a post
 */
export const sendResponseNotification = async (
  postId: string,
  postOwnerId: string,
  responderName: string
) => {
  try {
    // Validate postOwnerId before proceeding
    if (!postOwnerId) {
      console.error("Invalid postOwnerId provided to sendResponseNotification");
      return;
    }
    
    // Get the post details
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const postData = postDoc.data();
      
      await sendNotificationToUser(
        postOwnerId,
        "New Response",
        `${responderName} has responded to your post: ${postData.title}`,
        NotificationType.RESPONSE_RECEIVED,
        { postId }
      );
    }
  } catch (error) {
    console.error("Error sending response notification:", error);
  }
};

/**
 * Sends notification for new chat messages
 */
export const sendChatMessageNotification = async (
  chatId: string,
  recipientId: string,
  senderName: string,
  messagePreview: string
) => {
  try {
    // Validate recipientId before passing to sendNotificationToUser
    if (!recipientId) {
      console.error("Invalid recipientId provided to sendChatMessageNotification");
      return;
    }
    
    await sendNotificationToUser(
      recipientId,
      `New message from ${senderName}`,
      messagePreview,
      NotificationType.CHAT_MESSAGE,
      { chatId }
    );
  } catch (error) {
    console.error("Error sending chat notification:", error);
  }
};

/**
 * Calculate distance between two points in kilometers
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
