import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { format } from 'date-fns';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface Post {
    id: string;
    category: string;
    createdAt: Timestamp;
    description: string;
    photoUrls: string[];
    title: string;
    userId: string;
    urgencyLevel: number;
    visibilityRadius: number;
}
interface User {
    firstName: string;
    lastName:string;
    photoURL?: string;
    email: string;
}

interface PostWithUser extends Post {
    userData?: User;
}

const EmergencyPosts = () => {
    const [posts, setPosts] = useState<PostWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
        useEffect(() => {
            const fetchEmergencyPosts = async () => {
                try {
                    const postsRef = collection(db, 'posts');
                    const q = query(postsRef,
                        where('urgencyLevel', '==', 3),
                        where('postType', "==", "need")
                    );
                    const querySnapshot = await getDocs(q);
    
                    const postsData: PostWithUser[] = [];
                    
                    // Fetch posts and user data
                    for (const doc of querySnapshot.docs) {
                        const postData = { id: doc.id, ...doc.data() } as Post;
                        
                        // Fetch user data
                        const userDoc = await getDoc(firestoreDoc(db, 'Users', postData.userId));
                        const userData = userDoc.exists() ? userDoc.data() as User : undefined;
                        
                        postsData.push({
                            ...postData,
                            userData
                        });
                    }
                    
                    console.log(postsData);
                    setPosts(postsData);
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching emergency posts:', error);
                    setLoading(false);
                }
            };
    
            fetchEmergencyPosts();
        }, []);
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 animate-fade-in">
                    Emergency Posts 🚨
                </h1>
                <div className="flex gap-2 justify-start mb-3 items-center hover:cursor-pointer text-blue-600 dark:text-blue-400"
                    onClick={() => navigate('/')}
                ><FaArrowLeft /> Back</div>

                {posts.length === 0 ? (
                    <div className="text-center py-12 animate-fade-in">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            No emergency posts available
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post, index) => (
                            <div
                                key={post.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 animate-card-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {post.photoUrls?.length > 0 && (
                                    <img
                                        src={post.photoUrls[0]}
                                        alt={post.title}
                                        className="w-full h-48 object-cover transition-opacity duration-300 hover:opacity-90"
                                    />
                                )}
                                <div className="p-6">
                                    <div className="flex flex-col items-start justify-center mb-4">
                                        <span className="">
                                            Posted By: {post.userData?.firstName?`${post.userData.firstName} ${post.userData.lastName}`:post.userData?.firstName|| post.userData?.lastName ||"Anonymous"}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {format(post.createdAt?.toDate(), 'MMM dd, yyyy hh:mm a')}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        {post.description}
                                    </p>
                                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <span className="capitalize">{post.category}</span>
                                        <span>Visibility: {post.visibilityRadius} km</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes card-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-card-in {
          animation: card-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
        </div>
    );
};

export default EmergencyPosts;