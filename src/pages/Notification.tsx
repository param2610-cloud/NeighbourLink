import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { FaMedkit, FaTools, FaBook, FaHome, FaUtensils } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdOutlineWarning } from "react-icons/md";
import { motion } from "framer-motion";
import Bottombar from "@/components/authPage/structures/Bottombar";
import Sidebar from "@/components/authPage/structures/Sidebar";

// type FilterType = "all" | "need" | "offer";

interface Post {
  id: string;
  title: string;
  category: string;
  urgencyLevel: number;
  coordinates: { lat: number; lng: number } | null;
  userId: string;
  userName?: string;
  userPhoto?: string;
  distance?: number;
}

const Notification: React.FC = () => {
  const [, setPosts] = useState<Post[]>([]);
  const [, setLoading] = useState(true);
  const [radius, ] = useState(3);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasEmergencyAlerts, setHasEmergencyAlerts] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<Post[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch posts based on user location and radius
  useEffect(() => {
    if (!userLocation) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const emergencyData: Post[] = [];

        const postsWithUserPromises = querySnapshot.docs.map(async (document) => {
          const data = document.data() as Omit<Post, "id">;
          const post = { id: document.id, ...data } as Post;

          if (post.userId) {
            try {
              const userDoc = await getDoc(doc(db, "Users", post.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                post.userName = userData.firstName ? `${userData.firstName} ${userData.lastName}` : userData.displayName || "User";
                post.userPhoto = userData.photo || null;
              }
            } catch (userError) {
              console.error("Error fetching user data:", userError);
            }
          }

          if (post.coordinates && userLocation) {
            post.distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              post.coordinates.lat,
              post.coordinates.lng
            );

            if (post.urgencyLevel === 3) {
              emergencyData.push(post);
            }
            return post;
          }
          return null;
        });

        const resolvedPosts = await Promise.all(postsWithUserPromises);
        const filteredPosts = resolvedPosts.filter((post) => post !== null) as Post[];

        setPosts(filteredPosts);
        setEmergencyAlerts(emergencyData);
        setHasEmergencyAlerts(emergencyData.length > 0);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userLocation, radius]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  // Get category icon based on post category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Medical":
        return <FaMedkit className="text-red-500" />;
      case "Tools":
        return <FaTools className="text-yellow-600" />;
      case "Books":
        return <FaBook className="text-blue-600" />;
      case "Household":
        return <FaHome className="text-green-600" />;
      case "Food":
        return <FaUtensils className="text-orange-500" />;
      default:
        return null;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } },
  };

  const alertVariants = {
    hidden: { x: -300, opacity: 0 },
    show: { x: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 100 } },
  };

  async function handleLogout() {
    try {
      await auth.signOut();
      window.location.href = "/login";
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging out:", error.message);
      }
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 z-40`}
      >
        <Sidebar
          // userDetails={userDetails}
          handleLogout={handleLogout}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center justify-between p-4">
          <GiHamburgerMenu
            className="text-2xl text-gray-700 dark:text-gray-200 cursor-pointer"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-800 dark:text-blue-700">Neighbour</h1>
            <h1 className="text-xl font-bold text-violet-800 dark:text-violet-700">Link</h1>
          </div>
          <IoMdNotifications
            className="text-2xl text-gray-700 dark:text-gray-200 cursor-pointer"
            onClick={() => navigate("/notifications")}
          />
        </div>
      </div>

      {/* Emergency Alerts Banner */}
      {hasEmergencyAlerts && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={alertVariants}
          className="bg-red-100 dark:bg-red-900 p-4 shadow-inner"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: 3, repeatDelay: 2 }}>
                <MdOutlineWarning className="text-xl text-red-600 dark:text-red-400 mr-2" />
              </motion.div>
              <h3 className="font-bold text-red-600 dark:text-red-400">Emergency Alerts</h3>
            </div>
            <button onClick={() => setHasEmergencyAlerts(false)} className="text-red-600 dark:text-red-400">
              Dismiss
            </button>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {emergencyAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-md p-3 mb-2 shadow-sm cursor-pointer"
                onClick={() => navigate(`/post/${alert.id}`)}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-2xl">{getCategoryIcon(alert.category)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Emergency • {alert.distance ? `${alert.distance.toFixed(1)} km away` : "Distance unknown"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      <Bottombar />
    </div>
  );
};

export default Notification;