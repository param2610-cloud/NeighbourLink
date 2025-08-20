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
        className="absolute top-4 left-4 z-10 p-2 bg-white/70 dark:bg-gray-800/70 rounded-full"
      >
        <IoMdArrowBack className="text-xl" />
      </button>

      {/* Media Gallery */}
      <div className="relative w-full bg-gray-200 dark:bg-gray-700">
        {media.hasMedia ? (
          <div className="w-full h-64 md:h-96 relative">
            {media.mediaItems[currentImageIndex].type === "video" ? (
              <VideoDisplay
                publicId={media.mediaItems[currentImageIndex].url}
                className="w-full h-full object-cover"
                autoPlay={true}
                loop={true}
                muted={true}
                playsInline={true}
                controls={true}
              />
            ) : (
              <ImageDisplay
                publicId={media.mediaItems[currentImageIndex].url}
                className="w-full h-full object-cover"
              />
            )}

            {/* Navigation dots */}
            {media.mediaItems.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {media.mediaItems.map((_, i) => (
                  <button
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === currentImageIndex ? "bg-white" : "bg-gray-400"
                      }`}
                    onClick={() => setCurrentImageIndex(i)}
                  />
                ))}
              </div>
            )}

            {/* Navigation arrows */}
            {media.mediaItems.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/40 dark:bg-gray-800/40 rounded-full"
                  onClick={() => navigateMedia("prev")}
                >
                  &lt;
                </button>
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/40 dark:bg-gray-800/40 rounded-full"
                  onClick={() => navigateMedia("next")}
                >
                  &gt;
                </button>
              </>
            )}

            {/* Media type indicator */}
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs rounded px-2 py-1">
              {media.mediaItems[currentImageIndex].type === "video"
                ? "Video"
                : `Photo ${currentImageIndex + 1 - (promotion.videoUrl ? 1 : 0)
                } of ${media.mediaItems.length - (promotion.videoUrl ? 1 : 0)
                }`}
            </div>
          </div>
        ) : (
          <div className="w-full h-64 md:h-96 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              No media available
            </p>
          </div>
        )}

        {/* Thumbnails for navigation */}
        {media.mediaItems.length > 1 && (
          <div className="w-full p-2 bg-gray-100 dark:bg-gray-800 overflow-x-auto">
            <div className="flex space-x-2 py-2">
              {media.mediaItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden cursor-pointer ${i === currentImageIndex ? "ring-2 ring-indigo-500" : ""
                    }`}
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

      {/* Promotion details card */}
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl -mt-8 relative z-10 p-5 shadow-sm min-h-[calc(100vh-16rem)]">
        {/* Title and promotion badge */}
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {promotion.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200">
              Promotion
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              Posted: {formatDate(promotion.createdAt)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 text-gray-700 dark:text-gray-300">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="whitespace-pre-line">{promotion.description}</p>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Contact Information
          </h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <FiUser className="mr-2 text-gray-500 dark:text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300">
                {promotion.contactInfo.name}
              </p>
            </div>
            {promotion.contactInfo.email && (
              <div className="flex items-center">
                <FiMail className="mr-2 text-gray-500 dark:text-gray-400" />
                <p className="text-gray-700 dark:text-gray-300">
                  {promotion.contactInfo.email}
                </p>
              </div>
            )}
            {promotion.contactInfo.contact && (
              <div className="flex items-center">
                <FiPhone className="mr-2 text-gray-500 dark:text-gray-400" />
                <p className="text-gray-700 dark:text-gray-300">
                  {promotion.contactInfo.contact}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Promotion Details
          </h2>
          <div className="flex items-center">
            <FiClock className="mr-2 text-gray-500 dark:text-gray-400" />
            <p className="text-gray-700 dark:text-gray-300">
              Duration: {promotion.duration} days
            </p>
          </div>
        </div>


        {/* Location */}
        {promotion.location && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Location</h2>
            <div className="flex items-center mb-2">
              <FiMapPin className="mr-2 text-gray-500 dark:text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300">{promotion.location.address}</p>
            </div>
            <div className="h-60 rounded-lg overflow-hidden">
              <GoogleMapsViewer
                center={{
                  lat: promotion.location.latitude,
                  lng: promotion.location.longitude
                }}
                zoom={15}
                height="240px"
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

        {/* Provider Information */}
        {providerInfo && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Business Information
            </h2>
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {providerInfo.photoURL && (
                <img
                  src={providerInfo.photoURL}
                  alt={providerInfo.displayName}
                  className="w-12 h-12 rounded-full mr-3 object-cover"
                />
              )}
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {providerInfo.displayName}
                </h3>
                {providerInfo.verified && (
                  <span className="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-0.5 rounded-full">
                    Verified Business
                  </span>
                )}
              </div>
              <button
                onClick={handleViewBusiness}
                className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800"
              >
                View Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
        <div className="flex justify-between mb-3">
          <button
            onClick={handleSavePromotion}
            disabled={!firebaseUser || saveLoading}
            className={`flex items-center ${!firebaseUser
                ? "opacity-50 cursor-not-allowed"
                : isSaved
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400"
              } transition-colors`}
            title={
              !firebaseUser
                ? "Login to save promotions"
                : isSaved
                  ? "Unsave promotion"
                  : "Save promotion"
            }
          >
            {saveLoading ? (
              <AiOutlineLoading3Quarters className="animate-spin mr-1" />
            ) : isSaved ? (
              <AiFillHeart className="mr-1" />
            ) : (
              <AiOutlineHeart className="mr-1" />
            )}
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleSharePromotion}
            className="flex items-center text-gray-500 dark:text-gray-400"
          >
            <AiOutlineShareAlt className="mr-1" /> Share
          </button>
        </div>

        <button
          onClick={handleContact}
          className={`w-full py-3 ${firebaseUser
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-indigo-400 cursor-not-allowed"
            } text-white rounded-lg flex items-center justify-center font-medium`}
          disabled={!firebaseUser}
        >
          <BiMessageDetail className="mr-2" /> Contact Business
        </button>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-32"></div>
    </div>
  );
};

export default PromotionDetailsPage;
