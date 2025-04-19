import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AiOutlineLoading3Quarters, AiOutlineHeart, AiOutlineShareAlt, AiFillHeart } from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { IoMdArrowBack } from 'react-icons/io';
import { FiPhone, FiMail, FiMapPin, FiClock, FiUser } from 'react-icons/fi';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import MapContainer from '../MapContainer';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import { getOrCreateConversationWithUser } from '../../services/messagingService';

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
    hasVideo: boolean;
    hasImages: boolean;
    videoUrl?: string;
    images: string[];
}

const PromotionDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [promotion, setPromotionDetails] = useState<Promotion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [providerInfo, setProviderInfo] = useState<UserInfo | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchPromotionData = async () => {
            try {
                setLoading(true);
                if (!id) return;
                
                const promotionDoc = await getDoc(doc(db, 'promotions', id));
                
                if (promotionDoc.exists()) {
                    const promotionData = { id: promotionDoc.id, ...promotionDoc.data() } as Promotion;
                    setPromotionDetails(promotionData);
                    
                    // Fetch user info
                    if (promotionData.userId) {
                        const userDoc = await getDoc(doc(db, 'Users', promotionData.userId));
                        if (userDoc.exists()) {
                            setProviderInfo({
                                displayName: userDoc.data().displayName || 'Anonymous',
                                photoURL: userDoc.data().photoURL || '',
                                email: userDoc.data().email || '',
                                verified: userDoc.data().isVerified || false
                            });
                        }
                    }
                    
                    // Check if user has saved this promotion
                    if (firebaseUser) {
                        const userDoc = await getDoc(doc(db, 'Users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setIsSaved(userData.savedPromotions?.includes(id) || false);
                        }
                    }
                } else {
                    setError("Promotion not found");
                }
            } catch (error) {
                console.error("Error fetching promotion:", error);
                setError("Error loading promotion details");
            } finally {
                setLoading(false);
            }
        };

        fetchPromotionData();
    }, [id, firebaseUser]);

    // Format date helper function
    const formatDate = (timestamp: any): string => {
        if (!timestamp) return 'Unknown date';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const navigateImage = (direction: 'next' | 'prev') => {
        if (!promotion?.images || promotion.images.length <= 1) return;

        if (direction === 'next') {
            setCurrentImageIndex((prev) => (prev + 1) % promotion.images!.length);
        } else {
            setCurrentImageIndex((prev) => (prev - 1 + promotion.images!.length) % promotion.images!.length);
        }
    };

    const handleSavePromotion = async () => {
        if (!firebaseUser || !id) {
            toast.error('Please log in to save promotions.', { position: 'top-center' });
            return;
        }

        try {
            setSaveLoading(true);
            const userRef = doc(db, 'Users', firebaseUser.uid);

            if (isSaved) {
                await updateDoc(userRef, {
                    savedPromotions: arrayRemove(id)
                });
                setIsSaved(false);
                toast.success("Promotion removed from saved items", { position: 'top-center' });
            } else {
                await updateDoc(userRef, {
                    savedPromotions: arrayUnion(id)
                });
                setIsSaved(true);
                toast.success("Promotion saved successfully", { position: 'top-center' });
            }
        } catch (error) {
            console.error('Error updating saved promotions:', error);
            toast.error("Failed to update saved promotions", { position: 'top-center' });
        } finally {
            setSaveLoading(false);
        }
    };

    const handleSharePromotion = async () => {
        try {
            const promotionUrl = window.location.href;
            await navigator.clipboard.writeText(promotionUrl);
            toast.success('Promotion link copied to clipboard!', { position: 'top-center' });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error('Failed to copy link', { position: 'top-center' });
        }
    };

    const handleContact = async () => {
        if (!promotion?.userId || !firebaseUser?.uid) {
            if (!firebaseUser) {
                toast.error("Please log in to contact the business", { position: 'top-center' });
            }
            return;
        }

        try {
            const conversationId = await getOrCreateConversationWithUser(
                firebaseUser.uid,
                promotion.userId,
                promotion.id,
                promotion.title,
                promotion.images && promotion.images.length > 0 ? promotion.images[0] : undefined
            );

            navigate(`/messages/${conversationId}`);
        } catch (error) {
            console.error("Error creating conversation:", error);
            toast.error("Could not start conversation. Please try again.", { position: 'top-center' });
        }
    };
    
    // Helper function to get content for display
    const getMedia = (): Media => {
        if (!promotion) return { hasVideo: false, hasImages: false, images: [] };
        
        return {
            hasVideo: !!promotion.videoUrl,
            hasImages: !!promotion.images && promotion.images.length > 0,
            videoUrl: promotion.videoUrl,
            images: promotion.images || []
        };
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <AiOutlineLoading3Quarters size={60} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !promotion) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error || "Promotion not available"}</p>
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-10 p-2 bg-white/70 dark:bg-gray-800/70 rounded-full"
            >
                <IoMdArrowBack className="text-xl" />
            </button>

            {/* Video/Image Gallery */}
            <div className="relative w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700">
                {media.hasVideo ? (
                    <video
                        ref={videoRef}
                        src={media.videoUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                    />
                ) : media.hasImages ? (
                    <>
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <ImageDisplay 
                                objectKey={media.images[currentImageIndex]} 
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {media.images.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {media.images.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                                        onClick={() => setCurrentImageIndex(i)}
                                    />
                                ))}
                            </div>
                        )}

                        {media.images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/40 dark:bg-gray-800/40 rounded-full"
                                    onClick={() => navigateImage('prev')}
                                >
                                    &lt;
                                </button>
                                <button
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/40 dark:bg-gray-800/40 rounded-full"
                                    onClick={() => navigateImage('next')}
                                >
                                    &gt;
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">No media available</p>
                    </div>
                )}
            </div>

            {/* Promotion details card */}
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl -mt-8 relative z-10 p-5 shadow-sm min-h-[calc(100vh-16rem)]">
                {/* Title and promotion badge */}
                <div className="mb-4">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{promotion.title}</h1>
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
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Contact Information</h2>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <FiUser className="mr-2 text-gray-500 dark:text-gray-400" />
                            <p className="text-gray-700 dark:text-gray-300">{promotion.contactInfo.name}</p>
                        </div>
                        {promotion.contactInfo.email && (
                            <div className="flex items-center">
                                <FiMail className="mr-2 text-gray-500 dark:text-gray-400" />
                                <p className="text-gray-700 dark:text-gray-300">{promotion.contactInfo.email}</p>
                            </div>
                        )}
                        {promotion.contactInfo.contact && (
                            <div className="flex items-center">
                                <FiPhone className="mr-2 text-gray-500 dark:text-gray-400" />
                                <p className="text-gray-700 dark:text-gray-300">{promotion.contactInfo.contact}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Duration */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Promotion Details</h2>
                    <div className="flex items-center">
                        <FiClock className="mr-2 text-gray-500 dark:text-gray-400" />
                        <p className="text-gray-700 dark:text-gray-300">Duration: {promotion.duration} days</p>
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
                            <MapContainer 
                                center={[promotion.location.latitude, promotion.location.longitude]}
                                zoom={15}
                                scrollWheelZoom={false}
                                isSelectable={false}
                            />
                        </div>
                    </div>
                )}

                {/* Business Owner details (if available) */}
                {providerInfo && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Business Owner</h2>
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                                {providerInfo.photoURL ? (
                                    <img 
                                        src={providerInfo.photoURL} 
                                        alt={providerInfo.displayName} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = "/assets/pictures/blue-circle-with-white-user_78370-4707.avif";
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-300">
                                        <span>{providerInfo.displayName?.charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                            <div className="ml-3 flex-grow">
                                <h3 className="font-medium text-gray-900 dark:text-white">{providerInfo.displayName}</h3>
                                {providerInfo.verified && (
                                    <span className="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-0.5 rounded-full">
                                        Verified Business
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
                    <div className="flex justify-between mb-3">
                        <button
                            onClick={handleSavePromotion}
                            disabled={!firebaseUser || saveLoading}
                            className={`flex items-center ${!firebaseUser ? 'opacity-50 cursor-not-allowed' :
                                isSaved ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                                } transition-colors`}
                            title={!firebaseUser ? "Login to save promotions" : isSaved ? "Unsave promotion" : "Save promotion"}
                        >
                            {saveLoading ? (
                                <AiOutlineLoading3Quarters className="animate-spin mr-1" />
                            ) : isSaved ? (
                                <AiFillHeart className="mr-1" />
                            ) : (
                                <AiOutlineHeart className="mr-1" />
                            )}
                            {isSaved ? 'Saved' : 'Save'}
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
                        className={`w-full py-3 ${firebaseUser ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-400 cursor-not-allowed'
                            } text-white rounded-lg flex items-center justify-center font-medium`}
                        disabled={!firebaseUser}
                    >
                        <BiMessageDetail className="mr-2" /> Contact Business
                    </button>
                </div>

                {/* Spacer for fixed bottom bar */}
                <div className="h-32"></div>
            </div>
        </div>
    );
};

export default PromotionDetailsPage;
