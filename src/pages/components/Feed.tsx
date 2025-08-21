import { auth, db } from "@/firebase";
import {
  collection,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { MoreVertical, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";

import { useStateContext } from "@/contexts/StateContext"; // Update this import to use StateContext
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { MdVerified } from "react-icons/md";
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";

// Helper: manage image natural sizes and container height
function useImageHeightManager() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const natural = useRef<Record<string, { w: number; h: number }>>({});
  const [height, setHeight] = useState<number | null>(null);

  const getMaxAllowed = (containerW: number) => (containerW < 600 ? 520 : 640);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>, id: string) => {
    const img = e.currentTarget as HTMLImageElement;
    natural.current[id] = { w: img.naturalWidth || 1, h: img.naturalHeight || 1 };
    const containerW = containerRef.current?.clientWidth || 520;
    const allScaled = Object.values(natural.current).map(n => (containerW / n.w) * n.h);
    const maxScaled = allScaled.length ? Math.max(...allScaled) : 0;
    setHeight(Math.min(getMaxAllowed(containerW), maxScaled || getMaxAllowed(containerW)));
  };

  useEffect(() => {
    const onResize = () => {
      const containerW = containerRef.current?.clientWidth || 520;
      const maxAllowed = getMaxAllowed(containerW);
      const allScaled = Object.values(natural.current).map(n => (containerW / n.w) * n.h);
      const maxScaled = allScaled.length ? Math.max(...allScaled) : maxAllowed;
      setHeight(Math.min(maxAllowed, maxScaled));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { containerRef, onImgLoad, height, getMaxAllowed };
}

export interface BaseItem {
  id?: string;
  createdAt: string;
  description: string;
  duration: string;
  title?: string;
  userId: string;
  visibilityRadius: string;
  images?: string[];
  type: "resource" | "promotion" | "event" | "update";
}

export interface Resource extends BaseItem {
  category: string;
  urgency: string;
}

export interface Promotion extends BaseItem {
  contactInfo: {
    contact: string;
    email: string;
    name: string;
    description: string;
  };
  responders: {
    title: string;
    useProfileLocation: boolean;
  };
}

export interface Event extends BaseItem {
  eventType: string;
  isRegistrationRequired: boolean;
  organizerDetails: {
    contact: string;
    email: string;
    name: string;
  };
  timingInfo: {
    date: string;
    duration: string;
    time: string;
  };
  responders: {
    title: string;
    useProfileLocation: boolean;
    users?: string[]; // Array of user IDs who have RSVPed
  };
}

export interface Update extends BaseItem {
  date: string;
  parentId?: string; // ID of parent update if this is a reply
  childUpdates?: string[]; // IDs of replies to this update
  threadDepth: number; // Depth in thread hierarchy
  responders?: {
    title: string;
    useProfileLocation: boolean;
  };
}

export type FeedItem = Resource | Promotion | Event | Update;

const convertDoc = <T extends BaseItem>(
  doc: any,
  type: FeedItem["type"]
): T => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    type,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
  } as T;
};

export const fetchResources = async (): Promise<Resource[]> => {
  const resourcesRef = collection(db, "resources");
  const q = query(resourcesRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  console.log(
    querySnapshot.docs.map((doc) => convertDoc<Resource>(doc, "resource"))
  );
  return querySnapshot.docs.map((doc) => convertDoc<Resource>(doc, "resource"));
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
  const promotionsRef = collection(db, "promotions");
  const q = query(promotionsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) =>
    convertDoc<Promotion>(doc, "promotion")
  );
};

export const fetchEvents = async (): Promise<Event[]> => {
  const eventsRef = collection(db, "events");
  const q = query(eventsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => convertDoc<Event>(doc, "event"));
};

export const fetchUpdates = async (): Promise<Update[]> => {
  const updatesRef = collection(db, "updates");
  const q = query(updatesRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => convertDoc<Update>(doc, "update"));
};

export const fetchAllFeedItems = async (): Promise<FeedItem[]> => {
  try {
    const [resources, promotions, events, updates] = await Promise.all([
      fetchResources(),
      fetchPromotions(),
      fetchEvents(),
      fetchUpdates(),
    ]);

    const allItems: FeedItem[] = [
      ...resources,
      ...promotions,
      ...events,
      ...updates,
    ];
    return allItems.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error("Error fetching feed items:", error);
    throw error;
  }
};

// Add interface for user info
interface UserInfo {
  firstName: string;
  lastName: string;
  photo?: string;
  address?: string;
  isVerified: boolean;
}

// Add user info component
const UserInfoDisplay: React.FC<{ userId: string }> = ({ userId }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "Users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserInfo;
          setUserInfo(userData);
          // console.log(userData.isVerified)
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserInfo();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
          ?
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Unknown User
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {userInfo.photo ? (
          <ImageDisplay publicId={userInfo.photo} />
        ) : (
          <div className="h-full w-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300">
            {userInfo.firstName?.[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs flex justify-start items-center gap-1 font-medium text-gray-900 dark:text-gray-200">
          {userInfo.firstName} {userInfo.lastName}
          {userInfo.isVerified && (
            <span className="flex justify-center items-center text-green-500">
              <MdVerified size={15} />
            </span>
          )}
        </p>
        {userInfo.address && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center">
            <MapPin size={10} className="mr-1" />
            {userInfo.address?.substring(0, 20)}
            {userInfo.address?.length > 20 ? "..." : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export const Feed: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDeleteItem = async (id: string, type: FeedItem["type"]) => {
    try {
      let collectionName: string;
      switch (type) {
        case "resource":
          collectionName = "resources";
          break;
        case "promotion":
          collectionName = "promotions";
          break;
        case "event":
          collectionName = "events";
          break;
        case "update":
          collectionName = "updates";
          break;
        default:
          return;
      }
      await deleteDoc(doc(db, collectionName, id));
      setFeedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  useEffect(() => {
    const loadFeedItems = async () => {
      try {
        setLoading(true);
        const items = await fetchAllFeedItems();
        setFeedItems(items);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch feed items:", err);
        setError("Failed to load feed. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadFeedItems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
        <div className="flex flex-col mt-12 space-y-4 w-full sm:w-[520px]">
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
            <Skeleton className="w-full h-56 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-md" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
            <Skeleton className="w-full h-56 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-md" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
            <Skeleton className="w-full h-56 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 rounded-md" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container w-full sm:w-[520px] mx-auto px-4 bg-transparent">
      <div className="">
        {feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Be the first to share something with your community. Create a resource, event, promotion, or update!
            </p>
          </div>
        ) : (
          feedItems.map((item) => {
            switch (item.type) {
              case "resource":
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
                    <ResourceCard
                      resource={item as Resource}
                      onDelete={handleDeleteItem}
                    />
                  </motion.div>
                );
              case "promotion":
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
                    <PromotionCard
                      promotion={item as Promotion}
                      onDelete={handleDeleteItem}
                    />
                  </motion.div>
                );
              case "event":
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
                    <EventCard
                      event={item as Event}
                      onDelete={handleDeleteItem}
                    />
                  </motion.div>
                );
              case "update":
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
                    <UpdateCard
                      update={item as Update}
                      onDelete={handleDeleteItem}
                    />
                  </motion.div>
                );
              default:
                return null;
            }
          })
        )}
      </div>
    </div>
  );
};

interface CardBaseProps {
  onDelete: (id: string, type: FeedItem["type"]) => void;
}

interface ResourceCardProps extends CardBaseProps {
  resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onDelete,
}) => {
  const user = auth.currentUser;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalImages = resource.images?.length || 0;
  const isOwner = user?.uid === resource.userId;
  const navigate = useNavigate();
  const { containerRef, onImgLoad, height, getMaxAllowed } = useImageHeightManager();

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () =>
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  const handlePrev = () =>
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);

  const handleDelete = () => {
    onDelete(resource.id!, "resource");
    setShowMenu(false);
  };

  return (
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 0.95 }} whileHover={{ y: -6, scale: 0.99 }} transition={{ duration: 0.22 }}
      className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out overflow-hidden border border-transparent hover:border-blue-200 dark:hover:border-blue-600">
      {/* Category indicator stripe */}
      {/* <div className={`absolute top-0 left-0 right-0 h-1 ${
        resource.urgency === "high" 
          ? "bg-gradient-to-r from-red-500 to-red-600" 
          : "bg-gradient-to-r from-blue-500 to-blue-600"
      }`}></div> */}
      {/* <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div> */}
      <div className="p-4">
        <div className="flex justify-between items-start ">
          <UserInfoDisplay userId={resource.userId} />


          <div className="relative cursor-pointer" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 py-2 z-30">
                <button
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                  onClick={() => navigate(`/resource/${resource.id}`)}
                >
                  View Details
                </button>
                {isOwner && (
                  <>
                    <button
                      className="block w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors duration-150"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      {resource.images && resource.images.length > 0 && (
        <div ref={containerRef} className="relative w-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden " style={{ height: height ? `${height}px` : undefined, maxHeight: `${getMaxAllowed(containerRef.current?.clientWidth || 520)}px` }}>
          <div className="w-full overflow-hidden flex justify-center items-center">
            <ImageDisplay
              publicId={resource.images[currentImageIndex]}
              className="w-full"
              onLoad={(e) => onImgLoad(e, resource.images![currentImageIndex])}
              style={{ width: '100%', height: height ? `${height}px` : 'auto', objectFit: height ? 'cover' : 'contain' }}
            />
          </div>
          {/* hidden loaders to measure all images for height calculation */}
          <div className="hidden">
            {resource.images.map((img) => (
              <ImageDisplay key={img} publicId={img} onLoad={(e) => onImgLoad(e, img)} />
            ))}
          </div>
          {totalImages > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                {resource.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? "bg-white scale-125" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {/* subtle gradient band below image to match UpdateCard style */}
      {resource.images && resource.images.length > 0 && (
        <div className="w-full h-6 bg-gradient-to-t from-transparent to-blue-50 dark:to-blue-900/10" aria-hidden />
      )}
      <div className="p-4">

        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${resource.urgency === "high"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${resource.urgency === "high" ? "bg-red-500" : "bg-blue-500"
                }`}></div>
              {resource.category}
            </span>
            {resource.urgency === "high" && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full border border-red-200 dark:border-red-700">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Emergency
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {resource.title || "Resource"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {resource.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-transparent dark:border-transparent">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="font-medium">{resource.duration}</span>
            </div>
            <div className="flex items-center">
              <Calendar size={14} className="mr-1.5 text-green-500" />
              <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface PromotionCardProps extends CardBaseProps {
  promotion: Promotion;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  onDelete,
}) => {
  const user = auth.currentUser;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalImages = promotion.images?.length || 0;
  const isOwner = user?.uid === promotion.userId;
  const navigate = useNavigate();
  const { containerRef, onImgLoad, height, getMaxAllowed } = useImageHeightManager();

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () =>
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  const handlePrev = () =>
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);

  const handleDelete = () => {
    onDelete(promotion.id!, "promotion");
    setShowMenu(false);
  };

  const handleViewBusiness = () => {
    navigate(`/business/view/${promotion.userId}`);
    setShowMenu(false);
  };

  return (
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 0.95 }} whileHover={{ y: -6, scale: 0.99 }} transition={{ duration: 0.22 }}
      className="group relative bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-900/20 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out overflow-hidden border border-transparent hover:border-purple-200 dark:hover:border-purple-600">
      {/* Category indicator stripe */}

      <div className="p-4">
        <div className="flex justify-between items-start">
          <UserInfoDisplay userId={promotion.userId} />

          <div className="relative cursor-pointer" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 py-2 z-30">
                <button
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                  onClick={() => navigate(`/promotion/${promotion.id}`)}
                >
                  View Details
                </button>
                <button
                  className="block w-full px-4 py-3 text-sm text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors duration-150"
                  onClick={handleViewBusiness}
                >
                  View Business
                </button>
                {isOwner && (
                  <>
                    <button
                      className="block w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors duration-150"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {promotion.images && promotion.images.length > 0 && (
        <div ref={containerRef} className="relative w-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 overflow-hidden">
          <div style={{ height: height ? `${height}px` : undefined, maxHeight: getMaxAllowed(containerRef.current?.clientWidth || 520) }} className="w-full overflow-hidden flex justify-center items-center">
            <ImageDisplay publicId={promotion.images[currentImageIndex]} className="w-full h-full" style={{ objectFit: height ? 'cover' : 'contain' }} />
          </div>
          {promotion.images.map((imgId, idx) => (
            <div key={`loader-${idx}`} className="hidden" aria-hidden>
              <ImageDisplay publicId={imgId} onLoad={(e) => onImgLoad(e, imgId)} />
            </div>
          ))}
          {totalImages > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                {promotion.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? "bg-white scale-125" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {/* subtle gradient band below image to match UpdateCard style */}
      {promotion.images && promotion.images.length > 0 && (
        <div className="w-full h-6 bg-gradient-to-t from-transparent to-purple-50 dark:to-purple-900/10" aria-hidden />
      )}
      <div className="p-4">


        <div className="flex justify-between items-center mb-3">
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-700">
            <div className="w-2 h-2 rounded-full mr-2 bg-purple-500"></div>
            Promotion
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {promotion?.title || "Promotion"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {promotion.description}
        </p>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-4 border border-purple-100 dark:border-purple-800">
          <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2">Contact Information</h4>
          <div className="space-y-1 text-xs">
            <p className="text-gray-700 dark:text-gray-300 flex items-center">
              <svg className="w-3 h-3 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {promotion.contactInfo?.name}
            </p>
            <p className="text-gray-700 dark:text-gray-300 flex items-center">
              <svg className="w-3 h-3 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {promotion.contactInfo?.email}
            </p>
            <p className="text-gray-700 dark:text-gray-300 flex items-center">
              <svg className="w-3 h-3 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {promotion.contactInfo?.contact}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1.5 text-purple-500" />
            <span>{new Date(promotion.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface EventCardProps extends CardBaseProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalImages = event.images?.length || 0;
  const { user } = useStateContext(); // Use StateContext instead of auth.currentUser
  const isOwner = user?.uid === event.userId;
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [isRSVPing, setIsRSVPing] = useState(false);
  const navigate = useNavigate();
  const { containerRef: eventImgRef, onImgLoad: onEventImgLoad, height: eventHeight, getMaxAllowed: getEventMax } = useImageHeightManager();

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Check if the current user has already RSVPed
    if (user && event.responders?.users) {
      setIsRSVPed(event.responders.users.includes(user.uid));
    }
  }, [user, event.responders]);

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleDelete = () => {
    onDelete(event.id!, "event");
    setShowMenu(false);
  };

  const handleRSVP = async () => {
    if (!user) {
      // Handle not logged in state
      alert("Please log in to RSVP for this event");
      return;
    }

    try {
      setIsRSVPing(true);
      const eventRef = doc(db, "events", event.id || "");

      if (isRSVPed) {
        // Remove user from responders
        await updateDoc(eventRef, {
          "responders.users": arrayRemove(user.uid),
        });
        setIsRSVPed(false);
      } else {
        // Add user to responders
        await updateDoc(eventRef, {
          "responders.users": arrayUnion(user.uid),
        });
        setIsRSVPed(true);
      }
    } catch (error) {
      console.error("Error updating RSVP status:", error);
      alert("Failed to update RSVP status. Please try again.");
    } finally {
      setIsRSVPing(false);
    }
  };

  return (
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 0.95 }} whileHover={{ y: -6, scale: 0.99 }} transition={{ duration: 0.22 }}
      className="group relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-green-900/20 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out overflow-hidden border border-transparent hover:border-green-200 dark:hover:border-green-600">
      {/* Category indicator stripe */}


      <div className="p-4">
        <div className="flex justify-between items-start">
          <UserInfoDisplay userId={event.userId} />

          <div className="relative cursor-pointer" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 py-2 z-30">
                <button
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  View Details
                </button>
                {isOwner && (
                  <>
                    <button
                      className="block w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors duration-150"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {event.images && event.images.length > 0 && (
        <div ref={eventImgRef} className="relative w-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 overflow-hidden" style={{ height: eventHeight ? `${eventHeight}px` : undefined, maxHeight: `${getEventMax(eventImgRef.current?.clientWidth || 520)}px` }}>
          <div className="w-full overflow-hidden flex justify-center items-center">
            <ImageDisplay
              publicId={event.images[currentImageIndex]}
              className="w-full"
              onLoad={(e) => onEventImgLoad(e, event.images![currentImageIndex])}
              style={{ width: '100%', height: eventHeight ? `${eventHeight}px` : 'auto', objectFit: eventHeight ? 'cover' : 'contain' }}
            />
          </div>
          <div className="hidden">
            {event.images.map((img) => (
              <ImageDisplay key={img} publicId={img} onLoad={(e) => onEventImgLoad(e, img)} />
            ))}
          </div>
          {totalImages > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                {event.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? "bg-white scale-125" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {/* subtle gradient band below image to match UpdateCard style */}
      {event.images && event.images.length > 0 && (
        <div className="w-full h-6 bg-gradient-to-t from-transparent to-green-50 dark:to-green-900/10" aria-hidden />
      )}
      <div className="p-4">


        <div className="flex justify-between items-center mb-3">
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-700">
            <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
            {event.eventType}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {event.title || "Event"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {event.description}
        </p>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 border border-green-100 dark:border-green-800">
          <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide mb-2">Event Details</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span className="font-medium">{event.timingInfo?.date} at {event.timingInfo?.time}</span>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Duration: {event.timingInfo?.duration}</span>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>Organizer: {event.organizerDetails?.name}</span>
            </div>
          </div>
        </div>

        {/* RSVP Section */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1.5 text-green-500" />
            <span>{new Date(event.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-3">
            {event.responders?.users && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {event.responders.users.length} attending
              </span>
            )}
            <button
              onClick={handleRSVP}
              disabled={isRSVPing}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${isRSVPed
                ? "bg-green-500 text-white hover:bg-green-600 shadow-lg"
                : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl"
                } ${isRSVPing ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
            >
              {isRSVPing ? "..." : isRSVPed ? "Attending ✓" : "RSVP"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface UpdateCardProps extends CardBaseProps {
  update: Update;
}

export const UpdateCard: React.FC<UpdateCardProps> = ({ update, onDelete }) => {
  const user = auth.currentUser;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalImages = update.images?.length || 0;
  const isOwner = user?.uid === update.userId;
  const navigate = useNavigate();
  const { containerRef: updRef, onImgLoad: onUpdLoad, height: updHeight, getMaxAllowed: getUpdMax } = useImageHeightManager();

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () =>
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  const handlePrev = () =>
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);

  const handleDelete = () => {
    onDelete(update.id!, "update");
    setShowMenu(false);
  };

  return (
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 0.95 }} whileHover={{ y: -6, scale: 0.99 }} transition={{ duration: 0.22 }}
      className="group relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-amber-900/20 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out overflow-hidden border border-transparent hover:border-amber-200 dark:hover:border-amber-600">
      {/* Category indicator stripe */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <UserInfoDisplay userId={update.userId} />

          <div className="relative cursor-pointer" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 py-2 z-30 cursor-pointer">
                <button
                  className="block w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                  onClick={() => navigate(`/update/${update.id}`)}
                >
                  View Details
                </button>
                {isOwner && (
                  <>
                    <button
                      className="block w-full px-4 py-3 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors duration-150"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {update.images && update.images.length > 0 && (
        <div ref={updRef} className="relative w-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 overflow-hidden" style={{ height: updHeight ? `${updHeight}px` : undefined, maxHeight: `${getUpdMax(updRef.current?.clientWidth || 520)}px` }}>
          <div className="w-full overflow-hidden flex justify-center items-center">
            <ImageDisplay
              publicId={update.images[currentImageIndex]}
              className="w-full"
              onLoad={(e) => onUpdLoad(e, update.images![currentImageIndex])}
              style={{ width: '100%', height: updHeight ? `${updHeight}px` : 'auto', objectFit: updHeight ? 'cover' : 'contain' }}
            />
          </div>
          <div className="hidden">
            {update.images.map((img) => (
              <ImageDisplay key={img} publicId={img} onLoad={(e) => onUpdLoad(e, img)} />
            ))}
          </div>
          {totalImages > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/40 transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                {update.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? "bg-white scale-125" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="p-4">


        <div className="flex justify-between items-center mb-3">
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-700">
            <div className="w-2 h-2 rounded-full mr-2 bg-amber-500"></div>
            Update
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {update?.title || "Update"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {update.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
            {update.date && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span className="font-medium">{new Date(update.date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar size={14} className="mr-1.5 text-amber-500" />
              <span>{new Date(update.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Show reply count if available */}
          {update.childUpdates && update.childUpdates.length > 0 && (
            <div className="flex items-center text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {update.childUpdates.length} {update.childUpdates.length === 1 ? "reply" : "replies"}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Feed;
