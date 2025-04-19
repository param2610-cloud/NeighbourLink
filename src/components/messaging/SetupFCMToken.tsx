import { getMessaging, getToken } from "firebase/messaging";

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";


export const setupFCMToken = async (userId: string) => {
  try {
    
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await registration.update();

    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const messaging = getMessaging();
      
      
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (!token) {
        throw new Error('Failed to generate FCM token');
      }

      
      const userRef = doc(db, "Users", userId);
      await setDoc(userRef, { fcmToken: token }, { merge: true });
      
      
      setupTokenRefreshListener({messaging, userId});
    } else {
      throw new Error('Notification permission denied');
    }
  } catch (error) {
    console.error("Error setting up FCM token:", error);
    throw error; 
  }
};


interface TokenRefreshProps {
    messaging: any; 
    userId: string;
}


const setupTokenRefreshListener = ({ messaging, userId }: TokenRefreshProps): void => {
    
    messaging.onTokenRefresh(() => {
        getToken(messaging).then((refreshedToken: string) => {
            const userRef = doc(db, "Users", userId);
            setDoc(userRef, { fcmToken: refreshedToken }, { merge: true });
        });
    });
};