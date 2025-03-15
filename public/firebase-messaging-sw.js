// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyBgY_u8JRYyn6pdezJVlaB_teB8ZPyzorI",
  authDomain: "neighbourlink-b1b32.firebaseapp.com",
  projectId: "neighbourlink-b1b32",
  storageBucket: "neighbourlink-b1b32.firebasestorage.app",
  messagingSenderId: "343739130102",
  appId: "1:343739130102:web:bf146d1ac264f266e98cd7"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});