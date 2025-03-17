import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { AiOutlineLoading3Quarters, AiOutlineUser, AiOutlineMail, AiOutlinePhone, AiOutlineHome } from "react-icons/ai";

function ProfileCard() {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          toast.error("User profile not found");
        }
      } else {
        console.log("User is not logged in");
        window.location.href = "/login";
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
      toast.success("Logged out successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging out:", error.message);
        toast.error("Logout failed");
      }
    }
  }

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      if (!auth.currentUser) {
        toast.error("User not authenticated");
        return;
      }

      const userId = auth.currentUser.uid;
      const userRef = doc(db, "Users", userId);

      const updateData: Record<string, any> = {
        firstName: name,
        phone: phone,
        email: email,
        address: address,
      };
      //error 6ilo tai comment out kore diye6ii
      // if (photoFile) {
      //   const storageRef = ref(storage, `profile_photos/${userId}`);
      //   await uploadBytes(storageRef, photoFile);
      //   const downloadURL = await getDownloadURL(storageRef);
      //   updateData.photo = downloadURL;
      //   setPhotoUrl(downloadURL);
      // }

      await updateDoc(userRef, updateData);
      setUserDetails({ ...userDetails, ...updateData });

      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-400 to-purple-200 dark:from-indigo-900 dark:to-purple-900 py-5">
      {/* Header Navigation */}
      <div className="max-w-7xl mx-5 mb-4">
        <div className="flex justify-between items-center">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg shadow hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-300 border border-indigo-200 dark:border-indigo-800"
            onClick={() => (window.location.href = "/")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto">
        {userDetails ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            {/* Profile Header with Background */}
            <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800"></div>
            
            {/* Profile Image - Positioned to overlap the background */}
            <div className="flex justify-center -mt-16">
              <img
                src={userDetails.photo || "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-lg object-cover"
              />
            </div>
            
            {/* User Details */}
            <div className="px-6 py-3">
              <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-3">
                Welcome {userDetails.firstName} {userDetails.lastName} ✨
              </h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-gray-700 dark:text-gray-300 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <AiOutlineMail className="text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">EMAIL</p>
                    <p className="font-medium">{userDetails.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <AiOutlineUser className="text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">NAME</p>
                    <p className="font-medium">{userDetails.firstName} {userDetails.lastName}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <AiOutlinePhone className="text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">PHONE</p>
                    <p className="font-medium">{userDetails.phone || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700 dark:text-gray-300 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <AiOutlineHome className="text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ADDRESS</p>
                    <p className="font-medium">{userDetails.address || "Not provided"}</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  className="w-[50%] px-4 py-3 bg-white dark:bg-gray-700 text-indigo-500 dark:text-indigo-400 border border-indigo-500 dark:border-indigo-400 font-medium rounded-lg shadow-md hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-300"
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </button>

                <button
                  className="w-[50%] px-4 py-3 bg-white dark:bg-gray-700 text-red-500 dark:text-red-400 font-medium rounded-lg shadow-md border border-red-500 dark:border-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-all duration-300"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 w-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <AiOutlineLoading3Quarters size={60} className="animate-spin text-indigo-500 dark:text-indigo-400" />
          </div>
        )}

        {/* Edit Profile Modal - Improved styling with dark mode */}
        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Edit Profile</h2>
              
              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                  />
                </div>
                
                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                  />
                </div>
                
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                  />
                </div>
                
                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                  />
                </div>
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Photo</label>
                  <div className="flex items-center space-x-3">
                    {photoUrl && (
                      <img 
                        src={photoUrl} 
                        alt="Current profile" 
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-300 flex-grow">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {photoFile ? photoFile.name : "Choose a new photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 font-medium"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 transition-all duration-300 font-medium flex items-center"
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
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