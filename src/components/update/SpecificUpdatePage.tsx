import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { UpdateWithUserData } from '@/interface/main';
import { ImageDisplay } from '@/components/AWS/UploadFile';
import { FaArrowLeft, FaReply } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { onAuthStateChanged } from 'firebase/auth';
import UpdateCard from './UpdateCard';
import ReplyForm from './ReplyForm';

const UpdatePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [update, setUpdate] = useState<UpdateWithUserData | null>(null);
    const [replies, setReplies] = useState<UpdateWithUserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUpdateAndReplies = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                
                // Fetch the main update
                const updateRef = doc(db, 'updates', id);
                const updateSnap = await getDoc(updateRef);
                
                if (!updateSnap.exists()) {
                    setError('Update not found');
                    setLoading(false);
                    return;
                }
                
                const updateData = { id: updateSnap.id, ...updateSnap.data() } as UpdateWithUserData;
                
                // Fetch the user data for this update
                if (updateData.userId) {
                    const userRef = doc(db, 'Users', updateData.userId);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        updateData.userData = {
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            photoURL: userData.photo
                        };
                    }
                }
                
                setUpdate(updateData);
                
                // Fetch all direct replies to this update
                const repliesQuery = query(
                    collection(db, 'updates'),
                    where('parentId', '==', id),
                    orderBy('createdAt', 'desc')
                );
                
                const repliesSnapshot = await getDocs(repliesQuery);
                const repliesData: UpdateWithUserData[] = [];
                
                // Create an array of promises for fetching user data
                const userPromises = repliesSnapshot.docs.map(async (replyDoc) => {
                    const replyData = { id: replyDoc.id, ...replyDoc.data() } as UpdateWithUserData;
                    
                    if (replyData.userId) {
                        const userRef = doc(db, 'Users', replyData.userId);
                        const userSnap = await getDoc(userRef);
                        
                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            replyData.userData = {
                                firstName: userData.firstName,
                                lastName: userData.lastName,
                                photoURL: userData.photo
                            };
                        }
                    }
                    
                    // Get the reply count for each reply
                    const replyCountQuery = query(
                        collection(db, 'updates'),
                        where('parentId', '==', replyDoc.id)
                    );
                    const replyCountSnapshot = await getDocs(replyCountQuery);
                    replyData.replyCount = replyCountSnapshot.size;
                    
                    repliesData.push(replyData);
                });
                
                // Wait for all user data to be fetched
                await Promise.all(userPromises);
                
                setReplies(repliesData);
            } catch (error) {
                console.error('Error fetching update:', error);
                setError('Failed to load update details');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUpdateAndReplies();
    }, [id]);

    const handleReplySubmitted = () => {
        setShowReplyForm(false);
        // Refresh the replies
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-indigo-600" />
            </div>
        );
    }

    if (error || !update) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error || "Update not available"}</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Back button */}
                <div 
                    className="flex gap-2 items-center mb-6 text-blue-600 dark:text-blue-400 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft /> Back
                </div>
                
                {/* Main update */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Update Thread</h1>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <UpdateCard update={update} isReply={false} />
                        
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => firebaseUser ? setShowReplyForm(!showReplyForm) : toast.error("Please log in to reply", { position: "top-center" })}
                                className={`flex items-center px-4 py-2 rounded-full ${firebaseUser ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 cursor-not-allowed text-gray-100'}`}
                                disabled={!firebaseUser}
                            >
                                <FaReply className="mr-2" /> Reply
                            </button>
                        </div>
                        
                        {showReplyForm && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                <ReplyForm 
                                    parentId={update.id} 
                                    onSuccess={handleReplySubmitted} 
                                    threadDepth={update.threadDepth ? update.threadDepth + 1 : 1} 
                                />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Replies */}
                {replies.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-white">Replies</h2>
                        {replies.map(reply => (
                            <div 
                                key={reply.id} 
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer"
                                onClick={() => navigate(`/update/${reply.id}`)}
                            >
                                <UpdateCard update={reply} isReply={true}/>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No replies yet. Be the first to reply!
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdatePage;
