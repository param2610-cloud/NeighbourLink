import { displayNotification, NotificationType } from "../notification";

/**
 * Utility function to test notifications
 * This function can be used in development to test notification display and clicking
 */
export const testNotification = (type: NotificationType) => {
  let title = '';
  let body = '';
  let data: any = {};
  
  switch (type) {
    case NotificationType.EMERGENCY_ALERT:
      title = 'Emergency Alert: Test';
      body = 'This is a test emergency alert. Click to view details.';
      data = { postId: 'test-post-id' };
      break;
    
    case NotificationType.CHAT_MESSAGE:
      title = 'New message: Test';
      body = 'This is a test chat message. Click to view the conversation.';
      data = { chatId: 'test-chat-id' };
      break;
      
    case NotificationType.RESPONSE_RECEIVED:
      title = 'New response: Test';
      body = 'Someone responded to your post. Click to view.';
      data = { postId: 'test-post-id' };
      break;
      
    case NotificationType.POST_MATCH:
      title = 'New match: Test';
      body = 'We found a match for your request. Click to view details.';
      data = { postId: 'test-post-id' };
      break;
  }
  
  displayNotification(title, body, type, data);
  return { title, body, type, data };
};

/**
 * Function to verify if notifications are working
 * Returns true if notifications are supported and permission is granted
 */
export const verifyNotificationSupport = () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }
  
  return Notification.permission === "granted";
};
