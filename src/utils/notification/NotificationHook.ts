import { useEffect } from "react";
import { ref, onValue, push, set, get } from "firebase/database";
import { realtimeDB as db, db as firestoreDB } from "@/firebase";
import { useStateContext } from "@/contexts/StateContext";
import { collection, getDocs } from "firebase/firestore";

// --------------------
// ✅ Notification Type
// --------------------
interface NotificationData {
  title: string;
  receipt: string[];
  description: string;
  action_url: string;
}

// --------------------
// ✅ Add Notification
// --------------------
/**
 * Adds a notification to the Firebase Realtime Database.
 * title: The title of the notification.
 * receipt: Array of the user IDs to receive the notification.
 * description: The description of the notification.
 * action_url: The URL to be opened when the notification is clicked.
 * @param {NotificationData} notification - The notification data to be added.
 */
export function addNotification({
  title,
  receipt,
  description,
  action_url,
}: NotificationData): void {
  const notificationsRef = ref(db, "notifications");
  const newNotificationRef = push(notificationsRef);

  set(newNotificationRef, {
    title,
    receipt,
    description,
    action_url,
  })
    .then(() => {
      console.log("Notification added successfully");
    })
    .catch((error) => {
      console.error("Error adding notification:", error);
    });
}

// --------------------
// ✅ Listen for Notifications
// --------------------
function listenToUserNotifications(userId: string): void {
  const notificationsRef = ref(db, "notifications");

  let shown: string[] = JSON.parse(
    localStorage.getItem("shown_notifications") || "[]"
  );

  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    Object.entries(data).forEach(([id, notif]: [string, any]) => {
      const alreadyShown = shown.includes(id);

      console.log(id, shown);

      if (
        Array.isArray(notif.receipt) &&
        notif.receipt.includes(userId) &&
        !alreadyShown
      ) {
        if (Notification.permission === "granted") {
          new Notification(notif.title, {
            body: notif.description,
            data: { url: notif.action_url },
          });

          shown.push(id);
          localStorage.setItem("shown_notifications", JSON.stringify(shown));
        }
      }
    });
  });
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  action_url: string;
  receipt: string[];
}

export async function fetchUserNotifications(
  userId: string
): Promise<NotificationItem[]> {
  const notificationsRef = ref(db, "notifications");

  try {
    const snapshot = await get(notificationsRef);
    const data = snapshot.val();
    if (!data) return [];

    const notifications: NotificationItem[] = [];

    Object.entries(data).forEach(([id, notif]: [string, any]) => {
      if (Array.isArray(notif.receipt) && notif.receipt.includes(userId)) {
        notifications.push({
          id,
          title: notif.title,
          description: notif.description,
          action_url: notif.action_url,
          receipt: notif.receipt,
        });
      }
    });
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

// --------------------
// ✅ Custom Hook
// --------------------
export const useNotification = () => {
  const { user } = useStateContext();

  useEffect(() => {
    if (!user?.uid) return;

    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          listenToUserNotifications(user.uid);
        }
      });
    } else {
      console.log("This browser does not support desktop notifications.");
    }
  }, [user?.uid]);
};

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula.
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Sends notifications to users within a specified radius from a location about a high urgency resource post.
 * @param postId - The ID of the created post
 * @param postTitle - The title of the post
 * @param postDescription - The description of the post
 * @param location - The location where the post was created
 * @param radius - The radius in kilometers to find users within
 * @param currentUserId - The ID of the user creating the post (to avoid self-notification)
 */
export async function notifyNearbyUsersAboutResource(
  postId: string,
  postTitle: string, 
  postDescription: string,
  location: { latitude: number, longitude: number },
  radius: number = 5,
  currentUserId: string
): Promise<void> {
  try {
    // Query all users from Firestore
    const usersRef = collection(firestoreDB, "users");
    const usersSnapshot = await getDocs(usersRef);
    const nearbyUsers: string[] = [];

    // Filter users by distance
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      
      // Skip current user
      if (userId === currentUserId) return;
      
      // Check if user has location data
      if (userData.location && userData.location.latitude && userData.location.longitude) {
        const userLat = parseFloat(userData.location.latitude);
        const userLng = parseFloat(userData.location.longitude);
        
        const distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          userLat, 
          userLng
        );
        
        // If user is within the radius, add them to the list
        if (distance <= radius) {
          nearbyUsers.push(userId);
        }
      }
    });

    console.log(`Found ${nearbyUsers.length} users within ${radius}km radius`);
    
    if (nearbyUsers.length > 0) {
      // Prepare the notification
      const notification = {
        title: `URGENT: ${postTitle}`,
        description: `High urgency resource request nearby: ${postDescription.substring(0, 100)}${postDescription.length > 100 ? '...' : ''}`,
        receipt: nearbyUsers,
        action_url: `/resource/${postId}` // URL to the resource details page
      };
      
      // Send the notification
      addNotification(notification);
      console.log("Urgent resource notification sent to nearby users");
    }
  } catch (error) {
    console.error("Error notifying nearby users:", error);
  }
}

/**
 * Sends notifications to users within a specified radius from a location about a new event.
 * @param eventId - The ID of the created event
 * @param eventTitle - The title of the event
 * @param eventDescription - The description of the event
 * @param location - The location where the event will take place
 * @param eventDate - The date of the event
 * @param radius - The radius in kilometers to find users within
 * @param currentUserId - The ID of the user creating the event (to avoid self-notification)
 */
export async function notifyNearbyUsersAboutEvent(
  eventId: string,
  eventTitle: string, 
  eventDescription: string,
  location: { latitude: number, longitude: number },
  eventDate: string,
  radius: number = 10,
  currentUserId: string
): Promise<void> {
  try {
    // Query all users from Firestore
    const usersRef = collection(firestoreDB, "users");
    const usersSnapshot = await getDocs(usersRef);
    const nearbyUsers: string[] = [];

    // Filter users by distance
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      
      // Skip current user
      if (userId === currentUserId) return;
      
      // Check if user has location data
      if (userData.location && userData.location.latitude && userData.location.longitude) {
        const userLat = parseFloat(userData.location.latitude);
        const userLng = parseFloat(userData.location.longitude);
        
        const distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          userLat, 
          userLng
        );
        
        // If user is within the radius, add them to the list
        if (distance <= radius) {
          nearbyUsers.push(userId);
        }
      }
    });

    console.log(`Found ${nearbyUsers.length} users within ${radius}km radius for event notification`);
    
    if (nearbyUsers.length > 0) {
      // Format event date for display
      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Prepare the notification
      const notification = {
        title: `New Event: ${eventTitle}`,
        description: `${formattedDate}: ${eventDescription.substring(0, 100)}${eventDescription.length > 100 ? '...' : ''}`,
        receipt: nearbyUsers,
        action_url: `/event/${eventId}` // URL to the event details page
      };
      
      // Send the notification
      addNotification(notification);
      console.log("Event notification sent to nearby users");
    }
  } catch (error) {
    console.error("Error notifying nearby users about event:", error);
  }
}
