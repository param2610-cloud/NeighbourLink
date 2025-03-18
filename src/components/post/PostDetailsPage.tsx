import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc} from 'firebase/firestore';
import { db } from '../../firebase';
import { AiOutlineLoading3Quarters, AiOutlineHeart, AiOutlineShareAlt, AiOutlineWarning } from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { IoMdArrowBack } from 'react-icons/io';
import { FaMedkit, FaTools, FaBook, FaHome, FaUtensils } from 'react-icons/fa';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import { Timestamp } from 'firebase/firestore';
import LocationViewer from '@/utils/ola/LocationViewer';


interface Post {
  id?: string;
  title: string;
  category: string;
  description: string;
  urgencyLevel: number;
  photoUrls: string[];
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  userId: string;
  postType: "need" | "offer";
  duration: string;
  visibilityRadius: number;
  isAnonymous: boolean;
  createdAt: Timestamp;
}


interface UserInfo {
  displayName: string;
  photoURL: string;
  email: string;
  verified?: boolean;
  rating?: number;
}

const PostDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPostDetails] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [providerInfo, setProviderInfo] = useState<UserInfo | null>(null);
    
    
    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'medical': return <FaMedkit className="text-red-500" />;
            case 'tools': return <FaTools className="text-yellow-600" />;
            case 'books': return <FaBook className="text-blue-500" />;
            case 'housing': return <FaHome className="text-green-500" />;
            case 'food': return <FaUtensils className="text-orange-500" />;
            default: return <FaBook className="text-blue-500" />;
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
    
    
    const getUrgencyInfo = (level: number) => {
        switch (level) {
            case 3: return { text: 'High Urgency', class: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200' };
            case 2: return { text: 'Medium Urgency', class: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200' };
            case 1: 
            default: return { text: 'Low Urgency', class: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' };
        }
    };
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const postRef = doc(db, 'posts', id!);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {
                    const postData = { id: postSnap.id, ...postSnap.data() } as Post;
                    setPostDetails(postData);
                    console.log(postData);
                    
                    
                    if (!postData.isAnonymous) {
                        await fetchUserInfo(postData.userId);
                    }
                } else {
                    setError("Post not found");
                }
            } catch (error) {
                console.error("Error fetching post:", error);
                setError("Error loading post details");
            } finally {
                setLoading(false);
            }
        };
        
        const fetchUserInfo = async (userId: string) => {
            try {
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    setProviderInfo(userSnap.data() as UserInfo);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };
        
        fetchData();
    }, [id]);
    
    
    const navigateImage = (direction: 'next' | 'prev') => {
        if (!post) return;
        
        if (direction === 'next') {
            setCurrentImageIndex((prev) => (prev + 1) % post.photoUrls.length);
        } else {
            setCurrentImageIndex((prev) => (prev - 1 + post.photoUrls.length) % post.photoUrls.length);
        }
    };
    
    
    const handleContact = () => {
        if (!post?.userId) return;
        
        navigate(`/messages/${post.userId}`);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <AiOutlineLoading3Quarters size={60} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error || "Post not available"}</p>
                <button 
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Go Back
                </button>
            </div>
        );
    }
    
    const urgencyInfo = getUrgencyInfo(post.urgencyLevel);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Back button */}
            <button 
                onClick={() => navigate(-1)} 
                className="absolute top-4 left-4 z-10 p-2 bg-white/70 dark:bg-gray-800/70 rounded-full"
            >
                <IoMdArrowBack className="text-xl" />
            </button>
            
            {/* Image Gallery */}
            <div className="relative w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700">
                {post.photoUrls && post.photoUrls.length > 0 ? (
                    <>
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <ImageDisplay objectKey={post.photoUrls[currentImageIndex]}  />
                        </div>
                        
                        {/* Image navigation dots */}
                        {post.photoUrls.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {post.photoUrls.map((_, i) => (
                                    <button 
                                        key={i} 
                                        className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                                        onClick={() => setCurrentImageIndex(i)}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {/* Image navigation arrows */}
                        {post.photoUrls.length > 1 && (
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
            
            {/* Post details card */}
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl -mt-8 relative z-10 p-5 shadow-sm min-h-[calc(100vh-16rem)]">
                {/* Title and category */}
                <div className="mb-4">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{post.title}</h1>
                        <div className="flex items-center">
                            {getCategoryIcon(post.category)}
                            <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{post.category}</span>
                        </div>
                    </div>
                    
                    {/* Post type and date */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                            ${post.postType === 'offer' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200'}`}
                        >
                            {post.postType === 'offer' ? 'Offering' : 'Needed'}
                        </span>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${urgencyInfo.class}`}>
                            {urgencyInfo.text}
                        </span>
                        
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            Posted: {formatDate(post.createdAt)}
                        </span>
                    </div>
                </div>
                
                {/* Description */}
                <div className="mb-6 text-gray-700 dark:text-gray-300">
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p>{post.description}</p>
                </div>
                
                {/* Availability */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Availability</h2>
                    <p className="text-gray-700 dark:text-gray-300">Available for: {post.duration}</p>
                </div>
                
                {/* Location */}
                <div className="mb-6 overflow-hidden">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Location</h2>
                    
                    {post.coordinates && (
                            <LocationViewer lat={post.coordinates.lat.toString()} lon={post.coordinates.lng.toString()}/>
                        
                        
                        
                    )}
                </div>
                
                {/* Provider details */}
                {!post.isAnonymous && providerInfo && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Provider Details</h2>
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                                {providerInfo.photoURL ? (
                                    <img src={providerInfo.photoURL} alt={providerInfo.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                
                {/* Action buttons */}
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
                    <div className="flex justify-between mb-3">
                        <button className="flex items-center text-gray-500 dark:text-gray-400">
                            <AiOutlineHeart className="mr-1" /> Save
                        </button>
                        <button className="flex items-center text-gray-500 dark:text-gray-400">
                            <AiOutlineShareAlt className="mr-1" /> Share
                        </button>
                        <button className="flex items-center text-gray-500 dark:text-gray-400">
                            <AiOutlineWarning className="mr-1" /> Report
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleContact}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-medium hover:bg-indigo-700"
                    >
                        <BiMessageDetail className="mr-2" /> Contact
                    </button>
                </div>
                
                {/* Spacer for fixed bottom bar */}
                <div className="h-32"></div>
            </div>
        </div>
    );
};

export default PostDetailsPage;