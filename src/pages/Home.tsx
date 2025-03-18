import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { FaMedkit, FaTools, FaBook, FaHome, FaUtensils, FaPlus } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { IoMdNotifications } from "react-icons/io";
import { BiSearchAlt, BiMessageDetail } from "react-icons/bi";
import { MdOutlineWarning } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { AiOutlineHome } from "react-icons/ai";
import { ImageDisplay } from "../components/AWS/UploadFile";
import { motion } from "framer-motion"; // Import framer-motion

interface Post {
  id: string;
  title: string;
  category: string;
  description: string;
  urgencyLevel: number;
  photoUrls: string[];
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  userId: string;
  postType: "need" | "offer";
  duration: string;
  visibilityRadius: number;
  isAnonymous: boolean;
  createdAt: Timestamp;
  userName?: string; // Optional, can be populated after fetching
  userPhoto?: string; // Optional, can be populated after fetching
  distance?: number; // Will be calculated based on user's location
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(3); // Default radius in km
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasEmergencyAlerts, setHasEmergencyAlerts] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<Post[]>([]);
  const navigate = useNavigate();

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch posts whenever radius or user location changes
  useEffect(() => {
    if (!userLocation) return;
    
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Get posts from Firestore
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const postsData: Post[] = [];
        const emergencyData: Post[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Post, "id">;
          const post = { id: doc.id, ...data } as Post;
          
          // Calculate distance from user
          if (post.coordinates && userLocation) {
            post.distance = calculateDistance(
              userLocation.lat, 
              userLocation.lng,
              post.coordinates.lat,
              post.coordinates.lng
            );
            
            // Only include posts within the selected radius
            if (post.distance <= radius) {
              if (post.urgencyLevel === 3) {
                emergencyData.push(post);
              }
              postsData.push(post);
            }
          } else {
            // If no coordinates, still include the post
            postsData.push(post);
          }
        });
        
        setPosts(postsData);
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

  // Calculate distance between two points using the Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // Format time since post creation
  const formatTimeSince = (timestamp: Timestamp) => {
    const now = new Date();
    const postDate = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  // Get icon for category
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
        return <BsThreeDots className="text-gray-600" />;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300 
      }
    }
  };
  
  const alertVariants = {
    hidden: { x: -300, opacity: 0 },
    show: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center justify-between p-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => navigate("/profile")}
          >
            <CgProfile className="text-2xl text-gray-700 dark:text-gray-200" />
          </div>
          
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">NeighbourLink</h1>
          </div>
          
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/notifications")}
          >
            <IoMdNotifications className="text-2xl text-gray-700 dark:text-gray-200" />
          </div>
        </div>
        
        {/* Neighborhood and Radius Selector */}
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-900">
          <div>
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300">Your Neighborhood</h2>
            <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
              {userLocation ? "Current Location" : "Location unavailable"}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Radius:</span>
            <select 
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm text-black"
            >
              <option value={1}>1 km</option>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
            </select>
          </div>
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
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3, repeatDelay: 2 }}
              >
                <MdOutlineWarning className="text-xl text-red-600 dark:text-red-400 mr-2" />
              </motion.div>
              <h3 className="font-bold text-red-600 dark:text-red-400">Emergency Alerts</h3>
            </div>
            <button 
              onClick={() => setHasEmergencyAlerts(false)} 
              className="text-red-600 dark:text-red-400"
            >
              Dismiss
            </button>
          </div>
          
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {emergencyAlerts.map(alert => (
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
      
      {/* Quick Actions Grid */}
      <div className="px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Quick Actions</h3>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/resource/need")} 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="text-2xl mb-2"
            >
              ⬇️
            </motion.div>
            <span className="font-medium">Post Request</span>
          </motion.button>
          
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/resource/offer")} 
            className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="text-2xl mb-2"
            >
              ⬆️
            </motion.div>
            <span className="font-medium">Post Offer</span>
          </motion.button>
          
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/search")} 
            className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="text-2xl mb-2"
            >
              <BiSearchAlt />
            </motion.div>
            <span className="font-medium">Search</span>
          </motion.button>
          
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/emergency")} 
            className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="text-2xl mb-2"
            >
              <MdOutlineWarning />
            </motion.div>
            <span className="font-medium">Emergency</span>
          </motion.button>
        </motion.div>
      </div>
      
      {/* Feed Section */}
      <div className="flex-1 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Feed</h3>
          <button 
            onClick={() => navigate("/filter")} 
            className="text-sm text-indigo-600 dark:text-indigo-400"
          >
            Filter
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => (
              <div 
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer"
              >
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-xl">{getCategoryIcon(post.category)}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      post.postType === "need" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      {post.postType === "need" ? "Need" : "Offer"}
                    </span>
                  </div>
                  
                  {post.urgencyLevel > 1 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      post.urgencyLevel === 2
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                      {post.urgencyLevel === 2 ? "Urgent" : "Emergency"}
                    </span>
                  )}
                </div>
                
                <h4 className="font-medium text-gray-900 dark:text-white mt-2">{post.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {post.description}
                </p>
                
                {post?.photoUrls?.length > 0 && (
                  <div className="mt-3 flex space-x-2 overflow-x-auto">
                    {post.photoUrls.slice(0, 1).map((url, idx) => (
                      <div key={idx} className="h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                        <ImageDisplay objectKey={url} />
                      </div>
                    ))}
                    {post.photoUrls.length > 1 && (
                      <div className="h-20 w-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400">
                        +{post.photoUrls.length - 1}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center">
                    {!post.isAnonymous && (
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full mr-2">
                        {post.userPhoto && (
                          <ImageDisplay objectKey={post.userPhoto} />
                        )}
                      </div>
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {post.isAnonymous ? "Anonymous" : post.userName || "User"}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {post.distance && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {post.distance.toFixed(1)} km
                      </span>
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {post.createdAt && formatTimeSince(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No posts found in your area
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      <button 
        onClick={() => navigate("/resource/new")} 
        className="fixed bottom-20 right-5 bg-indigo-600 text-white p-4 rounded-full shadow-lg"
      >
        <FaPlus />
      </button>
      
      {/* Bottom Navigation */}
      <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md">
        <div className="flex justify-around p-3">
          <button 
            onClick={() => navigate("/")} 
            className="flex flex-col items-center text-indigo-600 dark:text-indigo-400"
          >
            <AiOutlineHome className="text-xl" />
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button 
            onClick={() => navigate("/search")} 
            className="flex flex-col items-center text-gray-600 dark:text-gray-400"
          >
            <BiSearchAlt className="text-xl" />
            <span className="text-xs mt-1">Search</span>
          </button>
          
          <button 
            onClick={() => navigate("/messages")} 
            className="flex flex-col items-center text-gray-600 dark:text-gray-400"
          >
            <BiMessageDetail className="text-xl" />
            <span className="text-xs mt-1">Messages</span>
          </button>
          
          <button 
            onClick={() => navigate("/profile")} 
            className="flex flex-col items-center text-gray-600 dark:text-gray-400"
          >
            <CgProfile className="text-xl" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
