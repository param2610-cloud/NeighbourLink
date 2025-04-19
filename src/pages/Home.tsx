import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { FaMedkit, FaTools, FaBook, FaHome, FaUtensils } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { IoMdNotifications } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import { ImageDisplay } from "../components/AWS/UploadFile";
import Sidebar from "../components/authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Plus, BookOpen, Gift, Calendar, Bell } from 'lucide-react';
import QuickActionsButton from "./components/QuickAction";


type FilterType = "all" | "need" | "offer";

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
  userName?: string;
  userPhoto?: string;
  distance?: number;
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(3);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [, setHasEmergencyAlerts] = useState(false);
  const [, setEmergencyAlerts] = useState<Post[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [updated,] = useState(false);
  const navigate = useNavigate();


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


  useEffect(() => {
    if (!userLocation) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {

        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        // const postsData: Post[] = [];
        const emergencyData: Post[] = [];

        // Create an array of promises to fetch all user data in parallel
        const postsWithUserPromises = querySnapshot.docs.map(async (document) => {
          const data = document.data() as Omit<Post, "id">;
          const post = { id: document.id, ...data } as Post;

          // Fetch user details if userId exists
          if (post.userId) {
            try {
              const userDoc = await getDoc(doc(db, "Users", post.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();

                post.userName = userData.firstName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.lastName || userData.displayName || "User";
                post.userPhoto = userData.photo || null;
              }

            } catch (userError) {
              console.error("Error fetching user data:", userError);
            }
          }

          // Calculate distance if coordinates exist
          if (post.coordinates && userLocation) {
            post.distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              post.coordinates.lat,
              post.coordinates.lng
            );

            // Filter by radius
            if (post.distance <= radius) {
              if (post.urgencyLevel === 3) {
                emergencyData.push(post);
              }
              return post;
            }
          } else {
            // Include posts without coordinates
            return post;
          }
          return null;
        });

        // Wait for all the user data fetching to complete
        const resolvedPosts = await Promise.all(postsWithUserPromises);

        // Filter out null values (posts outside radius)
        const filteredPosts = resolvedPosts.filter(post => post !== null) as Post[];

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
  }, [userLocation, radius, updated]);


  const filteredPosts = posts.filter(post =>
    selectedFilter === "all" ? true : post.postType === selectedFilter
  );


  useEffect(() => {
    const fetchUserData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data());
          } else {
            navigate("/login");
            console.log("No such document!");
          }
        }
      });
    };

    fetchUserData();
  }, []);


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


  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };


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


  // const containerVariants = {
  //   hidden: { opacity: 0 },
  //   show: {
  //     opacity: 1,
  //     transition: {
  //       staggerChildren: 0.1
  //     }
  //   }
  // };

  // const itemVariants = {
  //   hidden: { y: 20, opacity: 0 },
  //   show: {
  //     y: 0,
  //     opacity: 1,
  //     transition: {
  //       type: "spring",
  //       stiffness: 300
  //     }
  //   }
  // };

  // const alertVariants = {
  //   hidden: { x: -300, opacity: 0 },
  //   show: {
  //     x: 0,
  //     opacity: 1,
  //     transition: {
  //       type: "spring",
  //       damping: 25,
  //       stiffness: 100
  //     }
  //   }
  // };



  return (
    <>
      {
        userDetails ?
          <div className="flex flex-col min-h-screen mb-16 bg-gray-50 dark:bg-gray-900">
            {/* Responsive Sidebar */}
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

            {/* Overlay to close sidebar when clicking outside (only on mobile) */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-transparent z-30 md:hidden"
                onClick={toggleSidebar}
              />
            )}

            {/* Main Content Area */}
            <div className="md:ml-64">
              {/* Top Navigation */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
                <div className="flex items-center justify-between p-4">
                  <div
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={toggleSidebar}
                  >
                    <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
                  </div>

                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-blue-800 dark:text-blue-700">Neighbour</h1>
                    <h1 className="text-xl font-bold text-violet-800 dark:text-violet-700">Link</h1>
                  </div>

                  <div
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => navigate("/notifications")}
                  >
                    <IoMdNotifications className="text-2xl text-gray-700 dark:text-gray-200" />
                  </div>
                </div>

                {/* Neighborhood, Radius Selector, and Filter */}
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
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm text-black dark:text-white"
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
              {/* {hasEmergencyAlerts && (
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
              )} */}

              {/* Quick Actions Grid */}
              <div className="flex justify-center items-center">

                {/* <div className="px-4 py-3 xl:px-0 xl:w-[600px]">
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
                      onClick={() => navigate("/emergency/posts")}
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
                </div> */}
                {/* <div className="overflow-x-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="flex space-x-4 px-4">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className="flex-shrink-0 bg-gradient-to-tr from-blue-200 to-teal-200 hover:bg-gray-100 text-gray-700 font-semibold py-6 px-8 rounded-xl shadow-md border-2 border-gray-700 transition-all duration-300 ease-in-out active:scale-95 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <action.icon className="h-8 w-8 mb-1 text-gray-700" />
                          <span className="text-gray-800 font-medium">{action.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div> */}
                <QuickActionsButton />

              </div>

              {/* Feed Section */}
              <div className="fixed w-full flex-1 px-4 py-4 bg-white dark:bg-gray-800 h-18">

              <div className="fixed bg-white dark:bg-gray-800 flex items-center justify-between mb-7">
                {/* <h3 className="text-lg font-semibold text-gray-800 dark:text-white"></h3> */}
                <div className="flex items-center space-x-2">
                  <label className="text-gray-700 dark:text-gray-400">Filter by:</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                    className="px-3 py-1 dark:bg-gray-600 dark:text-white border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="need">Needs</option>
                    <option value="offer">Offers</option>
                  </select>
                </div>
              </div>
              </div>
              <div className="flex-1 px-4 py-4 ">

                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <div className="space-y-4 mt-18 flex flex-col items-center">
                    {filteredPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 w-full sm:w-[500px] cursor-pointer"
                      >
                        <div className="flex justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="text-xl">{getCategoryIcon(post.category)}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${post.postType === "need"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              }`}>
                              {post.postType === "need" ? "Need" : "Offer"}
                            </span>
                          </div>

                          {post.urgencyLevel > 1 && (
                            <span className={`text-xs px-2 py-1 rounded-full ${post.urgencyLevel === 2
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}>
                              {post.urgencyLevel === 2 ? "Urgent" : "Emergency"}
                            </span>
                          )}
                          {
                            // auth.currentUser?.uid === post.userId && (
                            //   <div className="flex justify-center items-center gap-2">
                            //     <div className="text-blue-600 dark:text-blue-400 hover:cursor-pointer">
                            //       <FaRegEdit />
                            //     </div>
                            //     <div className="text-red-600 dark:text-red-400 hover:cursor-pointer" onClick={() => setIsDeleteModalOpen(true)}>
                            //       <MdDeleteForever size={20} />
                            //       {/* Delete */}
                            //     </div>
                            //   </div>
                            // )
                          }
                          {/* <PostCardDelete
                      isOpen={isDeleteModalOpen}
                      onClose={() => setIsDeleteModalOpen(false)}
                      itemId={post.id}
                      itemType="post"
                      onDelete={() => setUpdated((prev) => !prev)}
                    /> */}
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
                              {post?.isAnonymous ? "Anonymous" : post?.userName || "User"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3">
                            {post?.distance && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {parseFloat(post.distance.toFixed(1)) !== 0 ? `${post.distance.toFixed(1)} km` : ''}
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
              {/* <button
                onClick={() => navigate("/resource/need")}
                className="fixed bottom-20 right-5 bg-indigo-600 text-white p-4 rounded-full shadow-lg"
              >
                <FaPlus />
              </button> */}
              <FloatingActionMenu />

              <Bottombar />
            </div>
          </div>
          :
          <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-white bg-opacity-50">
            <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-600" />
          </div>
      }
    </>
  );
};

export default Home;


export const FloatingActionMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Define our menu options
  const menuOptions = [
    { icon: <BookOpen size={24} />, label: "Resource", id: "resource" },
    { icon: <Gift size={24} />, label: "Promotion", id: "promotion" },
    { icon: <Calendar size={24} />, label: "Event", id: "event" },
    { icon: <Bell size={24} />, label: "Local Updates", id: "update" }
  ];

  // Handler for button click to navigate with query param
  const handleNavigation = (type: string) => {
    navigate(`/post?type=${type}`);
    setIsOpen(false); // optionally close menu on navigation
  };

  // // Calculate the bottom-right position for animation origin
  // const originPosition = "bottom-20 right-5";

  return (
    <div className="relative">
      {/* Backdrop overlay when modal is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={toggleMenu}
        />
      )}

      {/* Buttons - always rendering but only visible when open */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="grid grid-cols-2 gap-8">
          {menuOptions.map((option, index) => (
            <button
              key={option.id}
              className={`flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md border border-gray-300 pointer-events-auto transition-all duration-300 hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 ${isOpen ? 'opacity-100' : 'opacity-0'
                }`}
              style={{
                transform: isOpen
                  ? 'translate(0, 0) scale(1)'
                  : 'translate(calc(100vw - 5rem - 50%), calc(100vh - 20rem - 50%)) scale(0.1)',
                transition: `transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1
                  }s, opacity 0.3s ease ${index * 0.1}s`,
                minWidth: '120px',
                minHeight: '140px',
              }}
              onClick={() => handleNavigation(option.id)}
              aria-label={`Go to ${option.label} form`}
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center mb-3 shadow-md">
                <div className="text-white">
                  {option.icon}
                </div>
              </div>
              <span className="text-base font-semibold text-gray-800">{option.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Plus button */}
      <button
        className="fixed bottom-20 right-5 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg z-50 transition-transform duration-300"
        onClick={toggleMenu}
        aria-label="Open menu"
      >
        <Plus size={28} className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
    </div>
  );
};
