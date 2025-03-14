import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import {
  requestNotificationPermission,
  onMessageListener,
} from "./notification";
import "./App.css";
import LandingPage from "./components/landingpage/LandingPage";
import Register from "./components/authPage/Register";
import { ToastContainer } from "react-toastify";
import Login from "./components/authPage/login";
import Profile from "./components/authPage/Profile";
import { auth } from "./firebase";

function App() {
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [user, setUser] = useState<any>();
  useEffect(()=>{
    auth.onAuthStateChanged((user)=>{
      setUser(user);
    })
  })

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
          .catch((err) => {
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
    <>
      <Router>
        <div className="app-container border border-gray-300">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/profile" /> : <LandingPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          {!notificationsSupported && (
            <p className="text-orange-500">
              Note: Push notifications are not supported in this browser.
            </p>
          )}
        </div>
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
