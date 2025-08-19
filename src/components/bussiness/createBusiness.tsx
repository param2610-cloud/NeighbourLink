import React, { useRef, useState } from "react";
import MapContainer from "@/components/MapContainer";
import { db, auth } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { BusinessFormData } from "@/interface/main";

const BUSINESS_TYPES = [
  "-- select --",
  "Grocery Store",
  "Pharmacy",
  "Restaurant",
  "Salon",
  "Laundry",
  "Pet Shop",
  "Bookstore",
  "Electronics",
  "Bakery",
  "Cafe",
  "Other",
];

const CreateBusiness: React.FC = () => {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [verificationPreview, setVerificationPreview] = useState<string | null>(
    null
  );
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef<any>(null);

  // Handle verification doc upload
  const handleVerificationDocChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setVerificationDoc(e.target.files[0]);
      setVerificationPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Handle business profile image upload
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      setProfilePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Handle map location selection
  const handleMapData = (data: any) => {
    if (data?.selectedLocations && data.selectedLocations.length > 0) {
      setLocation(data.selectedLocations[0]);
    }
    setMapData(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!businessName.trim()) {
      toast.error("Please enter a business name");
      return;
    }

    if (businessType === BUSINESS_TYPES[0]) {
      toast.error("Please select a business type");
      return;
    }

    if (!location) {
      toast.error("Please select a business location on the map");
      return;
    }

    if (!auth.currentUser) {
      toast.error("You must be logged in to create a business");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare business data for Firebase
      const businessData: Omit<BusinessFormData, "id"> = {
        businessName: businessName.trim(),
        businessType,
        isVerified,
        verificationDoc: "", // Will be updated when file upload is understood
        location,
        profileImage: "", // Will be updated when file upload is understood
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true, // if needed we will add a button to handle active or disable
      };

      // Save to Firebase
      const businessCollection = collection(db, "business");
      const docRef = await addDoc(businessCollection, businessData);

      toast.success(`Business "${businessName}" created successfully!`);

      // Reset form
      setBusinessName("");
      setBusinessType(BUSINESS_TYPES[0]);
      setIsVerified(false);
      setVerificationDoc(null);
      setVerificationPreview(null);
      setLocation(null);
      setProfileImage(null);
      setProfilePreview(null);
      setMapData(null);

      console.log("Business created with ID:", docRef.id);
    } catch (error) {
      console.error("Error creating business:", error);
      toast.error("Failed to create business. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" flex items-center rounded-2xl justify-center bg-gradient-to-br from-yellow-50 to-white dark:from-gray-900 dark:to-gray-800 px-1">
      <div
        className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 md:p-8 animate-fade-in"
        style={{
          animation: "fadeIn 0.7s",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
            Create Your Business
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Left column: Name, Type, IsVerified, Verification */}
            <div className="flex flex-col gap-4">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 dark:focus:ring-yellow-500 dark:focus:border-yellow-500 text-sm transition-all duration-200"
                  placeholder="Enter business name"
                />
              </div>
              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 dark:focus:ring-yellow-500 dark:focus:border-yellow-500 text-sm transition-all duration-200"
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {/* Is Verified */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Is Verified?
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isVerified"
                      checked={isVerified}
                      onChange={() => setIsVerified(true)}
                      className="accent-yellow-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      Yes
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isVerified"
                      checked={!isVerified}
                      onChange={() => setIsVerified(false)}
                      className="accent-yellow-500"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      No
                    </span>
                  </label>
                </div>
              </div>
              {/* Verification Document Upload (if verified) */}
              {isVerified && (
                <div className="transition-all duration-300">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Verification Document
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-yellow-300 dark:border-yellow-600 rounded-lg cursor-pointer hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors duration-200">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={handleVerificationDocChange}
                    />
                    {verificationPreview ? (
                      <img
                        src={verificationPreview}
                        alt="Verification Preview"
                        className="h-full w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-yellow-400 dark:text-yellow-500">
                        <svg
                          className="w-8 h-8 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm">
                          Click to upload document
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>
            {/* Right column: Map and Image */}
            <div className="flex flex-col gap-4">
              {/* Location Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Business Location{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="h-40 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg overflow-hidden mb-2">
                  <MapContainer
                    ref={handleMapData}
                    showCurrentLocation={true}
                    zoom={13}
                    isSelectable={true}
                    maximumSelection={1}
                    scrollWheelZoom={true}
                  />
                </div>
                {location && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    <span className="font-medium">Selected:</span>{" "}
                    {location.address}
                    <br />
                    <span className="font-medium">Lat:</span>{" "}
                    {location.latitude.toFixed(6)}{" "}
                    <span className="font-medium">Lng:</span>{" "}
                    {location.longitude.toFixed(6)}
                  </div>
                )}
              </div>
              {/* Business Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Profile Image
                </label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-yellow-300 dark:border-yellow-600 rounded-lg cursor-pointer hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors duration-200">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Business Preview"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-yellow-400 dark:text-yellow-500">
                      <svg
                        className="w-8 h-8 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm">Click to upload image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-center mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-1/2 py-2 font-bold rounded-lg shadow-lg transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 text-sm ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white hover:-translate-y-1 hover:scale-105 animate-bounce-once"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Business...
                </div>
              ) : (
                "Create Business"
              )}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in { animation: fadeIn 0.7s; }
        @keyframes bounce-once {
          0% { transform: scale(1); }
          30% { transform: scale(1.08); }
          60% { transform: scale(0.97); }
          100% { transform: scale(1); }
        }
        .animate-bounce-once { animation: bounce-once 0.5s; }
      `}</style>
    </div>
  );
};

export default CreateBusiness;
