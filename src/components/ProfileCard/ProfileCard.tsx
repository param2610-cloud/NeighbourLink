import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import {  AiOutlineUser, AiOutlineMail, AiOutlinePhone, AiOutlineHome } from "react-icons/ai";
import { deleteFileFromS3, getPreSignedUrl, uploadFileToS3 } from "@/utils/aws/aws";
import { useNavigate } from "react-router-dom";
import Bottombar from "../authPage/structures/Bottombar";
import { useMobileContext } from "@/contexts/MobileContext";

function ProfileCard() {
  // State management
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const navigate = useNavigate();
  const {isMobile}= useMobileContext();

  // Handle photo change from file input
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Fetch profile photo using AWS pre-signed URL
  const fetchProfilePhoto = useCallback(async () => {
    if (userDetails?.photo) {
      try {
        const photoUrl = await getPreSignedUrl(userDetails.photo);
        if (photoUrl) {
          setProfilePhoto(photoUrl);
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    }
  }, [userDetails]);

  // Update profile photo when userDetails changes
  useEffect(() => {
    if (userDetails) {
      fetchProfilePhoto();
    }
  }, [userDetails, fetchProfilePhoto]);

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async () => {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserDetails(data);
            setName(data.firstName || "");
            setPhone(data.phoneNumber || "");
            setEmail(data.email || "");
            setAddress(data.address || "");
            setPhotoUrl(data.photo || "");
          } else {
            console.log("No such document!");
            toast.error("User profile not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load profile");
        }
      } else {
        console.log("User is not logged in");
        window.location.href = "/login";
      }
    });
  }, []);

  // Initialize user data on component mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    fetchUserData().then(unsubFn => {
      unsubscribe = unsubFn;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchUserData]);
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
  };

  // Open edit profile modal
  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  // Handle save profile changes
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      if (!auth.currentUser) {
        toast.error("User not authenticated");
        return;
      }

      let photoURL = photoUrl; // Keep existing photo URL by default

      // Handle photo update if a new photo was selected
      if (photoFile) {
        try {
          // Only delete old photo if it exists
          if (userDetails?.photo) {
            await deleteFileFromS3(userDetails.photo);
          }
          photoURL = await uploadFileToS3(photoFile, `${auth.currentUser.uid}_profile_image`);
        } catch (error) {
          console.error("Error handling photo upload:", error);
          toast.warning("Failed to update profile photo, but other details will be saved");
        }
      }

      const userId = auth.currentUser.uid;
      const userRef = doc(db, "Users", userId);

      const updateData: Record<string, any> = {
        firstName: name,
        phoneNumber: phone, // Fixed key name to match what's used in the Register component
        email: email,
        address: address,
      };

      // Only update photo if it changed
      if (photoURL !== photoUrl) {
        updateData.photo = photoURL;
      }

      await updateDoc(userRef, updateData);

      // Update local state with the new data
      setUserDetails({ ...userDetails, ...updateData });

      // Update preview if photo was changed
      if (photoURL !== photoUrl) {
        setPhotoUrl(photoURL);
        // Fetch the updated photo URL
        fetchProfilePhoto();
      }

      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);

      // Reset the photo file and preview
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your component remains the same
  // Helper components for cleaner code
  return (
    <div className={`min-h-screen ${isMobile?'mb-16':''} w-full bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800`}>
      {/* Header Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {userDetails ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            {/* Profile Header */}
            <div className="relative h-40 bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
              <div className="absolute -bottom-16 left-6">
                <div className="relative group">
                  <img
                    src={profilePhoto || "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg object-cover transform transition-transform duration-300 group-hover:scale-105"
                  />
                  <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm cursor-pointer border border-gray-200 dark:border-gray-600">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-20 px-6 pb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {userDetails.firstName} {userDetails.lastName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Member since 2025</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleEditProfile}
                    className="px-5 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-gray-700 rounded-lg border border-indigo-100 dark:border-gray-600 hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-gray-700 rounded-lg border border-red-100 dark:border-gray-600 hover:bg-red-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <DetailItem
                    icon={<AiOutlineUser className="w-5 h-5" />}
                    label="Full Name"
                    value={`${userDetails.firstName} ${userDetails.lastName}`}
                  />
                  <DetailItem
                    icon={<AiOutlineMail className="w-5 h-5" />}
                    label="Email Address"
                    value={userDetails.email}
                  />
                </div>
                <div className="space-y-4">
                  <DetailItem
                    icon={<AiOutlinePhone className="w-5 h-5" />}
                    label="Phone Number"
                    value={userDetails.phoneNumber || "Not provided"}
                  />
                  <DetailItem
                    icon={<AiOutlineHome className="w-5 h-5" />}
                    label="Address"
                    value={userDetails.address || "Not provided"}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-8 transform transition-all">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Profile</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="space-y-6">
                <FormInput
                  label="Full Name"
                  icon={<AiOutlineUser />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <FormInput
                  label="Email Address"
                  icon={<AiOutlineMail />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FormInput
                  label="Phone Number"
                  icon={<AiOutlinePhone />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <FormInput
                  label="Address"
                  icon={<AiOutlineHome />}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-200">
                    <input type="file" className="hidden" onChange={handlePhotoChange} />
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Click to upload photo</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors duration-200 flex items-center disabled:opacity-70"
                  >
                    {isLoading && (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Bottombar />
    </div>
  );
}

export default ProfileCard;
// Helper components for cleaner code
const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">{icon}</div>
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{label}</dt>
      <dd className="mt-1 text-gray-900 dark:text-gray-100 font-medium">{value}</dd>
    </div>
  </div>
);

const FormInput = ({ label, icon, ...props }: { label: string; icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <input
        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-all duration-200"
        {...props}
      />
    </div>
  </div>
);