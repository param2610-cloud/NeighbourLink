import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

function Profile() {
  const [userDetails, setUserDetails] = useState<any>(null);

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

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <button
        className="absolute top-4 left-4 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={() => (window.location.href = "/")}
    >
        Back to Home
    </button>
      {userDetails ? (
        <div className="w-full max-w-md p-6 bg-white shadow-md rounded">
          <div className="flex justify-center mb-4">
            <img
              src={userDetails.photo}
              alt="Profile"
              className="w-32 h-32 rounded-full"
            />
          </div>
          <h3 className="text-2xl font-bold text-center mb-4">
            Welcome {userDetails.firstName} 🙏🙏
          </h3>
          <div className="mb-4">
            <p className="text-sm text-gray-700">Email: {userDetails.email}</p>
            <p className="text-sm text-gray-700">First Name: {userDetails.firstName}</p>
            {/* <p className="text-sm text-gray-700">Last Name: {userDetails.lastName}</p> */}
          </div>
          <button
            className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Profile;