import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AiOutlineLoading3Quarters, AiOutlineHeart, AiOutlineShareAlt, AiFillHeart } from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { IoMdArrowBack } from 'react-icons/io';
import { FaBook, FaTools, FaUtensils, FaTshirt, FaHome, FaBriefcaseMedical } from 'react-icons/fa';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import { Timestamp } from 'firebase/firestore';
import { getOrCreateConversationWithUser } from '../../services/messagingService';
import { toast } from 'react-toastify';
import MapContainer from '../MapContainer';

interface Resource {
    id?: string;
    title: string;
    resourceName?: string;
    category: string;
    condition?: string;
    description: string;
    photoUrls?: string[];
    images?: string[];
    location: string | { address: string; latitude: number; longitude: number; };
    coordinates?: {
        lat: number;
        lng: number;
    } | null;
    userId: string;
    isAvailable?: boolean;
    visibilityRadius: number | string;
    isAnonymous?: boolean;
    urgency?: string;
    type?: string;
    createdAt: Timestamp;
    duration?: string;
}

interface UserInfo {
    displayName: string;
    photoURL: string;
    email: string;
    verified?: boolean;
    rating?: number;
}

const ResourceDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resource, setResourceDetails] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [providerInfo, setProviderInfo] = useState<UserInfo | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [mapData, setMapData] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setFirebaseUser(user);
            
            if (user && id) {
                checkIfResourceSaved(user.uid, id);
            }
        });

        return () => unsubscribe();
    }, [id]);

    const checkIfResourceSaved = async (userId: string, resourceId: string) => {
        try {
            const userRef = doc(db, 'Users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.savedResources && userData.savedResources.includes(resourceId)) {
                    setIsSaved(true);
                }
            }
        } catch (error) {
            console.error("Error checking if resource is saved:", error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'medical': return <FaBriefcaseMedical className="text-red-500" />;
            case 'tools': return <FaTools className="text-yellow-600" />;
            case 'books': return <FaBook className="text-blue-500" />;
            case 'housing': return <FaHome className="text-green-500" />;
            case 'food': return <FaUtensils className="text-orange-500" />;
            case 'clothing': return <FaTshirt className="text-purple-500" />;
            default: return <FaTools className="text-blue-500" />;
        }
    };

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return 'Unknown date';
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                let resourceData: Resource | null = null;
                
                const resourceRef = doc(db, 'resources', id);
                let resourceSnap = await getDoc(resourceRef);
                
                if (!resourceSnap.exists()) {
                    const postRef = doc(db, 'posts', id);
                    resourceSnap = await getDoc(postRef);
                }

                if (resourceSnap.exists()) {
                    resourceData = { 
                        id: resourceSnap.id, 
                        ...resourceSnap.data() 
                    } as Resource;
                    
                    console.log("Resource data:", resourceData);
                    setResourceDetails(resourceData);

                    if (!resourceData.isAnonymous) {
                        await fetchUserInfo(resourceData.userId);
                    }
                    
                    if (resourceData.location && typeof resourceData.location === 'object') {
                        setMapData({
                            currentLocation: {
                                latitude: resourceData.location.latitude,
                                longitude: resourceData.location.longitude
                            },
                            selectedLocations: [
                                {
                                    latitude: resourceData.location.latitude,
                                    longitude: resourceData.location.longitude,
                                    address: resourceData.location.address || 'Selected location'
                                }
                            ]
                        });
                    } else if (resourceData.coordinates) {
                        setMapData({
                            currentLocation: {
                                latitude: resourceData.coordinates.lat,
                                longitude: resourceData.coordinates.lng
                            },
                            selectedLocations: [
                                {
                                    latitude: resourceData.coordinates.lat,
                                    longitude: resourceData.coordinates.lng,
                                    address: typeof resourceData.location === 'string' 
                                        ? resourceData.location 
                                        : 'Selected location'
                                }
                            ]
                        });
                    }
                } else {
                    setError("Resource not found");
                }
            } catch (error) {
                console.error("Error fetching resource:", error);
                setError("Error loading resource details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const fetchUserInfo = async (userId: string) => {
        try {
            const userRef = doc(db, 'Users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                setProviderInfo({
                    displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.displayName || 'User',
                    photoURL: userData.photo || userData.photoURL || null,
                    email: userData.email,
                    verified: userData.verified,
                    rating: userData.rating
                });
                console.log("Provider info set:", userData);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const navigateImage = (direction: 'next' | 'prev') => {
        if (!resource || getImages().length <= 1) return;

        if (direction === 'next') {
            setCurrentImageIndex((prev) => (prev + 1) % getImages().length);
        } else {
            setCurrentImageIndex((prev) => (prev - 1 + getImages().length) % getImages().length);
        }
    };

    const handleContact = async () => {
        if (!resource?.userId || !firebaseUser?.uid) {
            if (!firebaseUser) {
                toast.error("Please log in to contact the resource provider", { position: 'top-center' });
            }
            return;
        }

        try {
            const conversationId = await getOrCreateConversationWithUser(
                firebaseUser.uid,
                resource.userId,
                resource.id,
                resource.title || resource.resourceName,
                getImages().length > 0 ? getImages()[0] : undefined
            );

            navigate(`/messages/${conversationId}`);
        } catch (error) {
            console.error("Error creating conversation:", error);
            toast.error("Could not start conversation. Please try again.", { position: 'top-center' });
        }
    };

    const handleSaveResource = async () => {
        if (!firebaseUser || !id) {
            toast.error('Please log in to save resources.', { position: 'top-center' });
            return;
        }

        try {
            setSaveLoading(true);
            const userRef = doc(db, 'Users', firebaseUser.uid);

            if (isSaved) {
                await updateDoc(userRef, {
                    savedResources: arrayRemove(id)
                });
                setIsSaved(false);
                toast.success("Resource unsaved successfully", { position: 'top-right' });
            } else {
                await updateDoc(userRef, {
                    savedResources: arrayUnion(id)
                });
                setIsSaved(true);
                toast.success("Resource saved successfully", { position: 'top-center' });
            }
        } catch (error) {
            console.error('Error updating saved resources:', error);
            toast.error("Failed to update saved resources", { position: 'top-center' });
        } finally {
            setSaveLoading(false);
        }
    };

    const handleShareResource = async () => {
        try {
            const resourceUrl = window.location.href;
            await navigator.clipboard.writeText(resourceUrl);
            toast.success('Resource link copied to clipboard!', { position: 'top-center' });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error('Failed to copy link', { position: 'top-center' });
        }
    };

    const getContactButtonText = () => {
        if (!resource) return "Contact";

        if (firebaseUser?.uid === resource?.userId) {
            return "View Messages";
        }

        return "Request This Resource";
    };

    const getImages = () => {
        if (!resource) return [];
        return resource.photoUrls || resource.images || [];
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <AiOutlineLoading3Quarters size={60} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error || "Resource not available"}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-10 p-2 bg-white/70 dark:bg-gray-800/70 rounded-full"
            >
                <IoMdArrowBack className="text-xl" />
            </button>

            <div className="relative w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700">
                {getImages().length > 0 ? (
                    <>
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <ImageDisplay 
                                objectKey={getImages()[currentImageIndex]} 
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {getImages().length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {getImages().map((_, i) => (
                                    <button
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                                        onClick={() => setCurrentImageIndex(i)}
                                    />
                                ))}
                            </div>
                        )}

                        {getImages().length > 1 && (
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
                        <p className="text-gray-500 dark:text-gray-400">No images available</p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-t-3xl -mt-8 relative z-10 p-5 shadow-sm min-h-[calc(100vh-16rem)]">
                <div className="mb-4">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{resource.resourceName || resource.title}</h1>
                        <div className="flex items-center">
                            {getCategoryIcon(resource.category)}
                            <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{resource.category}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {resource.isAvailable !== undefined && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                ${resource.isAvailable ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'}`}
                            >
                                {resource.isAvailable ? 'Available' : 'Not Available'}
                            </span>
                        )
                        }
                        
                        {resource.urgency && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                ${resource.urgency === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200' : 
                                resource.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200' : 
                                'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'}`}
                            >
                                {resource.urgency.charAt(0).toUpperCase() + resource.urgency.slice(1)} Urgency
                            </span>
                        )}
                        
                        {resource.type && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                ${resource.type === 'offer' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'}`}
                            >
                                {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                            </span>
                        )}

                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            Posted: {formatDate(resource.createdAt)}
                        </span>
                    </div>
                </div>

                <div className="mb-6 text-gray-700 dark:text-gray-300">
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p>{resource.description}</p>
                </div>

                {resource.condition && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Condition</h2>
                        <p className="text-gray-700 dark:text-gray-300">{resource.condition}</p>
                    </div>
                )}
                
                {resource.duration && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Duration</h2>
                        <p className="text-gray-700 dark:text-gray-300">{resource.duration} days</p>
                    </div>
                )}

                <div className="mb-6 overflow-hidden">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Location</h2>
                    
                    {resource.location && (
                        <div className="h-64 border rounded-md overflow-hidden">
                            <MapContainer
                                center={[
                                    typeof resource.location === 'object' ? resource.location.latitude : 
                                    resource.coordinates ? resource.coordinates.lat : 0,
                                    typeof resource.location === 'object' ? resource.location.longitude : 
                                    resource.coordinates ? resource.coordinates.lng : 0
                                ]}
                                showCurrentLocation={false}
                                zoom={15}
                                isSelectable={false}
                                maximumSelection={1}
                                scrollWheelZoom={true}
                                ref={setMapData}
                            />
                        </div>
                    )}
                    
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {typeof resource.location === 'string' 
                            ? resource.location 
                            : resource.location && typeof resource.location === 'object' 
                                ? resource.location.address || JSON.stringify(resource.location)
                                : 'No location information available'}
                    </p>
                </div>

                {!resource.isAnonymous && providerInfo && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Provider Details</h2>
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
                                        Trusted Neighbor
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
                    <div className="flex justify-between mb-3">
                        <button
                            onClick={handleSaveResource}
                            disabled={!firebaseUser || saveLoading}
                            className={`flex items-center ${!firebaseUser ? 'opacity-50 cursor-not-allowed' :
                                isSaved ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                                } transition-colors`}
                            title={!firebaseUser ? "Login to save resources" : isSaved ? "Unsave resource" : "Save resource"}
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
                            onClick={handleShareResource}
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
                        <BiMessageDetail className="mr-2" /> {getContactButtonText()}
                    </button>
                </div>

                <div className="h-32"></div>
            </div>
        </div>
    );
};

export default ResourceDetailsPage;
