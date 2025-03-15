import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import PostList from "../PostCard/PostList";

function Profile() {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility

  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log(user);

        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
          console.log(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } else {
        console.log("User is not logged in");
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
      console.log("User logged out successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging out:", error.message);
      }
    }
  }

  // async function handleQform() {
  //   window.location.href = "/profile/rqform";
  // }

  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  interface Post {
    category: string;
    createdAt: string;
    description: string;
    location: string;
    photoUrl: string;
    title: string;
    urgency: boolean;
    userId: string;
  }

  const [posts, setPosts] = useState<Post[]>([]);

  // Fetch posts from Firebase Firestore
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const postsData: Post[] = [];
        querySnapshot.forEach((doc: any) => {
          postsData.push({ id: doc.id, ...doc.data() } as Post);
        });
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-4 right-4 z-50 p-2 bg-indigo-500 text-white rounded-md shadow-sm md:hidden"
        onClick={toggleSidebar}
      >
        <img
          // src={userDetails?.photo || "https://via.placeholder.com/150"} // fix please
          src="../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
          alt="Profile"
          className="w-12 h-12 rounded-full"
        />
        {/* {isSidebarOpen ? "✕" : "☰"} */}
      </button>

      {/* Sidebar */}
      <div
        className={`w-full md:w-80 bg-white shadow-md p-4 fixed md:static transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center mb-8">
          <img
            // src={userDetails?.photo || "https://via.placeholder.com/150"} // fix please
            src="../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
            alt="Profile"
            className="w-12 h-12 rounded-full"
          />
          <span className="ml-3 font-semibold text-2xl text-gray-700">
            {userDetails?.firstName} {userDetails?.lastName}
          </span>
        </div>
        <nav>
          <ul>
            <li className="mb-4 w-full text-center px-2 py-2 bg-white border-1 border-indigo-600 text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <a href="/profile">Home</a>
            </li>
            <li className="mb-4 w-full text-center px-2 py-2 bg-white border-1 border-indigo-600 text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <a href="/profileCard">Profile</a>
            </li>
            <li className="mb-4 w-full text-center px-2 py-2 bg-white text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white border-1 border-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <a href="#">Friends</a>
            </li>
            <li className="mb-4 w-full text-center px-2 py-2 bg-white border-1 border-indigo-600 text-indigo-600 text-sm rounded-md shadow-sm hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
              <a href="/profile/rqform">Query Form</a>
            </li>
          </ul>
          <button
            className="w-full  bottom-10 px-2 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}

      {/* Social Media Scroll Section */}
      <div className="min-h-screen bg-gray-100 px-2 py-4 md:px-0 md:py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-4 w-full mx-auto">
          {posts.map((post) => (
            <PostList key={post.userId} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
