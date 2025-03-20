import { getMessaging, onMessage } from "firebase/messaging";
import { NotificationType } from "../notification";
import { toast, ToastOptions } from "react-toastify";


interface NotificationData {
  type: NotificationType;
  conversationId?: string;
  alertId?: string;
  [key: string]: any;
}

export const initNotificationHandlers = () => {
  try {
    const messaging = getMessaging();
    
    // Set up message handler for foreground notifications
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Create and display a custom notification UI
      // This is needed because foreground messages don't show automatically
      const { notification } = payload;
      const title = notification?.title;
      const body = notification?.body;
      const data = payload.data as NotificationData || {};
      
      if (title && body) {
        // You can use a toast notification library like react-toastify
        // or create your own custom notification component
        showCustomNotification(title, body, data);
      }
    });
    
    // This line is unreachable - moved to after the try/catch
  } catch (error) {
    console.error("Error setting up notification handlers:", error);
    // Return unsubscribe function that does nothing in case of error
    return () => {};
  }
};

// Custom notification display function
const showCustomNotification = (
  title: string,
  body: string,
  data: NotificationData
): void => {
  const toastOptions: ToastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };
  
  const content = (
    <div className="notification-content">
      <h4 className="notification-title">{title}</h4>
      <p className="notification-body">{body}</p>
    </div>
  );
  
  // You can handle different notification types differently
  switch(data.type) {
    case NotificationType.CHAT_MESSAGE:
      // Special handling for chat messages
      toast.info(content, {
        ...toastOptions,
        icon: () => <div>💬</div>,
        onClick: () => {
          // Navigate to chat or conversation
          if (data.conversationId) {
            window.location.href = `/chat/${data.conversationId}`;
          }
        }
      });
      break;
      
    case NotificationType.EMERGENCY_ALERT:
      // Special handling for emergency alerts
      toast.error(content, {
        ...toastOptions,
        icon: () => <div>🚨</div>,
        autoClose: false, // Emergency alerts should stay until dismissed
        className: "emergency-notification",
        onClick: () => {
          // Navigate to emergency alert details
          if (data.alertId) {
            window.location.href = `/messages`;
          }
        }
      });
      
      // Play sound for emergency alerts - using try/catch for better error handling
      // try {
      //   const alertSound = new Audio('/sounds/emergency-alert.mp3');
      //   alertSound.play();
      // } catch (err) {
      //   console.error("Could not play alert sound:", err);
      // }
      break;
      
    default:
      // Default notification handling for other types
      toast.info(content, toastOptions);
      break;
  }
  
  // Log notification for tracking purposes
  console.log(`Notification displayed: ${title}`, data);
};

// Log initialization outside the try/catch to confirm it ran
console.log("Notification handlers initialized");