import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaMedkit, FaTools, FaBook, FaHome, FaUtensils, FaMapMarkerAlt } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";
import { uploadFileToCloudinary } from "@/utils/cloudinary/cloudinary";
import GoogleMapsViewer from "@/utils/google_map/GoogleMapsViewer";
import { getCurrentLocation, reverseGeocode, type Coordinates } from "@/utils/google_map/GoogleMapsUtils";

interface ResourceFormProps {
  userId: string;
}

const ResourceForm: React.FC<ResourceFormProps> = ({ userId }) => {

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Medical");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState(1); 
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<"need" | "offer">("need");
  const [duration, setDuration] = useState("1 week");
  const [visibilityRadius, setVisibilityRadius] = useState(3);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Updated coordinate state to use new format
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [userDefaultCoordinates, setUserDefaultCoordinates] = useState<Coordinates | null>(null);
  const [locationType, setLocationType] = useState<"default" | "custom">("default");
  const [locationError, setLocationError] = useState<string>("");
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  // Fetch user's default location from Firestore
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const userDoc = await getDoc(doc(db, "Users", userId));
        if (userDoc.exists() && userDoc.data().location) {
          const userData = userDoc.data();
          const userLoc: Coordinates = {
            lat: userData.location.latitude,
            lng: userData.location.longitude
          };
          setUserDefaultCoordinates(userLoc);
          setCoordinates(userLoc); 
          setLocation(userData.address || "");
          
          // Set initial marker for default location
          setMapMarkers([{
            position: userLoc,
            color: '#4285F4',
            title: 'Your Default Location',
            description: userData.address || 'Your registered address',
            draggable: false
          }]);
        } else {
          toast.warning("User location not found. Please set your location.", {
            position: "bottom-center"
          });
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }
    };

    if (userId) {
      fetchUserLocation();
    }
  }, [userId]);

  const handleGetCurrentLocation = async () => {
    setLocationError("");
    setLoading(true);
    
    try {
      const currentLoc = await getCurrentLocation();
      if (currentLoc) {
        setCoordinates(currentLoc);
        
        // Get address for the location
        const address = await reverseGeocode(currentLoc);
        if (address) {
          setLocation(address);
        }
        
        // Update map marker
        setMapMarkers([{
          position: currentLoc,
          color: '#FF5722',
          title: 'Current Location',
          description: address || 'Your current location',
          draggable: true
        }]);
        
        toast.success("Location fetched successfully!", {
          position: "bottom-center",
        });
      } else {
        throw new Error("Unable to get current location");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError("Unable to retrieve your location. Please enable location access.");
      toast.error("Unable to retrieve your location. Please enable location access.", {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  const useDefaultLocation = () => {
    if (userDefaultCoordinates) {
      setCoordinates(userDefaultCoordinates);
      setMapMarkers([{
        position: userDefaultCoordinates,
        color: '#4285F4',
        title: 'Your Default Location',
        description: location || 'Your registered address',
        draggable: false
      }]);
      toast.success("Using your default location", {
        position: "bottom-center",
      });
    } else {
      toast.error("Default location not available. Please fetch your current location.", {
        position: "bottom-center",
      });
      handleGetCurrentLocation();
    }
  };

  const handleLocationTypeChange = (type: "default" | "custom") => {
    setLocationType(type);
    if (type === "default") {
      useDefaultLocation();
      setShowLocationMap(false);
    } else {
      setShowLocationMap(true);
      if (!coordinates) {
        handleGetCurrentLocation();
      }
    }
  };

  const handleMapClick = async (position: Coordinates) => {
    setCoordinates(position);
    
    // Get address for clicked location
    const address = await reverseGeocode(position);
    if (address) {
      setLocation(address);
    }
    
    // Update map marker
    setMapMarkers([{
      position,
      color: '#4CAF50',
      title: 'Selected Location',
      description: address || 'Custom selected location',
      draggable: true
    }]);
    
    toast.success("Location selected on map!", {
      position: "bottom-center",
    });
  };

  const handleMarkerDrag = async (position: Coordinates, markerIndex: number) => {
    setCoordinates(position);
    
    // Get address for new position
    const address = await reverseGeocode(position);
    if (address) {
      setLocation(address);
    }
    
    // Update marker
    setMapMarkers([{
      position,
      color: '#4CAF50',
      title: 'Selected Location',
      description: address || 'Dragged location',
      draggable: true
    }]);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      if (photos.length + newFiles.length > 3) {
        toast.warning("Maximum 3 photos allowed", { position: "bottom-center" });
        return;
      }
      
      setLoading(true);
      
      try {
        const uploadPromises = newFiles.map(async (file) => {
          const url = await uploadFileToCloudinary(file, `${userId}-${Date.now()}-${file.name}`);
          return url;
        });
        
        const urls = await Promise.all(uploadPromises);
        
        setPhotos(prev => [...prev, ...newFiles]);
        setPhotoUrls(prev => [...prev, ...urls]);
      } catch (error) {
        console.error("Error uploading photos:", error);
        toast.error("Failed to upload photos", { position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Validate that coordinates are available
    if (!coordinates) {
      toast.error("Location is required. Please set your location to continue.", {
        position: "bottom-center",
      });
      setLocationError("Location is required. Please use your default location or fetch a new one.");
      return;
    }

    setLoading(true);

    try {
      const finalCategory = category === "Other" ? customCategory : category;
      
      const resourceData = {
        title,
        category: finalCategory,
        description,
        // Only include urgency for "need" posts
        ...(postType === "need" && { urgencyLevel: urgency }),
        photoUrls,
        location,
        coordinates: {
          lat: coordinates.lat.toString(),
          lng: coordinates.lng.toString()
        },
        userId,
        postType,
        duration,
        visibilityRadius,
        isAnonymous,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "posts"), resourceData);
      console.log("Resource posted with ID: ", docRef.id);

      // Reset form
      setTitle("");
      setCategory("Medical");
      setCustomCategory("");
      setDescription("");
      setUrgency(1);
      setPhotos([]);
      setPhotoUrls([]);
      setLocation("");
      setPostType("need");
      setDuration("1 week");
      setVisibilityRadius(3);
      setIsAnonymous(false);
      setCurrentStep(1);
      setShowLocationMap(false);
      
      toast.success("Post created successfully!", {
        position: "top-center",
      });
      
      window.location.href = "/";
    } catch (error) {
      console.error("Error posting resource: ", error);
      toast.error("Failed to post resource. Please try again.", {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CategoryButton = ({ value, icon, label }: { value: string, icon: React.ReactNode, label: string }) => (
    <button
      type="button"
      className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
        category === value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300'
      }`}
      onClick={() => setCategory(value)}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <span className="text-sm dark:text-white">{label}</span>
    </button>
  );
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: 
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">What are you posting?</h3>
            <div className="flex space-x-4">
              <button
                type="button"
                className={`flex-1 py-4 px-2 border rounded-lg ${
                  postType === "need" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"
                }`}
                onClick={() => setPostType("need")}
              >
                I need something
              </button>
              <button
                type="button"
                className={`flex-1 py-4 px-2 border rounded-lg ${
                  postType === "offer" ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-800"
                }`}
                onClick={() => setPostType("offer")}
              >
                I'm offering something
              </button>
            </div>
          </div>
        );

      case 2: 
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Select a category</h3>
            <div className="grid grid-cols-3 gap-2">
              <CategoryButton value="Medical" icon={<FaMedkit />} label="Medical" />
              <CategoryButton value="Tools" icon={<FaTools />} label="Tools" />
              <CategoryButton value="Books" icon={<FaBook />} label="Books" />
              <CategoryButton value="Household" icon={<FaHome />} label="Household" />
              <CategoryButton value="Food" icon={<FaUtensils />} label="Food" />
              <CategoryButton value="Other" icon={<BsThreeDots />} label="Other" />
            </div>
            
            {category === "Other" && (
              <div className="mt-2">
                <label className="block text-sm font-medium dark:text-white">Specify category:</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>
        );

      case 3: 
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Item Details</h3>
            
            <div>
              <label className="block text-sm dark:text-white font-medium text-gray-700">Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={postType === "need" ? "What do you need?" : "What are you offering?"}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium dark:text-white text-gray-700">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about your request or offer"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium dark:text-white text-gray-700">
                {postType === "need" ? "How long do you need it?" : "How long is this available?"}
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="1 day">1 day</option>
                <option value="A few days">A few days</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="1 month">1 year</option>
                <option value="Permanent">Permanent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium dark:text-white text-gray-700">
                Photos (up to 3):
              </label>
              <input
                type="file"
                onChange={handlePhotoUpload}
                accept="image/*"
                disabled={photos.length >= 3 || loading}
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {loading && <p className="text-sm text-gray-500 mt-2">Uploading photos...</p>}
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <ImageDisplay publicId={url} />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: 
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">
              {postType === "need" ? "Urgency & Visibility" : "Visibility Settings"}
            </h3>
            
            {/* Only show urgency slider for "need" posts */}
            {postType === "need" && (
              <div>
                <label className="block text-sm font-medium dark:text-white text-gray-700">
                  Urgency Level:
                </label>
                <div className="mt-2">
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={urgency}
                    onChange={(e) => setUrgency(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Normal</span>
                  <span className="text-yellow-500">Urgent</span>
                  <span className="text-red-500">Emergency</span>
                </div>
                <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                  {urgency === 1 ? "Regular priority" : 
                  urgency === 2 ? "Neighbors will see this post highlighted as urgent" : 
                  "Emergency request will be pushed to the top and highly visible"}
                </p>
              </div>
            )}
            
            <div className="pt-2">
              <label className="block text-sm font-medium dark:text-white text-gray-700">
                Visibility Radius: {visibilityRadius} km
              </label>
              <div className="mt-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={visibilityRadius}
                  onChange={(e) => setVisibilityRadius(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>1km</span>
                <span>5km</span>
              </div>
              <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                Your post will be visible to neighbors within {visibilityRadius} km of your location
              </p>
            </div>
            
            <div className="pt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm dark:text-white text-gray-700">Post anonymously</span>
              </label>
              <p className="text-xs mt-1 ml-6 text-gray-500 dark:text-gray-400">
                Your name and profile information won't be visible to others
              </p>
            </div>
          </div>
        );

      case 5: 
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Location & Review</h3>
            
            {/* Enhanced Location selection section with map */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <h4 className="text-md font-medium dark:text-white mb-2">Set Location</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                A location is required for your post to be visible to nearby neighbors
              </p>
              
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => handleLocationTypeChange("default")}
                  className={`flex-1 py-2 px-3 rounded-md ${
                    locationType === "default" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  }`}
                >
                  Use Default Location
                </button>
                <button
                  type="button"
                  onClick={() => handleLocationTypeChange("custom")}
                  className={`flex-1 py-2 px-3 rounded-md ${
                    locationType === "custom" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  }`}
                >
                  Select on Map
                </button>
              </div>
              
              {locationType === "custom" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={loading}
                    className="flex items-center justify-center w-full py-2 px-3 bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 rounded-md hover:bg-green-200 dark:hover:bg-green-700 disabled:opacity-50"
                  >
                    <FaMapMarkerAlt className="mr-2" />
                    {loading ? 'Getting Location...' : 'Get Current Location'}
                  </button>
                  
                  {showLocationMap && coordinates && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Click on the map or drag the marker to set your location:
                      </p>
                      <div className="border rounded-lg overflow-hidden">
                        <GoogleMapsViewer
                          center={coordinates}
                          zoom={15}
                          height="250px"
                          markers={mapMarkers}
                          onMapClick={handleMapClick}
                          onMarkerDrag={handleMarkerDrag}
                          showCurrentLocation={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {locationError && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
                  {locationError}
                </div>
              )}
              
              {coordinates && (
                <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-sm">
                  <p className="font-medium">✓ Location set successfully!</p>
                  <p className="text-xs mt-1">{location || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}</p>
                  <p className="text-xs">Your post will be visible to neighbors within {visibilityRadius}km.</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  postType === "need" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                }`}>
                  {postType === "need" ? "Need" : "Offer"}
                </span>
                <span className="ml-2 text-sm font-medium dark:text-gray-300">{category === "Other" ? customCategory : category}</span>
                {postType === "need" && urgency > 1 && (
                  <span className={`ml-auto px-2 py-1 text-xs rounded ${
                    urgency === 2 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                  }`}>
                    {urgency === 2 ? "Urgent" : "Emergency"}
                  </span>
                )}
              </div>
              
              <h4 className="text-lg font-medium dark:text-gray-200">{title}</h4>
              <p className="text-sm dark:text-gray-300 mt-1">{description}</p>
              
              <div className="mt-3 text-sm dark:text-gray-400 text-gray-500">
                <p>Duration: {duration}</p>
                <p>Location: {location || "Location selected on map"}</p>
              </div>
              
              {photoUrls.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium dark:text-gray-300">Photos:</p>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="h-16 w-16 overflow-hidden rounded-md">
                        <ImageDisplay publicId={url} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="text-sm font-medium dark:text-gray-300">Visibility Settings:</h4>
              <ul className="mt-1 text-sm dark:text-gray-400 text-gray-600">
                <li>• Visible within {visibilityRadius} km radius</li>
                {isAnonymous && <li>• Posted anonymously</li>}
              </ul>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Ready to post? This will be visible to neighbors in your selected radius.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-400 to-purple-300 dark:bg-gradient-to-br dark:from-gray-900 dark:to-blue-900">
      <button
        className="absolute top-4 left-10 px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={() => navigate(-1)}
      >
        <IoMdArrowRoundBack />
      </button>
      
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md w-full max-w-md mx-auto mt-6 border-4 border-indigo-500 dark:border-blue-500">
        <h2 className="text-2xl font-bold mb-2 dark:text-white text-gray-800 text-center">
          {postType === "need" ? "Request a Resource" : "Offer a Resource"}
        </h2>
        
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <React.Fragment key={index}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep > index + 1 ? 'bg-green-500 text-white' :
                  currentStep === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > index + 1 ? '✓' : index + 1}
              </div>
              {index < totalSteps - 1 && (
                <div className={`flex-1 h-1 ${
                  currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderStepContent()}
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
            ) : (
              <div></div> 
            )}
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !coordinates}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Posting..." : "Post Now"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;