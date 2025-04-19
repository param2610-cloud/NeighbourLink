import { useEffect } from "react";
import { ref, onValue, push, set, get } from "firebase/database";
import { realtimeDB as db } from "@/firebase";
import { useStateContext } from "@/contexts/StateContext";

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
