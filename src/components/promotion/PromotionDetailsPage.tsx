import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AiOutlineLoading3Quarters, AiOutlineHeart, AiOutlineShareAlt, AiFillHeart } from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { IoMdArrowBack } from 'react-icons/io';
import { FiPhone, FiMail, FiMapPin, FiClock, FiUser } from 'react-icons/fi';
import GoogleMapsViewer from '../../utils/google_map/GoogleMapsViewer';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import { getOrCreateConversationWithUser } from '../../services/messagingService';
import { ImageDisplay, VideoDisplay } from '@/utils/cloudinary/CloudinaryDisplay';


interface Promotion {
  id?: string;
  userId: string;
  title: string;
  description: string;
  contactInfo: {
    name: string;
    contact: string;
    email: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images?: string[];
  videoUrl?: string;
  visibilityRadius: string;
  duration: string;
  createdAt: any;
  useProfileLocation: boolean;
  type: string;
}

interface UserInfo {
  displayName: string;
  photoURL: string;
  email: string;
  verified?: boolean;
}

interface Media {
  hasMedia: boolean;
  mediaItems: Array<{
    type: "image" | "video";
    url: string;
  }>;
}

const PromotionDetailsPage = () => {
  console.log("Rendering PromotionDetailsPage component");
  const { id } = useParams();
  console.log("Promotion ID from params:", id);
  const navigate = useNavigate();
  const [promotion, setPromotionDetails] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [providerInfo, setProviderInfo] = useState<UserInfo | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log("Auth state change effect running");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "Auth state changed:",
        user ? `User ID: ${user.uid}` : "No user"
      );
      setFirebaseUser(user);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("Fetching promotion data effect triggered", {
      id,
      firebaseUserExists: !!firebaseUser,
    });
    const fetchPromotionData = async () => {
      try {
        console.log("Fetching promotion data for ID:", id);
        setLoading(true);
        if (!id) {
          console.error("No promotion ID provided");
          return;
        }

        const promotionDoc = await getDoc(doc(db, "promotions", id));
        console.log("Promotion document exists:", promotionDoc.exists());

        if (promotionDoc.exists()) {
          const promotionData = {
            id: promotionDoc.id,
            ...promotionDoc.data(),
          } as Promotion;
          console.log("Promotion data loaded:", promotionData);
          setPromotionDetails(promotionData);

          // Fetch user info
          if (promotionData.userId) {
            console.log("Fetching user info for ID:", promotionData.userId);
            const userDoc = await getDoc(
              doc(db, "Users", promotionData.userId)
            );
            console.log("User document exists:", userDoc.exists());
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User data loaded:", userData);
              setProviderInfo({
                displayName:
                  `${userData.firstName.trim()} ${userData.lastName.trim()}` ||
                  "Anonymous",
                photoURL: userData.photo || "",
                email: userData.email || "",
                verified: userData.isVerified || false,
              });
              console.log("Provider info set:", {
                displayName: userData.displayName || "Anonymous",
                photoURL: Boolean(userData.photoURL),
                email: userData.email || "",
                verified: userData.isVerified || false,
              });
            }
          }

          // Check if user has saved this promotion
          if (firebaseUser) {
            console.log(
              "Checking if promotion is saved by user:",
              firebaseUser.uid
            );
            const userDoc = await getDoc(doc(db, "Users", firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const isSavedPromotion =
                userData.savedPromotions?.includes(id) || false;
              console.log("Promotion saved status:", isSavedPromotion);
              setIsSaved(isSavedPromotion);
            } else {
              console.log("User document not found for saved check");
            }
          } else {
            console.log("No firebase user to check saved status");
          }
        } else {
          console.error("Promotion not found with ID:", id);
          setError("Promotion not found");
        }
      } catch (error) {
        console.error("Error fetching promotion:", error);
        setError("Error loading promotion details");
      } finally {
        setLoading(false);
        console.log("Finished loading promotion data");
      }
    };

    fetchPromotionData();
  }, [id, firebaseUser]);

  // Format date helper function
  const formatDate = (timestamp: any): string => {
    console.log("Formatting date from timestamp:", timestamp);
    if (!timestamp) return "Unknown date";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const formattedDate = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    console.log("Formatted date:", formattedDate);
    return formattedDate;
  };

  const navigateMedia = (direction: "next" | "prev") => {
    console.log(`Navigating media ${direction}`, {
      currentIndex: currentImageIndex,
      totalItems: media.mediaItems.length,
    });

    if (!media.hasMedia || media.mediaItems.length <= 1) {
      console.log("Cannot navigate: no media or only one item");
      return;
    }

    if (direction === "next") {
      const newIndex = (currentImageIndex + 1) % media.mediaItems.length;
      console.log(`Setting new media index to ${newIndex}`);
      setCurrentImageIndex(newIndex);
    } else {
      const newIndex =
        (currentImageIndex - 1 + media.mediaItems.length) %
        media.mediaItems.length;
      console.log(`Setting new media index to ${newIndex}`);
      setCurrentImageIndex(newIndex);
    }
  };

  const handleSavePromotion = async () => {
    console.log("Handle save promotion clicked", {
      isUserLoggedIn: !!firebaseUser,
      promotionId: id,
    });
    if (!firebaseUser || !id) {
      console.log("Cannot save: user not logged in or no promotion ID");
      toast.error("Please log in to save promotions.", {
        position: "top-center",
      });
      return;
    }

    try {
      console.log(`Attempting to ${isSaved ? "unsave" : "save"} promotion`);
      setSaveLoading(true);
      const userRef = doc(db, "Users", firebaseUser.uid);

      if (isSaved) {
        console.log("Removing promotion from saved items");
        await updateDoc(userRef, {
          savedPromotions: arrayRemove(id),
        });
        setIsSaved(false);
        console.log("Successfully removed promotion from saved items");
        toast.success("Promotion removed from saved items", {
          position: "top-center",
        });
      } else {
        console.log("Adding promotion to saved items");
        await updateDoc(userRef, {
          savedPromotions: arrayUnion(id),
        });
        setIsSaved(true);
        console.log("Successfully added promotion to saved items");
        toast.success("Promotion saved successfully", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error updating saved promotions:", error);
      toast.error("Failed to update saved promotions", {
        position: "top-center",
      });
    } finally {
      setSaveLoading(false);
      console.log("Save loading state reset");
    }
  };

  const handleSharePromotion = async () => {
    console.log("Handle share promotion clicked");
    try {
      const promotionUrl = window.location.href;
      console.log("Sharing promotion with URL:", promotionUrl);
      await navigator.clipboard.writeText(promotionUrl);
      console.log("Successfully copied URL to clipboard");
      toast.success("Promotion link copied to clipboard!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy link", { position: "top-center" });
    }
  };

  const handleContact = async () => {
    console.log("Handle contact clicked", {
      promotionUserId: promotion?.userId,
      currentUserId: firebaseUser?.uid,
    });

    if (!promotion?.userId || !firebaseUser?.uid) {
      console.log(
        "Cannot contact: missing promotion user ID or current user ID"
      );
      if (!firebaseUser) {
        toast.error("Please log in to contact the business", {
          position: "top-center",
        });
      }
      return;
    }

    try {
      console.log(
        "Creating or getting conversation between:",
        firebaseUser.uid,
        "and",
        promotion.userId,
        "for promotion:",
        promotion.id
      );
      const conversationId = await getOrCreateConversationWithUser(
        firebaseUser.uid,
        promotion.userId,
        promotion.id,
        promotion.title,
        promotion.images && promotion.images.length > 0
          ? promotion.images[0]
          : undefined
      );

      console.log("Conversation created/retrieved with ID:", conversationId);
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Could not start conversation. Please try again.", {
        position: "top-center",
      });
    }
  };

  // Helper function to prepare media array for display
  const getMedia = (): Media => {
    console.log("Getting media content", {
      hasVideo: !!promotion?.videoUrl,
      hasImages: !!promotion?.images?.length,
    });

    if (!promotion) return { hasMedia: false, mediaItems: [] };

    const mediaItems: Array<{ type: "image" | "video"; url: string }> = [];

    // Add video if available
    if (promotion.videoUrl) {
      mediaItems.push({ type: "video", url: promotion.videoUrl });
    }

    // Add images if available
    if (promotion.images && promotion.images.length > 0) {
      promotion.images.forEach((image) => {
        mediaItems.push({ type: "image", url: image });
      });
    }

    console.log("Media items prepared:", mediaItems);

    return {
      hasMedia: mediaItems.length > 0,
      mediaItems,
    };
  };

  console.log("Promotion details state:", {
    loading,
    error,
    hasPromotion: !!promotion,
    isSaved,
    currentImageIndex,
  });

  if (loading) {
    console.log("Rendering loading state");
    return (
      <div className="h-screen flex items-center justify-center">
        <AiOutlineLoading3Quarters
          size={60}
          className="animate-spin text-indigo-600"
        />
      </div>
    );
  }

  if (error || !promotion) {
    console.log("Rendering error state:", error);
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {error || "Promotion not available"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const media = getMedia();
  console.log("Media content prepared for rendering:", media);

  const handleViewBusiness = () => {
    if (promotion?.userId) {
      navigate(`/business/view/${promotion.userId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-30 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors backdrop-blur-sm"
      >
        <IoMdArrowBack className="text-xl" />
      </button>

      {/* Main Container - Two Column Layout */}
      <div className="flex h-screen">
        
        {/* Left Sidebar - Business Details (20%) - FIXED */}
        <div className="w-1/5 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 h-full overflow-y-auto z-10">
          <div className="p-6 pt-20">
            {/* Business Information */}
            {providerInfo && (
              <div className="space-y-6">
                {/* Business Header */}
                <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                  {providerInfo.photoURL && (
                    <img
                      src={providerInfo.photoURL}
                      alt={providerInfo.displayName}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-indigo-100 dark:border-indigo-900 shadow-lg"
                    />
                  )}
                  <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2">
                    {providerInfo.displayName}
                  </h3>
                  {providerInfo.verified && (
                    <span className="inline-flex items-center bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200 text-sm px-3 py-1 rounded-full font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Verified Business
                    </span>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Contact Details</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FiUser className="mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact Person</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium truncate">{promotion.contactInfo.name}</p>
                      </div>
                    </div>

                    {promotion.contactInfo.contact && (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <FiPhone className="mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium truncate">{promotion.contactInfo.contact}</p>
                        </div>
                      </div>
                    )}

                    {promotion.contactInfo.email && (
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <FiMail className="mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium truncate">{promotion.contactInfo.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FiClock className="mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Posted On</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(promotion.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleViewBusiness}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm shadow-sm"
                  >
                    View Business Profile
                  </button>
                  
                  <button
                    onClick={handleContact}
                    className={`w-full py-3 px-4 ${firebaseUser
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-400 cursor-not-allowed"
                      } text-white rounded-lg flex items-center justify-center font-semibold text-sm transition-colors shadow-sm`}
                    disabled={!firebaseUser}
                  >
                    <BiMessageDetail className="mr-2 text-lg" /> Contact Business
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePromotion}
                      disabled={!firebaseUser || saveLoading}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg font-medium text-sm ${!firebaseUser
                          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400"
                          : isSaved
                            ? "text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                            : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        } transition-colors`}
                      title={
                        !firebaseUser
                          ? "Login to save promotions"
                          : isSaved
                            ? "Remove from saved"
                            : "Save promotion"
                      }
                    >
                      {saveLoading ? (
                        <AiOutlineLoading3Quarters className="animate-spin" />
                      ) : isSaved ? (
                        <AiFillHeart />
                      ) : (
                        <AiOutlineHeart />
                      )}
                    </button>
                    
                    <button
                      onClick={handleSharePromotion}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                    >
                      <AiOutlineShareAlt />
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{promotion.duration}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Days Left</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{promotion.visibilityRadius}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Radius</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content - Product/Service Details (80%) - SCROLLABLE */}
        <div className="w-4/5 ml-[20%] bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* Media Gallery Section */}
            <div className="bg-white dark:bg-gray-800">
              {media.hasMedia ? (
                <div className="w-full h-96 lg:h-[600px] relative bg-gray-100 dark:bg-gray-700">
                  {media.mediaItems[currentImageIndex].type === "video" ? (
                    <VideoDisplay
                      publicId={media.mediaItems[currentImageIndex].url}
                      className="w-full h-full object-contain"
                      autoPlay={true}
                      loop={true}
                      muted={true}
                      playsInline={true}
                      controls={true}
                    />
                  ) : (
                    <ImageDisplay
                      publicId={media.mediaItems[currentImageIndex].url}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Navigation arrows */}
                  {media.mediaItems.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors backdrop-blur-sm"
                        onClick={() => navigateMedia("prev")}
                      >
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-300">&lt;</span>
                      </button>
                      <button
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors backdrop-blur-sm"
                        onClick={() => navigateMedia("next")}
                      >
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-300">&gt;</span>
                      </button>
                    </>
                  )}

                  {/* Media type indicator */}
                  <div className="absolute top-4 right-4 bg-black/80 text-white text-sm rounded-lg px-3 py-2 font-medium">
                    {media.mediaItems[currentImageIndex].type === "video"
                      ? "📹 Video"
                      : `📷 Photo ${currentImageIndex + 1 - (promotion.videoUrl ? 1 : 0)} of ${media.mediaItems.length - (promotion.videoUrl ? 1 : 0)}`}
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 lg:h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No media available</p>
                  </div>
                </div>
              )}

              {/* Thumbnails for navigation */}
              {media.mediaItems.length > 1 && (
                <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-3 overflow-x-auto">
                    {media.mediaItems.map((item, i) => (
                      <div
                        key={i}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${i === currentImageIndex ? "border-indigo-500 shadow-lg" : "border-gray-200 dark:border-gray-600"
                        } hover:border-indigo-400 transition-all duration-200`}
                        onClick={() => setCurrentImageIndex(i)}
                      >
                        {item.type === "video" ? (
                          <div className="relative w-full h-full">
                            <VideoDisplay
                              publicId={item.url}
                              className="w-full h-full object-cover"
                              controls={false}
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="bg-black/60 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                                ▶
                              </span>
                            </div>
                          </div>
                        ) : (
                          <ImageDisplay
                            publicId={item.url}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="p-8 space-y-8">
              {/* Title and Status */}
              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300">
                    🎯 Special Promotion
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300">
                    ⚡ Limited Time
                  </span>
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {promotion.title}
                </h1>

                <div className="flex items-center gap-4 text-lg">
                  <div className="flex items-center text-green-600 dark:text-green-400 font-semibold">
                    <FiClock className="mr-2" />
                    {promotion.duration} days remaining
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                    <FiMapPin className="mr-2" />
                    {promotion.visibilityRadius} radius
                  </div>
                </div>
              </div>

              {/* Navigation dots for mobile */}
              {media.mediaItems.length > 1 && (
                <div className="flex justify-center gap-2 md:hidden">
                  {media.mediaItems.map((_, i) => (
                    <button
                      key={i}
                      className={`w-3 h-3 rounded-full transition-colors ${i === currentImageIndex ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      onClick={() => setCurrentImageIndex(i)}
                    />
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  About This Promotion
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-8 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                    {promotion.description}
                  </p>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Promotion Highlights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-blue-500 rounded-lg mr-4">
                        <FiClock className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-800 dark:text-blue-200 text-lg">Valid Duration</h3>
                        <p className="text-blue-600 dark:text-blue-300 font-medium">{promotion.duration} days from today</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-purple-500 rounded-lg mr-4">
                        <FiMapPin className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="font-bold text-purple-800 dark:text-purple-200 text-lg">Service Area</h3>
                        <p className="text-purple-600 dark:text-purple-300 font-medium">Within {promotion.visibilityRadius}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              {promotion.location && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Location & Directions
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center">
                      <FiMapPin className="mr-4 text-gray-500 dark:text-gray-400 text-2xl flex-shrink-0" />
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide font-medium">Business Address</p>
                        <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg">{promotion.location.address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-96 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-600">
                    <GoogleMapsViewer
                      center={{
                        lat: promotion.location.latitude,
                        lng: promotion.location.longitude
                      }}
                      zoom={15}
                      height="384px"
                      markers={[{
                        position: {
                          lat: promotion.location.latitude,
                          lng: promotion.location.longitude
                        },
                        color: '#8B5CF6',
                        title: promotion.title,
                        description: promotion.location.address,
                        icon: undefined
                      }]}
                      showCurrentLocation={true}
                      enableGeolocation={true}
                      showDirectionsButton={true}
                      mapType="roadmap"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionDetailsPage;
