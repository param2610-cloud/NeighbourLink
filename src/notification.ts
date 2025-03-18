import { initializeMessaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";


const vapidKey = import.meta.env.VITE_VAPIDKEY; 

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
      console.log("FCM Token:", token);
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
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