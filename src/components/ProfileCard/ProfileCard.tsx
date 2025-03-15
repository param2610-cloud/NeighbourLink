import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

function ProfileCard() {
  const [userDetails, setUserDetails] = useState<any>(null);
  // const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility

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

  // // Function to toggle sidebar visibility
  // const toggleSidebar = () => {
  //   setIsSidebarOpen(!isSidebarOpen);
  // };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/*Sidebar Toggle Button */}
      {/* <button
        className="fixed top-4 right-4 z-50 p-2 bg-indigo-500 text-white rounded-md shadow-sm md:hidden"
        onClick={toggleSidebar}
      >
        <img
              // src={userDetails?.photo || "https://via.placeholder.com/150"} // fix please
              src= "../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
         {isSidebarOpen ? "✕" : "☰"}
      </button> */}

      

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            className=" left-2 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={() => (window.location.href = "/")}
          >
            Back to Home
          </button>
          {/* <div className="md:hidden">
            <img
              // src={userDetails?.photo || "https://via.placeholder.com/150"} // fix please
              src= "../src/assets/pictures/blue-circle-with-white-user_78370-4707.avifgh"
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
          </div> */}
        </div>

        {userDetails ? (
          <div className="w-full max-w-md mx-auto p-6 bg-white shadow-md rounded">
            <div className="flex justify-center mb-4">
              <img
                // src={userDetails.photo}
                src= "../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"
                alt="Profile"
                className="w-32 h-32 rounded-full"
              />
            </div>
            <h3 className="text-2xl font-bold text-center mb-4">
              Welcome {userDetails.firstName} 🙏🙏
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-700">Email: {userDetails.email}</p>
              <p className="text-sm text-gray-700">
                First Name: {userDetails.firstName}
              </p>
            </div>

            <button
              className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;