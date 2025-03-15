import { useEffect, useState } from "react";
import { auth, db, storage } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";

function ProfileCard() {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility
  // Add missing state variables for edit functionality
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserDetails(data);
          setName(data.firstName || "");
          setPhone(data.phone || "");
          setEmail(data.email || "");
          setAddress(data.address || "");
          setPhotoUrl(data.photo || "");
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

  const handleLogout = async () => {
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

  // Add the missing handleEditProfile function
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  // Add the missing handleSaveChanges function
  const handleSaveChanges = async () => {
    try {
      if (!auth.currentUser) {
        toast.error("User not authenticated");
        return;
      }

      const userId = auth.currentUser.uid;
      const userRef = doc(db, "Users", userId);
      
      // Update object for Firestore
      const updateData: Record<string, any> = {
        firstName: name,
        phone: phone,
        email: email,
        address: address,
      };

      // Handle photo upload if a new photo was selected
      if (photoFile) {
        const storageRef = ref(storage, `profile_photos/${userId}`);
        await uploadBytes(storageRef, photoFile);
        const downloadURL = await getDownloadURL(storageRef);
        updateData.photo = downloadURL;
        setPhotoUrl(downloadURL);
      }

      await updateDoc(userRef, updateData);
      setUserDetails({ ...userDetails, ...updateData });
      
      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  async function handleQform() {
    window.location.href = "/profile/rqform";
  }

  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            className="left-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={() => (window.location.href = "/")}
          >
            Back to Home
          </button>
        </div>

        {userDetails ? (
          <div className="w-full max-w-md mx-auto p-6 bg-white shadow-md rounded">
            <div className="flex justify-center mb-4">
              <img
                src={userDetails.photo || "../src/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
                alt="Profile"
                className="w-32 h-32 rounded-full"
              />
            </div>
            <h3 className="text-2xl font-bold text-center mb-4">
              Welcome {userDetails.firstName} {userDetails.lastName} 🙏
            </h3>
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-700">Email: {userDetails.email}</p>
              <p className="text-sm font-bold text-gray-700">
                First Name: {userDetails.firstName}
              </p>
              <p className="text-sm font-bold text-gray-700">
                Phone: {userDetails.phone || "Not provided"}
              </p>
              <p className="text-sm font-bold text-gray-700">
                Address: {userDetails.address || "Not provided"}
              </p>
            </div>

            <button
              className="w-full px-4 py-2 bg-indigo-600 mb-3 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>

            <button
              className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;