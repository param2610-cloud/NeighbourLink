import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-4 right-4 z-50 p-2 bg-indigo-500 text-white rounded-md shadow-sm md:hidden"
        onClick={toggleSidebar}
      >
        <img
              // src={userDetails?.photo || "https://via.placeholder.com/150"} // fix please
              src= "../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
        {/* {isSidebarOpen ? "✕" : "☰"} */}
      </button>

      {/* Sidebar */}
      <div
        className={`w-full md:w-40 bg-white shadow-md p-4 fixed md:static transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center mb-8">
          <img
            // src={userDetails?.photo || "https://via.placeholder.com/150"} // fix please
            src= "../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
            alt="Profile"
            className="w-12 h-12 rounded-full"
          />
          <span className="ml-3 font-semibold text-gray-700">
            {userDetails?.firstName}
          </span>
        </div>
        <nav>
          <ul>
            <li className="mb-4 w-full px-2 py-2 bg-indigo-600 text-white text-sm rounded-md shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <a href="/profile" >
                Home
              </a>
            </li>
            <li className="mb-4 w-full px-2 py-2 bg-indigo-600 text-white text-sm rounded-md shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <a href="/profileCard">
                Profile
              </a>
            </li>
            <li className="mb-4 w-full px-2 py-2 bg-indigo-600 text-white text-sm rounded-md shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <a href="#" >
                Friends
              </a>
            </li>
            <li className="mb-4 w-full px-2 py-2 bg-indigo-600 text-white text-sm rounded-md shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <a href="/profile/rqform">
                Query Form
              </a>
            </li>
          </ul>
          <button
              className="w-20  bottom-10 px-2 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleLogout}
            >
              Logout
            </button>
        </nav>
      </div>

      {/* Main Content */}
      

        {/* Social Media Scroll Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Social Feed</h2>
          <div className="overflow-y-auto h-64 bg-white shadow-md rounded p-4">
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Post 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Post 2: Sed do eiusmod tempor incididunt ut labore et dolore
                magna aliqua.
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Post 3: Ut enim ad minim veniam, quis nostrud exercitation
                ullamco laboris.
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Post 4: Duis aute irure dolor in reprehenderit in voluptate
                velit esse cillum dolore.
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Post 5: Excepteur sint occaecat cupidatat non proident, sunt in
                culpa qui officia deserunt.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Profile;