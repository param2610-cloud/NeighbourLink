import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/messaging';

declare global {
  interface Window {
    FIREBASE_CONFIG: any;
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY ,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN ,
  projectId: import.meta.env.VITE_FB_PROJECT_ID ,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET ,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID ,
  appId: import.meta.env.VITE_FB_APP_ID ,
  measurementId: import.meta.env.VITE_FB_APP_MEASUREMENT_ID ,
};

if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = {
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FB_APP_ID
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let messaging;
const initializeMessaging = async () => {
    try {
        if (await isSupported()) {
            messaging = getMessaging(app);
            return messaging;
        }
        console.log("Firebase messaging is not supported in this browser");
        return null;
    } catch (error) {
        console.error("Error initializing Firebase messaging:", error);
        return null;
    }
};

export { auth, db, initializeMessaging };