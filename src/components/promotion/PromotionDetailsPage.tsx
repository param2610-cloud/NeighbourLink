import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import {
  AiOutlineLoading3Quarters,
  AiOutlineHeart,
  AiOutlineShareAlt,
  AiFillHeart,
} from "react-icons/ai";
import { BiMessageDetail } from "react-icons/bi";
import { IoMdArrowBack } from "react-icons/io";
import { FiPhone, FiMail, FiMapPin, FiClock, FiUser } from "react-icons/fi";
import GoogleMapsViewer from "../../utils/google_map/GoogleMapsViewer";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { getOrCreateConversationWithUser } from "../../services/messagingService";
import {
  ImageDisplay,
  VideoDisplay,
} from "@/utils/cloudinary/CloudinaryDisplay";

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
  businessProfileImage?: string; // Add this field
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

            // Also fetch business info for profile image
            const businessQuery = query(
              collection(db, "business"),
              where("ownerId", "==", promotionData.userId)
            );
            const businessSnapshot = await getDocs(businessQuery);

            let businessData = null;
            if (!businessSnapshot.empty) {
              businessData = businessSnapshot.docs[0].data();
              console.log("Business data loaded:", businessData);
            }

            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("User data loaded:", userData);
              setProviderInfo({
                displayName:
                  `${userData.firstName.trim()} ${userData.lastName.trim()}` ||
                  "Anonymous",
                photoURL:
                  businessData?.businessProfileImage || userData.photo || "",
                email: userData.email || "",
                verified: userData.isVerified || false,
                businessProfileImage: businessData?.businessProfileImage || "",
              });
              console.log("Provider info set:", {
                displayName: userData.displayName || "Anonymous",
                photoURL: Boolean(
                  businessData?.businessProfileImage || userData.photo
                ),
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Professional Header Bar */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              <IoMdArrowBack className="text-lg" />
              <span className="hidden sm:inline">Back to Listings</span>
            </button>
            <div className="flex-1 flex justify-center">
              <div className="flex  items-center justify-center ">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600 ">
                Neighbour
              </h1>
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">
              Link
              </h1>
              <span className="mx-2 text-blue-500">
                |
              </span>
              <h2 className="text-xl font-bold text-green-600 dark:text-green-400">
                Spotlight
              </h2> 
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - Full Width Responsive Layout */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6 max-w-[1600px] mx-auto">
          {/* Left Sidebar - Business Information */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden xl:sticky xl:top-20">
              {/* Business Profile Section */}
              {providerInfo && (
                <div className="p-4 lg:p-5">
                  {/* Business Header */}
                  <div className="text-center mb-5">
                    {(providerInfo?.businessProfileImage ||
                      providerInfo?.photoURL) && (
                      <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-xl mx-auto mb-3 border-2 border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <ImageDisplay
                          publicId={
                            providerInfo.businessProfileImage ||
                            providerInfo.photoURL
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base lg:text-lg mb-2 line-clamp-1">
                      {promotion.contactInfo.name}
                    </h3>
                    {providerInfo.verified && (
                      <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-1 rounded-lg font-medium">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3 mb-5">
                    <h4 className="font-medium text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wide">
                      Contact Info
                    </h4>

                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiUser className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Representative
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium text-sm line-clamp-1">
                            {providerInfo.displayName}
                          </p>
                        </div>
                      </div>

                      {promotion.contactInfo.contact && (
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiPhone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Phone
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                              {promotion.contactInfo.contact}
                            </p>
                          </div>
                        </div>
                      )}

                      {promotion.contactInfo.email && (
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiMail className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Email
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm break-all">
                              {promotion.contactInfo.email}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiClock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Published
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                            {formatDate(promotion.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Action Buttons */}
                  <div className="space-y-2.5">
                    <button
                      onClick={handleViewBusiness}
                      className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-2.5 px-3 rounded-lg font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                    >
                      View Business Profile
                    </button>

                    <button
                      onClick={handleContact}
                      className={`w-full py-2.5 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                        firebaseUser
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      }`}
                      disabled={!firebaseUser}
                    >
                      <BiMessageDetail className="w-4 h-4" />
                      Contact Business
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePromotion}
                        disabled={!firebaseUser || saveLoading}
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                          !firebaseUser
                            ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                            : isSaved
                            ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                        title={
                          !firebaseUser
                            ? "Login to save promotions"
                            : isSaved
                            ? "Remove from saved"
                            : "Save promotion"
                        }
                      >
                        {saveLoading ? (
                          <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                        ) : isSaved ? (
                          <AiFillHeart className="w-4 h-4" />
                        ) : (
                          <AiOutlineHeart className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={handleSharePromotion}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                      >
                        <AiOutlineShareAlt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Promotion Details */}
                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg text-center">
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                          {promotion.duration}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Days
                        </p>
                      </div>
                      <div className="bg-violet-50 dark:bg-violet-900/20 p-2.5 rounded-lg text-center">
                        <p className="text-sm font-bold text-violet-700 dark:text-violet-400 line-clamp-1">
                          {promotion.visibilityRadius}
                        </p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                          Range
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-4 order-1 xl:order-2 space-y-4 lg:space-y-6">
            {/* Media Gallery */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {media.hasMedia ? (
                <>
                  <div className="relative aspect-video lg:aspect-[21/9] bg-slate-100 dark:bg-slate-700">
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

                    {/* Navigation */}
                    {media.mediaItems.length > 1 && (
                      <>
                        <button
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/95 dark:bg-slate-800/95 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                          onClick={() => navigateMedia("prev")}
                        >
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">
                            &lt;
                          </span>
                        </button>
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/95 dark:bg-slate-800/95 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                          onClick={() => navigateMedia("next")}
                        >
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">
                            &gt;
                          </span>
                        </button>
                      </>
                    )}

                    {/* Media Counter */}
                    <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-sm rounded-lg px-2.5 py-1 font-medium">
                      {media.mediaItems[currentImageIndex].type === "video"
                        ? "Video"
                        : `${
                            currentImageIndex + 1 - (promotion.videoUrl ? 1 : 0)
                          } of ${
                            media.mediaItems.length -
                            (promotion.videoUrl ? 1 : 0)
                          }`}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {media.mediaItems.length > 1 && (
                    <div className="p-3 lg:p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex gap-2 overflow-x-auto">
                        {media.mediaItems.map((item, i) => (
                          <button
                            key={i}
                            className={`flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              i === currentImageIndex
                                ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                                : "border-slate-200 dark:border-slate-600"
                            }`}
                            onClick={() => setCurrentImageIndex(i)}
                          >
                            {item.type === "video" ? (
                              <div className="relative w-full h-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                <span className="text-slate-500 text-xs">
                                  ▶
                                </span>
                              </div>
                            ) : (
                              <ImageDisplay
                                publicId={item.url}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video lg:aspect-[21/9] flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-slate-500 dark:text-slate-400">
                      No media available
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Promotion Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 lg:p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                    Special Promotion
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    Limited Time
                  </span>
                </div>

                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                  {promotion.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <FiClock className="w-4 h-4" />
                    <span className="font-medium">
                      {promotion.duration} days remaining
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <FiMapPin className="w-4 h-4" />
                    <span className="font-medium">
                      {promotion.visibilityRadius} coverage area
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg lg:text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">
                  Promotion Details
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm lg:text-base">
                    {promotion.description}
                  </p>
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 lg:p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm lg:text-base">
                        Validity Period
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        {promotion.duration} days from publication date
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-violet-50 dark:bg-violet-900/20 p-4 lg:p-5 rounded-xl border border-violet-200 dark:border-violet-800">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiMapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-1 text-sm lg:text-base">
                        Service Coverage
                      </h3>
                      <p className="text-violet-700 dark:text-violet-300 text-sm">
                        Available within {promotion.visibilityRadius}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section */}
            {promotion.location && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 lg:p-6">
                  <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-5 text-slate-800 dark:text-slate-200">
                    Business Location
                  </h2>

                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 lg:p-5 mb-4 lg:mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiMapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">
                          Business Address
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-sm lg:text-base">
                          {promotion.location.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <GoogleMapsViewer
                      center={{
                        lat: promotion.location.latitude,
                        lng: promotion.location.longitude,
                      }}
                      zoom={15}
                      height="350px"
                      markers={[
                        {
                          position: {
                            lat: promotion.location.latitude,
                            lng: promotion.location.longitude,
                          },
                          color: "#6366f1",
                          title: promotion.title,
                          description: promotion.location.address,
                          icon: undefined,
                        },
                      ]}
                      showCurrentLocation={true}
                      enableGeolocation={true}
                      showDirectionsButton={true}
                      mapType="roadmap"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionDetailsPage;
