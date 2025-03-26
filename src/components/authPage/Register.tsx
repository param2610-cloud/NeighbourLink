import { createUserWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { FaArrowAltCircleLeft, FaBell, FaCamera, FaMapMarkerAlt, FaUserAlt } from "react-icons/fa";
import { uploadFileToS3 } from "@/utils/aws/aws";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMobileContext } from "@/contexts/MobileContext";
import { MdAccountCircle } from "react-icons/md";

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
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate();
  const { isMobile, isMini } = useMobileContext();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLat(position.coords.latitude.toString());
          setLon(position.coords.longitude.toString());
      })
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!email || !password || !Confirmpassword || !fname || !lname || !phone) {
        setError("Please Fill all the details.")
        return
      }
      if (password !== Confirmpassword) {
        setError("Password do not match");
        return;
      }
    }
    setError("")
    setCurrentStep(currentStep + 1)

  };
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        let photoURL = "";
        try {
          if (photo) {
            photoURL = await uploadFileToS3(photo, `${user.uid}_profile_image`)
          }
        } catch (error) {
          console.log(error);
        }

        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          photo: photoURL,
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
            messages: notifyMessages
          },
          isVerified: false,
          createdAt: new Date(),
          rating: 0,
          completedExchanges: 0,
          savedPosts:[]
        });

        // await setupFCMToken(user.uid);
        toast.success("Registration successful!", {
          position: "top-center",
        });

        setTimeout(() => {
          navigate('/')
        }, 2000);
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

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 }
  };

  const pageTransition = {
    type: "tween",
    duration: 0.3
  };

  useEffect(()=>{
    console.log("isMini: ", isMini)
  })

  return (
    <div className="w-screen h-screen relative overflow-x-scroll">
      <img
        src="/assets/social_circle.avif"
        className="h-full w-full object-cover"
        alt="Background"
        style={{ filter: 'brightness(0.4) contrast(1.1)' }}
      />
      <button
        className="absolute flex justify-center items-center gap-3 top-6 left-6 px-4 py-2 text-white font-medium rounded-md shadow-sm focus:outline-none hover:bg-black/20 transition-colors"
        onClick={() => navigate('/')}
      >
        <FaArrowAltCircleLeft size={22} /> Back to Home
      </button>
      <div className={`absolute top-0 left-0 flex items-center justify-center min-h-screen w-full ${isMini ?'':'px-4 py-8'} `}>
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl overflow-hidden max-w-4xl w-full flex"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Left Panel */}
          <div className="bg-blue-900/70 text-white p-8 w-1/3 flex flex-col">
            <div className="mb-8">
              <h2 className={`${isMobile?( isMini? 'text-sm text-yellow-400':'text-lg'):'text-2xl'} font-bold mb-4`}>
                {isMini ? <MdAccountCircle size={25}/>: "Create Account"}
              </h2>
              <div className="h-1 w-16 bg-yellow-400 rounded-full"></div>
            </div>

            {/* Steps */}
            <div className={`flex-1 ${isMobile?'ps-3':''}`}>
              <motion.div
                className="flex items-center mb-6"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 1 ? 'bg-yellow-400 text-blue-900' : 'bg-white/20'} mr-4`}
                  animate={{ scale: currentStep === 1 ? 1.1 : 1 }}
                >
                  <FaUserAlt />
                </motion.div>
                {
                  !isMobile &&
                  <span className={`${currentStep === 1 ? 'font-bold' : ''}`}>Personal Information</span>
                }
              </motion.div>

              <motion.div
                className="flex items-center mb-6"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 2 ? 'bg-yellow-400 text-blue-900' : 'bg-white/20'} mr-4`}
                  animate={{ scale: currentStep === 2 ? 1.1 : 1 }}
                >
                  <FaMapMarkerAlt />
                </motion.div>
                {
                  !isMobile &&
                  <span className={`${currentStep === 2 ? 'font-bold' : ''}`}>Address & Location</span>
                }
              </motion.div>

              <motion.div
                className="flex items-center mb-6"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 3 ? 'bg-yellow-400 text-blue-900' : 'bg-white/20'} mr-4`}
                  animate={{ scale: currentStep === 3 ? 1.1 : 1 }}
                >
                  <FaBell />
                </motion.div>
                {
                  !isMobile &&
                  <span className={`${currentStep === 3 ? 'font-bold' : ''}`}>Preferences</span>
                }
              </motion.div>

              <motion.div
                className="flex items-center"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 4 ? 'bg-yellow-400 text-blue-900' : 'bg-white/20'} mr-4`}
                  animate={{ scale: currentStep === 4 ? 1.1 : 1 }}
                >
                  <FaCamera />
                </motion.div>
                {
                  !isMobile &&
                  <span className={`${currentStep === 4 ? 'font-bold' : ''}`}>Profile Image</span>
                }
              </motion.div>
            </div>

            <div className="mt-auto">
              <p className="text-sm text-white/80">Already have an account?</p>
              <a href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">Sign In</a>
            </div>
          </div>

          {/* Right Panel - Form */}
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
                    {/* Step 1 content remains the same */}
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
                    {/* Step 2 content remains the same */}
                    <h3 className="text-xl font-bold text-white mb-6">Address & Location</h3>
                    <div className="mb-6">
                      <label className="block text-white text-sm font-medium mb-2">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
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
                    {/* Step 3 content remains the same */}
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
                    {/* Step 4 content remains the same */}
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

              {/* Error Message */}
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

              {/* Form Navigation */}
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
                    className={`px-8 py-2 bg-yellow-400 text-blue-900 rounded-md font-medium ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-yellow-300"} transition-colors`}
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

