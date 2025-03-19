import { initializeMessaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

const vapidKey = import.meta.env.VITE_VAPIDKEY;

// Notification types enum
export enum NotificationType {
  EMERGENCY_ALERT = "emergency_alert",
  RESPONSE_RECEIVED = "response_received",
  CHAT_MESSAGE = "chat_message",
  POST_MATCH = "post_match"
}

export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const messaging = await initializeMessaging();
      if (!messaging) {
        console.log("Messaging not supported");
        return null;
      }
      
      const token = await getToken(messaging, { vapidKey });
      
      // Store the token in Firestore for the current user
      const user = auth.currentUser;
      if (user) {
        await storeUserFCMToken(user.uid, token);
      }
      
      console.log("FCM Token:", token);
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
};

// Store the FCM token in the user's document
export const storeUserFCMToken = async (userId: string, token: string) => {
  try {
    // Validate userId to prevent invalid document references
    if (!userId) {
      console.error("Invalid userId provided to storeUserFCMToken");
      return;
    }
    
    const userRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await setDoc(userRef, { fcmToken: token }, { merge: true });
    }
  } catch (error) {
    console.error("Error storing FCM token:", error);
  }
};

export const onMessageListener = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const messaging = await initializeMessaging();
      if (!messaging) {
        reject(new Error("Messaging not supported"));
        return;
      }
      
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Display notification with custom behavior based on notification type
export const displayNotification = (title: string, body: string, type: NotificationType, data: any) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    // Create notification with type-specific icon
    const icon = getIconForNotificationType(type);
    
    const notification = new Notification(title, {
      body,
      icon,
      data
    });
    
    // Add click event for navigation
    notification.onclick = () => {
      window.focus();
      handleNotificationClick(type, data);
    };
  }
};

// Get appropriate icon for notification type
const getIconForNotificationType = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.EMERGENCY_ALERT:
      return '/icons/emergency.png';
    case NotificationType.CHAT_MESSAGE:
      return '/icons/chat.png';
    case NotificationType.RESPONSE_RECEIVED:
      return '/icons/response.png';
    case NotificationType.POST_MATCH:
      return '/icons/match.png';
    default:
      return '/favicon.ico';
  }
};

// Handle navigation when notification is clicked
const handleNotificationClick = (type: NotificationType, data: any) => {
  switch (type) {
    case NotificationType.EMERGENCY_ALERT:
      window.location.href = `/post/${data.postId}`;
      break;
    case NotificationType.CHAT_MESSAGE:
      window.location.href = `/messages/${data.chatId}`; // Changed from /chat/ to /messages/
      break;
    case NotificationType.RESPONSE_RECEIVED:
      window.location.href = `/post/${data.postId}/responses`;
      break;
    case NotificationType.POST_MATCH:
      window.location.href = `/post/${data.postId}`;
      break;
    default:
      window.location.href = '/';
      break;
  }
};