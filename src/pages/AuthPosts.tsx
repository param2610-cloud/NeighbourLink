import { auth, db } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ResourceCard,
  PromotionCard,
  EventCard,
  UpdateCard,
  Resource,
  Promotion,
  Event,
  Update,
} from "./components/Feed";
import { FeedItem } from "./components/Feed";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import Sidebar from "../components/authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { useMobileContext } from "@/contexts/MobileContext";

// Reuse the convertDoc function from your Feed component
const convertDoc = <T extends FeedItem>(
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

// User-specific fetch functions
const fetchUserResources = async (userId: string): Promise<Resource[]> => {
  console.debug("📊 Fetching resources for user:", userId);
  const resourcesRef = collection(db, "resources");
  const q = query(
    resourcesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const resources = querySnapshot.docs.map((doc) =>
    convertDoc<Resource>(doc, "resource")
  );
  console.debug("📊 Found resources:", resources.length);
  return resources;
};

const fetchUserPromotions = async (userId: string): Promise<Promotion[]> => {
  console.debug("📊 Fetching promotions for user:", userId);
  const promotionsRef = collection(db, "promotions");
  const q = query(
    promotionsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const promotions = querySnapshot.docs.map((doc) =>
    convertDoc<Promotion>(doc, "promotion")
  );
  console.debug("📊 Found promotions:", promotions.length);
  return promotions;
};

const fetchUserEvents = async (userId: string): Promise<Event[]> => {
  console.debug("📊 Fetching events for user:", userId);
  const eventsRef = collection(db, "events");
  const q = query(
    eventsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const events = querySnapshot.docs.map((doc) =>
    convertDoc<Event>(doc, "event")
  );
  console.debug("📊 Found events:", events.length);
  return events;
};

const fetchUserUpdates = async (userId: string): Promise<Update[]> => {
  console.debug("📊 Fetching updates for user:", userId);
  const updatesRef = collection(db, "updates");
  const q = query(
    updatesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  const updates = querySnapshot.docs.map((doc) =>
    convertDoc<Update>(doc, "update")
  );
  console.debug("📊 Found updates:", updates.length);
  return updates;
};

const fetchAllUserFeedItems = async (userId: string): Promise<FeedItem[]> => {
  console.debug("🔄 Starting to fetch all feed items for user:", userId);
  try {
    const startTime = performance.now();
    const [resources, promotions, events, updates] = await Promise.all([
      fetchUserResources(userId),
      fetchUserPromotions(userId),
      fetchUserEvents(userId),
      fetchUserUpdates(userId),
    ]);

    const allItems: FeedItem[] = [
      ...resources,
      ...promotions,
      ...events,
      ...updates,
    ];
    const sortedItems = allItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const endTime = performance.now();
    console.debug(
      "✅ Fetch completed in",
      (endTime - startTime).toFixed(2),
      "ms"
    );
    console.debug("📊 Total items:", sortedItems.length, {
      resources: resources.length,
      promotions: promotions.length,
      events: events.length,
      updates: updates.length,
    });

    return sortedItems;
  } catch (error) {
    console.error("❌ Error fetching user feed items:", error);
    throw error;
  }
};

// Add session-based functions for user posts
const getSessionSeed = () => {
  let seed = sessionStorage.getItem("userPostsShuffleSeed");
  if (!seed) {
    seed = Date.now().toString();
    sessionStorage.setItem("userPostsShuffleSeed", seed);
  }
  return seed;
};

const deterministicShuffle = <T,>(array: T[], seed: string): T[] => {
  const arr = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    const j = Math.floor((hash / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Simplified sorting for user posts
const smartSortFeedItems = (items: FeedItem[]): FeedItem[] => {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sessionSeed = getSessionSeed();

  const veryRecentPosts = items.filter((item) => {
    const postDate = new Date(item.createdAt);
    return postDate > twoHoursAgo;
  });

  const recentPosts = items.filter((item) => {
    const postDate = new Date(item.createdAt);
    return postDate <= twoHoursAgo && postDate > oneDayAgo;
  });

  const olderPosts = items.filter((item) => {
    const postDate = new Date(item.createdAt);
    return postDate <= oneDayAgo;
  });

  // Sort chronologically for user's own posts, light shuffle for older posts
  veryRecentPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  recentPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const lightlyShuffledOlderPosts = deterministicShuffle(
    olderPosts,
    sessionSeed
  );

  return [...veryRecentPosts, ...recentPosts, ...lightlyShuffledOlderPosts];
};

// Simplified intersection observer for user posts
const useIntersectionObserver = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const postRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
            const postId = entry.target.getAttribute("data-post-id");
            if (postId) {
              setTimeout(() => {
                const viewedPosts = JSON.parse(
                  localStorage.getItem("viewedUserPosts") || "[]"
                );
                if (!viewedPosts.includes(postId)) {
                  viewedPosts.push(postId);
                  localStorage.setItem(
                    "viewedUserPosts",
                    JSON.stringify(viewedPosts)
                  );
                }
              }, 2000);
            }
          }
        });
      },
      { threshold: 0.8, rootMargin: "0px 0px -10% 0px" }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const observePost = useCallback(
    (postId: string, element: HTMLElement | null) => {
      if (!observerRef.current) return;

      const prevElement = postRefs.current.get(postId);
      if (prevElement) {
        observerRef.current.unobserve(prevElement);
      }

      if (element) {
        element.setAttribute("data-post-id", postId);
        postRefs.current.set(postId, element);
        observerRef.current.observe(element);
      } else {
        postRefs.current.delete(postId);
      }
    },
    []
  );

  return { observePost };
};

const AuthPosts: React.FC = () => {
  console.debug("🔄 Rendering AuthPosts component");
  const user = auth.currentUser;
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isMobile } = useMobileContext();
  const { observePost } = useIntersectionObserver();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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

  const handleDeleteItem = async (id: string, type: FeedItem["type"]) => {
    console.debug("🗑️ Attempting to delete item:", { id, type });
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
      console.debug("✅ Item deleted successfully");
      setFeedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("❌ Error deleting item:", error);
    }
  };

  useEffect(() => {
    const loadUserPosts = async () => {
      try {
        setLoading(true);
        if (!user) {
          throw new Error("User not authenticated");
        }
        const items = await fetchAllUserFeedItems(user.uid);
        setFeedItems(items);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch user posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    loadUserPosts();
  }, [user]);

  // Apply smart sorting only when feedItems change
  const sortedFeedItems = React.useMemo(() => {
    if (feedItems.length === 0) return [];
    return smartSortFeedItems(feedItems);
  }, [feedItems]); // Only depend on feedItems

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please sign in to view your posts.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Responsive Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 z-100`}
        >
          <Sidebar handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} />
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
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                  Neighbour
                </h1>
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                  Link
                </h1>
                <span className="mx-2 text-blue-500 dark:text-gray-400">|</span>
                <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                  My Posts
                </h2>
              </div>

              <div className="opacity-0 w-8 h-8">
                {/* Empty div for layout balance */}
              </div>
            </div>
          </div>

          {/* Loading content */}
          <div className="container w-full mt-16 mx-auto px-4 py-8">
            <div className="mb-8 text-center space-y-3">
              <div className="h-8 w-48 mx-auto">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="h-4 w-32 mx-auto">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          {isMobile && <Bottombar />}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Responsive Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 z-100`}
        >
          <Sidebar handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} />
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
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                  Neighbour
                </h1>
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                  Link
                </h1>
                <span className="mx-2 text-blue-500 dark:text-gray-400">|</span>
                <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                  My Posts
                </h2>
              </div>

              <div className="opacity-0 w-8 h-8">
                {/* Empty div for layout balance */}
              </div>
            </div>
          </div>

          {/* Error content */}
          <div className="container mx-auto px-4 py-8">
            <div
              className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          </div>

          {/* Bottom Navigation */}
          {isMobile && <Bottombar />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Responsive Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 z-100`}
      >
        <Sidebar handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} />
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
              <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                Neighbour
              </h1>
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                Link
              </h1>
              <span className="mx-2 text-blue-500 dark:text-gray-400">|</span>
              <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                My Posts
              </h2>
            </div>

            <div className="opacity-0 w-8 h-8">
              {/* Empty div for layout balance */}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-4 py-6 pb-24">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-8 px-4 py-2 text-blue-500"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-blue-500" />
            <span className="font-medium">Back</span>
          </button>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              My Posts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {feedItems.length} posts created
            </p>
          </div>

          <div className="space-y-4">
            {sortedFeedItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  You haven't created any posts yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sortedFeedItems.map((item) => {
                  switch (item.type) {
                    case "resource":
                      return (
                        <ResourceCard
                          key={item.id}
                          resource={item as Resource}
                          onDelete={handleDeleteItem}
                          observePost={observePost}
                        />
                      );
                    case "promotion":
                      return (
                        <PromotionCard
                          key={item.id}
                          promotion={item as Promotion}
                          onDelete={handleDeleteItem}
                          observePost={observePost}
                        />
                      );
                    case "event":
                      return (
                        <EventCard
                          key={item.id}
                          event={item as Event}
                          onDelete={handleDeleteItem}
                          observePost={observePost}
                        />
                      );
                    case "update":
                      return (
                        <UpdateCard
                          key={item.id}
                          update={item as Update}
                          onDelete={handleDeleteItem}
                          observePost={observePost}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        {isMobile && <Bottombar />}
      </div>
    </div>
  );
};

export default AuthPosts;
