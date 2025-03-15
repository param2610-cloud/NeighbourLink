import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging,isSupported } from "firebase/messaging";
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/messaging';

// Extend Window interface to include FIREBASE_CONFIG
declare global {
  interface Window {
    FIREBASE_CONFIG: any;
  }
}

const firebaseConfig = {
    apiKey: "AIzaSyBgY_u8JRYyn6pdezJVlaB_teB8ZPyzorI",
    authDomain: "neighbourlink-b1b32.firebaseapp.com",
    projectId: "neighbourlink-b1b32",
    storageBucket: "neighbourlink-b1b32.firebasestorage.app",
    messagingSenderId: "343739130102",
    appId: "1:343739130102:web:bf146d1ac264f266e98cd7",
    measurementId: "G-P6S5BCB9R6"
};

if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyBgY_u8JRYyn6pdezJVlaB_teB8ZPyzorI",
    authDomain: "neighbourlink-b1b32.firebaseapp.com",
    projectId: "neighbourlink-b1b32",
    storageBucket: "neighbourlink-b1b32.firebasestorage.app",
    messagingSenderId: "343739130102",
    appId: "1:343739130102:web:bf146d1ac264f266e98cd7"
  };
}
// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//     appId: import.meta.env.VITE_FIREBASE_APP_ID,
//     measurementId: import.meta.env.VITE_FIREBASE_APP_MEASUREMENT_ID
// };

// if (typeof window !== 'undefined') {
//   window.FIREBASE_CONFIG = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//     appId: import.meta.env.VITE_FIREBASE_APP_ID
//   };
// }

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
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

export { auth, db, storage, initializeMessaging };