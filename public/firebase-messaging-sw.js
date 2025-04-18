// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgY_u8JRYyn6pdezJVlaB_teB8ZPyzorI",
  authDomain: "neighbourlink-b1b32.firebaseapp.com",
  projectId: "neighbourlink-b1b32",
  storageBucket: "neighbourlink-b1b32.firebasestorage.app",
  messagingSenderId: "343739130102",
  appId: "1:343739130102:web:bf146d1ac264f266e98cd7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click in the background
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get the notification data
  const data = event.notification.data;
  
  // Create URL to navigate to based on notification type
  let url = '/';
  
  if (data) {
    switch (data.type) {
      case 'emergency_alert':
        url = `/post/${data.postId}`;
        break;
      case 'chat_message':
        url = `/messages/${data.chatId}`; // Changed from /chat/ to /messages/
        break;
      case 'response_received':
        url = `/post/${data.postId}/responses`;
        break;
      case 'post_match':
        url = `/post/${data.postId}`;
        break;
      default:
        url = '/';
        break;
    }
  }
  
  // Open the appropriate page
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If there's an open window, navigate it to the URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Get appropriate icon for notification type
function getIconForNotificationType(type) {
  switch (type) {
    case 'emergency_alert':
      return '/icons/emergency.png';
    case 'chat_message':
      return '/icons/chat.png';
    case 'response_received':
      return '/icons/response.png';
    case 'post_match':
      return '/icons/match.png';
    default:
      return '/favicon.ico';
  }
}