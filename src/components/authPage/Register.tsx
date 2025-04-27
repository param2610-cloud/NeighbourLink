import { createUserWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { auth, db } from "../../firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { FaArrowAltCircleLeft, FaBell, FaCamera, FaMapMarkerAlt, FaUserAlt, FaExclamationTriangle } from "react-icons/fa";
// import { uploadFileToS3 } from "@/utils/aws/aws";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMobileContext } from "@/contexts/MobileContext";
import MapContainer from "@/components/MapContainer";
import { uploadFileToCloudinary } from "@/utils/cloudinary/cloudinary";

const KOLKATA_COORDINATES: [number, number] = [22.5726, 88.3639];

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [Confirmpassword, setConfirmPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(2);
  const [lat, setLat] = useState<string>();
  const [lon, setLon] = useState<string>();
  const [notifyEmergency, setNotifyEmergency] = useState(true);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [locationSelected, setLocationSelected] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>(KOLKATA_COORDINATES);
  const [fetchingLocation, setFetchingLocation] = useState<boolean>(false);
  const mapRef = useRef<any>(null);
  const navigate = useNavigate();
  const { isMobile } = useMobileContext();

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = () => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
        if (result.state === 'granted') {
          fetchCurrentLocation();
        } else if (result.state === 'denied') {
          setDefaultCenter(KOLKATA_COORDINATES);
          setLat(KOLKATA_COORDINATES[0].toString());
          setLon(KOLKATA_COORDINATES[1].toString());
          toast.warning("Location access denied. You can select your location manually on the map.", {
            position: "bottom-center",
          });
        }
      });
    } else {
      if ("geolocation" in navigator) {
        fetchCurrentLocation();
      } else {
        setLocationPermission('denied');
        setDefaultCenter(KOLKATA_COORDINATES);
        setLat(KOLKATA_COORDINATES[0].toString());
        setLon(KOLKATA_COORDINATES[1].toString());
        toast.error("Geolocation is not supported by your browser.", {
          position: "bottom-center",
        });
      }
    }
  };

  const handlePhotoChange =async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      let photoUrl = '';
      photoUrl = await uploadFileToCloudinary(file, `${file.name}_profile_image`);
      console.log("Photo URL:", photoUrl);
      
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!email || !password || !Confirmpassword || !fname || !lname || !phone) {
        setError("Please fill all the required fields.");
        return;
      }
      if (password !== Confirmpassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    } else if (currentStep === 2) {
      if (!lat || !lon) {
        setError("Please select your location on the map or allow location access.");
        return;
      }
      if (locationPermission === 'denied' && !locationSelected) {
        setError("Since location access is denied, please manually select your location on the map.");
        return;
      }
    }
    setError("");
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    if (!lat || !lon) {
      setError("Location data is missing. Please select your location on the map.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        let photoUrl = {};
        try {
          if (photo) {
            photoUrl = await uploadFileToCloudinary(photo, `${user.uid}_profile_image`);
            // photoURL = await uploadFileToS3(photo, `${user.uid}_profile_image`);

          }
        } catch (error) {
          console.log(error);
        }

        // Create the user document in Firestore
        const userData = {
          email: user.email,
          firstName: fname,
          lastName: lname,
          photo: photoUrl,
          phoneNumber: phone,
          address: address,
          location: {
            latitude: lat,
            longitude: lon,
          },
          preferredRadius: radius,
          notifications: {
            emergency: notifyEmergency,
            matches: notifyMatches,
            messages: notifyMessages,
          },
          isVerified: false,
          createdAt: new Date(),
          rating: 0,
          completedExchanges: 0,
          savedPosts: [],
        };
        
        // Set the document and wait for confirmation
        await setDoc(doc(db, "Users", user.uid), userData);
        
        // Verify the document was created by getting a snapshot (optional but adds certainty)
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          toast.success("Registration successful!", {
            position: "top-center",
          });

          // Only navigate once document creation is confirmed
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          throw new Error("Failed to create user profile. Please try again.");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        setError(err.message);
        toast.error("Registration failed. Please try again.", {
          position: "bottom-center",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMapData = (mapData: any) => {
    if (mapData?.selectedLocations && mapData.selectedLocations.length > 0) {
      const location = mapData.selectedLocations[0];
      setLat(location.latitude.toString());
      setLon(location.longitude.toString());
      setAddress(location.address);
      setLocationSelected(true);
    }

    if (mapData?.currentLocation && !locationSelected) {
      setLat(mapData.currentLocation.latitude.toString());
      setLon(mapData.currentLocation.longitude.toString());
    }

    if (mapData?.permissionStatus) {
      setLocationPermission(mapData.permissionStatus);
    }
  };

  const fetchCurrentLocation = () => {
    if (fetchingLocation) return;
    
    setFetchingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude.toString();
          const longitude = position.coords.longitude.toString();
          setLat(latitude);
          setLon(longitude);
          setLocationPermission('granted');
          setDefaultCenter([parseFloat(latitude), parseFloat(longitude)]);
          
          // Update the map center without affecting form state
          if (mapRef.current?.map) {
            mapRef.current.map.flyTo({
              center: [parseFloat(longitude), parseFloat(latitude)], 
              zoom: 13
            });
          }
          
          toast.success("Location fetched successfully!", {
            position: "bottom-center",
          });
          setFetchingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationPermission('denied');
          setDefaultCenter(KOLKATA_COORDINATES);
          setFetchingLocation(false);
          if (error.code === 1) {
            toast.error("Location access denied. You can manually select your location on the map.", {
              position: "bottom-center",
            });
          } else {
            toast.error("Unable to retrieve your location. Please select location manually.", {
              position: "bottom-center",
            });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.", {
        position: "bottom-center",
      });
      setFetchingLocation(false);
    }
  };

  const handleLocationPermissionDenied = () => {
    setLocationPermission('denied');
    toast.warn("Please manually select your location on the map.", {
      position: "bottom-center",
    });
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 },
  };

  const pageTransition = {
    type: "tween",
    duration: 0.3,
  };

  return (
    <div className="w-screen h-screen relative overflow-auto">
      <img
        src="/assets/social_circle.avif"
        className="h-full w-full object-cover"
        alt="Background"
        style={{ filter: "brightness(0.4) contrast(1.1)" }}
      />
      <button
        className="absolute flex justify-center items-center gap-3 top-6 left-6 px-4 py-2 text-white font-medium rounded-md shadow-sm focus:outline-none hover:bg-black/20 transition-colors"
        onClick={() => navigate("/")}
      >
        <FaArrowAltCircleLeft size={22} /> Back to Home
      </button>
      <div className="absolute top-0 left-0 flex items-center justify-center min-h-screen w-full px-4 py-8">
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl overflow-hidden max-w-4xl w-full flex"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-blue-900/70 text-white p-8 w-1/3 flex flex-col">
            <div className="mb-8">
              <h2 className={`${isMobile ? "text-lg" : "text-2xl"} font-bold mb-4`}>Create Account</h2>
              <div className="h-1 w-16 bg-yellow-400 rounded-full"></div>
            </div>
            <div className={`flex-1 ${isMobile ? "ps-3" : ""}`}>
              <motion.div
                className="flex items-center mb-6"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    currentStep >= 1 ? "bg-yellow-400 text-blue-900" : "bg-white/20"
                  } mr-4`}
                  animate={{ scale: currentStep === 1 ? 1.1 : 1 }}
                >
                  <FaUserAlt />
                </motion.div>
                {!isMobile && <span className={`${currentStep === 1 ? "font-bold" : ""}`}>Personal Information</span>}
              </motion.div>
              <motion.div
                className="flex items-center mb-6"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    currentStep >= 2 ? "bg-yellow-400 text-blue-900" : "bg-white/20"
                  } mr-4`}
                  animate={{ scale: currentStep === 2 ? 1.1 : 1 }}
                >
                  <FaMapMarkerAlt />
                </motion.div>
                {!isMobile && <span className={`${currentStep === 2 ? "font-bold" : ""}`}>Address & Location</span>}
              </motion.div>
              <motion.div
                className="flex items-center mb-6"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    currentStep >= 3 ? "bg-yellow-400 text-blue-900" : "bg-white/20"
                  } mr-4`}
                  animate={{ scale: currentStep === 3 ? 1.1 : 1 }}
                >
                  <FaBell />
                </motion.div>
                {!isMobile && <span className={`${currentStep === 3 ? "font-bold" : ""}`}>Preferences</span>}
              </motion.div>
              <motion.div
                className="flex items-center"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    currentStep >= 4 ? "bg-yellow-400 text-blue-900" : "bg-white/20"
                  } mr-4`}
                  animate={{ scale: currentStep === 4 ? 1.1 : 1 }}
                >
                  <FaCamera />
                </motion.div>
                {!isMobile && <span className={`${currentStep === 4 ? "font-bold" : ""}`}>Profile Image</span>}
              </motion.div>
            </div>
            <div className="mt-auto">
              <p className="text-sm text-white/80">Already have an account?</p>
              <a href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">
                Sign In
              </a>
            </div>
          </div>
          <div className="p-8 flex-1">
            <form onSubmit={handleRegister} className="h-full flex flex-col">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    className="flex-1"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">First Name</label>
                        <input
                          type="text"
                          value={fname}
                          onChange={(e) => setFname(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Last Name</label>
                        <input
                          type="text"
                          value={lname}
                          onChange={(e) => setLname(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Confirm Password</label>
                        <input
                          type="password"
                          value={Confirmpassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    className="flex-1"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <h3 className="text-xl font-bold text-white mb-6">Address & Location</h3>
                    {locationPermission === 'denied' && (
                      <div className="mb-4 p-3 bg-yellow-400/20 border border-yellow-500 rounded-md text-white flex items-start">
                        <FaExclamationTriangle className="text-yellow-400 mt-1 mr-2 flex-shrink-0" />
                        <p className="text-sm">
                          Location access is denied. You can manually select your location on the map below.
                        </p>
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="block text-white text-sm font-medium mb-2">Address</label>
                      <input
                        type="text"
                        value={address}
                        readOnly
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none cursor-not-allowed"
                      />
                      <p className="text-xs text-white/70 mt-1">Address is automatically determined from your location selection on the map.</p>
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-medium mb-2">
                        Select Location on Map
                        {!lat && !lon && <span className="text-red-300 ml-1">*</span>}
                      </label>
                      <div className="h-64 border border-white/20 rounded-md overflow-hidden">
                        <MapContainer
                          ref={(data) => {
                            mapRef.current = data;
                            handleMapData(data);
                          }}
                          showCurrentLocation={locationPermission !== 'denied'}
                          zoom={13}
                          isSelectable={true}
                          maximumSelection={1}
                          scrollWheelZoom={true}
                          center={defaultCenter}
                          onPermissionDenied={handleLocationPermissionDenied}
                        />
                      </div>
                      {locationSelected && mapRef.current?.selectedLocations?.length > 0 && (
                        <div className="mt-2 text-sm text-white/80 bg-green-500/20 p-2 rounded-md">
                          Selected: {mapRef.current.selectedLocations[0].address}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={fetchCurrentLocation}
                          disabled={fetchingLocation}
                          className={`px-4 py-2 ${fetchingLocation 
                            ? "bg-white/5 cursor-not-allowed" 
                            : "bg-white/10 hover:bg-white/20"} 
                            border border-white/30 rounded-md text-white text-sm flex items-center justify-center transition-colors`}
                        >
                          <FaMapMarkerAlt className="mr-2" />
                          {fetchingLocation ? "Getting Location..." : "Get Current Location"}
                        </button>
                        {locationSelected && (
                          <button
                            type="button"
                            onClick={() => {
                              setLocationSelected(false);
                              if (mapRef.current?.makers) {
                                mapRef.current.makers.forEach((marker: any) => marker.remove());
                              }
                            }}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-md text-white text-sm transition-colors"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                      {lat && lon && (
                        <div className="mt-3 p-2 bg-white/10 rounded text-sm text-white/80">
                          <p>
                            Coordinates: {parseFloat(lat).toFixed(6)}, {parseFloat(lon).toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mb-6">
                      <label className="block text-white text-sm font-medium mb-2">
                        Preferred Radius: {radius} km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={radius}
                        onChange={(e) => setRadius(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-xs text-white/70 mt-2">
                        This is the radius within which you'll receive notifications about resources, events, and emergency alerts.
                      </p>
                    </div>
                  </motion.div>
                )}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    className="flex-1"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
                        <div>
                          <h4 className="font-medium text-white">Emergency Alerts</h4>
                          <p className="text-sm text-white/70">Receive notifications for emergency situations</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyEmergency}
                            onChange={() => setNotifyEmergency(!notifyEmergency)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
                        <div>
                          <h4 className="font-medium text-white">Match Notifications</h4>
                          <p className="text-sm text-white/70">Get notified when you have new matches</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyMatches}
                            onChange={() => setNotifyMatches(!notifyMatches)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/10">
                        <div>
                          <h4 className="font-medium text-white">Messages</h4>
                          <p className="text-sm text-white/70">Get notified when you receive new messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyMessages}
                            onChange={() => setNotifyMessages(!notifyMessages)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    className="flex-1"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <h3 className="text-xl font-bold text-white mb-6">Profile Image</h3>
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="w-40 h-40 rounded-full overflow-hidden bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center relative">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Profile Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaCamera size={40} className="text-white/50" />
                        )}
                      </div>
                      <label className="px-6 py-3 bg-yellow-400 text-blue-900 rounded-md font-medium cursor-pointer hover:bg-yellow-300 transition-colors">
                        Choose Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-white/70 text-sm text-center max-w-sm">
                        Add a profile photo to help others recognize you. A clear photo of your face works best.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="bg-red-500/20 border border-red-500/30 text-white p-3 rounded-md mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-between mt-auto pt-6">
                {currentStep > 1 ? (
                  <motion.button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-2 border border-white/30 text-white rounded-md font-medium hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                ) : (
                  <div></div>
                )}
                {currentStep < 4 ? (
                  <motion.button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-yellow-400 text-blue-900 rounded-md font-medium hover:bg-yellow-300 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className={`px-8 py-2 bg-yellow-400 text-blue-900 rounded-md font-medium ${
                      loading ? "opacity-70 cursor-not-allowed" : "hover:bg-yellow-300"
                    } transition-colors`}
                    whileHover={loading ? {} : { scale: 1.05 }}
                    whileTap={loading ? {} : { scale: 0.95 }}
                    animate={loading ? { scale: [1, 1.05, 1] } : {}}
                    transition={loading ? { repeat: Infinity, duration: 1.5 } : {}}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;

