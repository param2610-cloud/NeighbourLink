import { getMessaging, getToken } from "firebase/messaging";

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

// Call this during both registration and login
export const setupFCMToken = async (userId: string) => {
  try {
    // Check if the browser supports service workers
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    // Register service worker first
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await registration.update();

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const messaging = getMessaging();
      
      // Get the token
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (!token) {
        throw new Error('Failed to generate FCM token');
      }

      // Store the token in Firestore
      const userRef = doc(db, "Users", userId);
      await setDoc(userRef, { fcmToken: token }, { merge: true });
      
      // Listen for token refreshes
      setupTokenRefreshListener({messaging, userId});
    } else {
      throw new Error('Notification permission denied');
    }
  } catch (error) {
    console.error("Error setting up FCM token:", error);
    throw error; // Re-throw to allow handling by caller
  }
};

// Setup token refresh listener
interface TokenRefreshProps {
    messaging: any; // Using firebase.messaging.Messaging would be better if you import the type
    userId: string;
}

// Setup token refresh listener
const setupTokenRefreshListener = ({ messaging, userId }: TokenRefreshProps): void => {
    // This will fire when the token refreshes
    messaging.onTokenRefresh(() => {
        getToken(messaging).then((refreshedToken: string) => {
            const userRef = doc(db, "Users", userId);
            setDoc(userRef, { fcmToken: refreshedToken }, { merge: true });
        });
    });
};