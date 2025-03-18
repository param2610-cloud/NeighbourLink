import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import PostList from "../PostCard/PostList";
import SharedResourceList from "../PostCard/SharedResourceList ";
import Sidebar from "./structures/Sidebar";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type FilterType = "all" | "post" | "resource";

interface ResponderData {
  userId: string;
  accepted: boolean;
}

interface Post {
  id: string;
  category: string;
  createdAt: any;
  description: string;
  location: string;
  photoUrl: string;
  title: string;
  urgency: boolean;
  userId: string;
  type: string;
  responders: ResponderData[];
}

interface SharedResource {
  id: string;
  category: string;
  createdAt: any;
  description: string;
  location: string;
  photoUrl: string;
  resourceName: string;
  condition: string;
  userId: string;
  type: string;
}

type ContentItem = Post | SharedResource;

function Profile() {
  const [, setUserDetails] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mixedContent, setMixedContent] = useState<ContentItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [updated, setUpdated]=useState(false);

  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
        } else {
          console.log("No such document!");
        }
      }
    });
  };

  useEffect(() => {
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

  useEffect(() => {
    const fetchMixedContent = async () => {
      try {
        const postsQuery = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc")
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "post",
        })) as Post[];

        const resourcesQuery = query(
          collection(db, "sharedResources"),
          orderBy("createdAt", "desc")
        );
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "resource",
        })) as SharedResource[];

        const combined = [...postsData, ...resourcesData].sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setMixedContent(combined);
      } catch (error) {
        console.error("Error fetching content: ", error);
      }
    };

    fetchMixedContent();
  }, [updated]);

  const filteredContent = mixedContent.filter((item) =>
    selectedFilter === "all" ? true : item.type === selectedFilter
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-800">


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

      {/* Main Content Area */}
      <div className=" md:pt-0 md:ml-64">

        {/* Filter Controls */}
        <div className="flex gap-5 justify-end p-4 bg-white dark:bg-neutral-900 shadow-sm">

          <div className="flex items-center space-x-2">
            <label className="text-gray-700 dark:text-gray-400">Filter by:</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
              className="px-4 dark:bg-gray-600 dark:text-white py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="post">Requestes</option>
              <option value="resource">Resources</option>
            </select>
          </div>
          {/* Mobile Toggle Button */}
          <button
            className=" text-white rounded-full shadow-md hover:cursor-pointer md:hidden"
            onClick={toggleSidebar}
          >
            <img
              src="/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
          </button>
        </div>

        {/* Content Grid */}
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-4 w-full mx-auto px-2 py-4 md:px-0 md:py-2">
          {filteredContent.length > 0 ? (
            filteredContent.map((item) =>
              item.type === "post" ? (
                <PostList key={`post-${item.id}`} post={item as Post} setUpdated={setUpdated} />
              ) : (
                <SharedResourceList
                  key={`resource-${item.id}`}
                  resource={item as SharedResource}
                  setUpdated={setUpdated}
                />
              )
            )
          ) : (
            <div className="h-screen md:w-[80vw] flex items-center justify-center ">
              <AiOutlineLoading3Quarters size={80} className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;