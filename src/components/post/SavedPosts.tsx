import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AiOutlineLoading3Quarters, AiFillHeart } from 'react-icons/ai';
import { FaMedkit, FaTools, FaBook, FaHome, FaUtensils, FaArrowLeft } from 'react-icons/fa';
import { onAuthStateChanged } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import { toast } from 'react-toastify';

interface Post {
    id: string;
    title: string;
    category: string;
    description: string;
    urgencyLevel: number;
    photoUrls: string[];
    createdAt: Timestamp;
    postType: "need" | "offer";
}

const SavedPosts = () => {
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const navigate= useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                fetchSavedPosts(user.uid);
            } else {
                setLoading(false);
                setError('Please login to view saved posts');
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchSavedPosts = async (userId: string) => {
        try {
            setLoading(true);
            const userRef = doc(db, 'Users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const savedPostIds = userSnap.data().savedPosts || [];
                const postsPromises = savedPostIds.map(async (postId: string) => {
                    const postRef = doc(db, 'posts', postId);
                    const postSnap = await getDoc(postRef);
                    return postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } : null;
                });

                const posts = (await Promise.all(postsPromises)).filter(post => post !== null) as Post[];
                setSavedPosts(posts);
            }
        } catch (error) {
            console.error('Error fetching saved posts:', error);
            setError('Failed to load saved posts');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsavePost = async (postId: string) => {
        if (!currentUser) return;

        try {
            const userRef = doc(db, 'Users', currentUser.uid);
            await updateDoc(userRef, {
                savedPosts: arrayRemove(postId)
            });
            setSavedPosts(prev => prev.filter(post => post.id !== postId));
            toast.success("Post unsaved successfully", { position: 'top-right' })
        } catch (error) {
            console.error('Error unsaving post:', error);
            toast.error("Failed to unsave post", { position: 'top-right' })
        }
    };

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

    const getUrgencyClass = (level: number) => {
        switch (level) {
            case 3: return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200';
            case 2: return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200';
            default: return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error}</h2>
                {!currentUser && (
                    <Link to="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Login
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Saved Posts</h1>
                <div className="flex gap-2 justify-start mb-8 items-center hover:cursor-pointer text-blue-600 dark:text-blue-400"
                    onClick={() => navigate('/')}
                ><FaArrowLeft /> Back</div>
                {savedPosts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            No saved posts found. Start saving posts to see them here!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedPosts.map((post) => (
                            <div key={post.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <Link to={`/post/${post.id}`} className="block">
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                                        {post.photoUrls?.length > 0 ? (
                                            <ImageDisplay
                                                objectKey={post.photoUrls[0]}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                {post.title}
                                            </h3>
                                            {getCategoryIcon(post.category)}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getUrgencyClass(post.urgencyLevel)}`}>
                                                {post.urgencyLevel === 3 ? 'High' : post.urgencyLevel === 2 ? 'Medium' : 'Low'} Urgency
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${post.postType === 'offer'
                                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                                                    : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200'
                                                }`}>
                                                {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                                            {post.description}
                                        </p>
                                    </div>
                                </Link>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleUnsavePost(post.id);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-700/90 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    title="Unsave post"
                                >
                                    <AiFillHeart className="text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedPosts;