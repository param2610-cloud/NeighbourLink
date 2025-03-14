import { useEffect, useState } from "react";
import { requestNotificationPermission, onMessageListener } from "./notification";
import "./App.css";
import LandingPage from "./components/landingpage/LandingPage";

function App() {
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  
  useEffect(() => {
    async function setupNotifications() {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log("FCM Token:", token);
        } else {
          setNotificationsSupported(false);
        }

        onMessageListener()
          .then((payload) => {
            console.log("Message received:", payload);
            // Display notification to the user
          })
          .catch(err => {
            console.error("Error with message listener:", err);
            setNotificationsSupported(false);
          });
      } catch (error) {
        console.error("Failed to set up notifications:", error);
        setNotificationsSupported(false);
      }
    }
    
    setupNotifications();
  }, []);

  return (
    <div className="app-container border border-gray-300 ">
      <LandingPage/>
      {!notificationsSupported && (
      <p className="text-orange-500">
        Note: Push notifications are not supported in this browser.
      </p>
      )}
    </div>
  );
}

export default App;