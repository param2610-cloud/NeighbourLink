import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { IoMdNotifications } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import Sidebar from "../components/authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { Plus, BookOpen, Gift, Calendar, Bell } from 'lucide-react';
import Feed from "./components/Feed";
import NewPostForm from "@/components/Forms/NewPostForm";
import { useMobileContext } from "@/contexts/MobileContext";
import QuickActionsButton from "./components/QuickAction";
import { Skeleton } from "@/components/ui/skeleton";

// type FilterType = "all" | "need" | "offer";

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
  const [, setPosts] = useState<Post[]>([]);
  const [, setLoading] = useState(true);
  const [radius, setRadius] = useState(3);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [, setHasEmergencyAlerts] = useState(false);
  const [, setEmergencyAlerts] = useState<Post[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [updated,] = useState(false);
  const navigate = useNavigate();
  const { isMobile } = useMobileContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postType, setPostType] = useState<'resource' | 'event' | 'promotion' | 'update' | null>(null);

  const openModal = (type?: 'resource' | 'event' | 'promotion' | 'update') => {
    setPostType(type || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };



  const handleSuccess = () => {
    console.log('Post created successfully!');
    // You can implement additional success handling here
  };

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

        const emergencyData: Post[] = [];

        const postsWithUserPromises = querySnapshot.docs.map(async (document) => {
          const data = document.data() as Omit<Post, "id">;
          const post = { id: document.id, ...data } as Post;

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

          if (post.coordinates && userLocation) {
            post.distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              post.coordinates.lat,
              post.coordinates.lng
            );

            if (post.distance <= radius) {
              if (post.urgencyLevel === 3) {
                emergencyData.push(post);
              }
              return post;
            }
          } else {
            return post;
          }
          return null;
        });

        const resolvedPosts = await Promise.all(postsWithUserPromises);

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

  return (
    <>
    {
      userDetails ?
        <div className={`flex flex-col min-h-screen ${isMobile ? "mb-16" : ""} bg-gray-50 dark:bg-gray-900`}>
          {/* Responsive Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 w-64 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              } md:translate-x-0 transition-transform duration-300 z-50`}
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
            <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-md">
              <div className="flex  items-center justify-between p-4">
                <div
                  className="flex items-center gap-5 space-x-2 cursor-pointer"
                  onClick={toggleSidebar}
                >
                  <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
                  {
                    !isMobile && (
                      <div>
                        <h2 className="text-xs font-medium text-gray-600 dark:text-gray-300">Your Neighborhood</h2>
                        <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                          {userLocation ? "Current Location" : "Location unavailable"}
                        </p>
                      </div>
                    )
                  }
                </div>

                <div className="flex  items-center justify-center ">
                  <h1 className="text-xl font-bold text-blue-800 dark:text-blue-700">Neighbour</h1>
                  <h1 className="text-xl font-bold text-violet-800 dark:text-violet-700 ml-1">Link</h1>
                </div>

                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => navigate("/notifications")}
                >
                  <IoMdNotifications className="text-2xl text-gray-700 dark:text-gray-200" />
                </div>
              </div>

              {/* Neighborhood, Radius Selector, and Filter
              <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-900">
              </div> */}

            </div>

            {/* Quick Actions Grid */}
            <div className="flex justify-center items-center">


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
              <QuickActionsButton openModal={openModal} />

            </div>

            {/* Feed Section */}
            <div className="fixed z-40 w-full flex-1 px-4 py-4 bg-neutral-100 dark:bg-slate-800 h-16">

              <div className="fixed gap-5 flex items-center justify-between mb-7">
                {/* <h3 className="text-lg font-semibold text-gray-800 dark:text-white"></h3> */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Radius:</span>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-xs text-black dark:text-white"
                  >
                    <option value={1}>1 km</option>
                    <option value={3}>3 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                  </select>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <label className="text-gray-700 text-xs dark:text-gray-400">Filter by:</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                    className="px-3 py-1 text-xs dark:bg-gray-600 dark:text-white border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="need">Needs</option>
                    <option value="offer">Offers</option>
                  </select>
                </div> */}
              </div>
            </div>
            <div className="flex-1 px-4 py-4 ">

              
                <Feed />
              
            </div>

            {/* Floating Action Button */}
            <FloatingActionMenu openModal={openModal} />

            <NewPostForm
              isOpen={isModalOpen}
              onClose={closeModal}
              initialPostType={postType}
              onSuccess={handleSuccess}
            />

            {
              isMobile && (

                <Bottombar />
              )
            }

          </div>
        </div>
        :
        <div className="flex flex-col space-y-4">
          <div className="flex items-center p-4 space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
          <div className="p-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>

    }
  </>
  );
};

export default Home;

export const FloatingActionMenu: React.FC<{ openModal: (type?: 'resource' | 'event' | 'promotion' | 'update') => void }> = ({ openModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useMobileContext()

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuOptions = [
    { icon: <BookOpen size={24} />, label: "Resource", id: "resource" },
    { icon: <Gift size={24} />, label: "Promotion", id: "promotion" },
    { icon: <Calendar size={24} />, label: "Event", id: "event" },
    { icon: <Bell size={24} />, label: "Local Updates", id: "update" }
  ];

  return (
    <div className="relative">
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={toggleMenu}
        />
      )}

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
              onClick={() => openModal(option.id as 'resource' | 'event' | 'promotion' | 'update')}
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

      <button
        className={`fixed ${isMobile ? "bottom-20 right-5" : "bottom-8 right-8"} h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg z-50 transition-transform duration-300`}
        onClick={toggleMenu}
        aria-label="Open menu"
      >
        <Plus size={28} className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
    </div>
  );
};
