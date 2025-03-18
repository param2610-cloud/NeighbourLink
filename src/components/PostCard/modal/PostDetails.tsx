import React, { useEffect, useState } from 'react';
import { auth, db } from "../../../firebase";
import {  doc, arrayUnion, getDoc, runTransaction } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ContactResponder from './ContactResponder'; // Import the new component

interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string;
    // phoneNumber?:string;
    accepted?: boolean;
}

// New interface for responder data
interface ResponderData {
    userId: string;
    accepted: boolean;
}

// Update the Post interface to reflect the new responders structure
interface Post {
    id: string;
    userId: string;
    title: string;
    description: string;
    photoUrl?: string;
    createdAt: { seconds: number };
    responders: ResponderData[];
}

interface PostDetailsProps {
    post: Post;
    isOpen: boolean;
    onClose: () => void;
}

const PostDetails: React.FC<PostDetailsProps> = ({ post, isOpen, onClose }) => {
    if (!isOpen) return null;
    const [responders, setResponders] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('');
    
    // State for contact modal
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedResponder, setSelectedResponder] = useState<UserData | null>(null);

    const handleResponse = async (): Promise<void> => {
        const postId: string = post.id;
        const userId: string | undefined = auth.currentUser?.uid;

        if (!userId) {
            console.error("User not authenticated");
            toast.error("You must be logged in to respond", {
                position: "top-center",
            });
            return;
        }

        try {
            const postRef = doc(db, 'posts', postId);

            // Use transaction to ensure atomic read/write
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);

                if (!postDoc.exists()) {
                    throw new Error("Post not found");
                }

                const responders = postDoc.data().responders || [];
                
                // Check if user already responded by checking if any object in responders array has the current userId
                const alreadyResponded = responders.some((responder: ResponderData) => 
                    responder.userId === userId
                );

                if (alreadyResponded) {
                    toast.error("You have already responded to this request!", {
                        position: "top-center",
                    });
                    throw new Error("ALREADY_RESPONDED");
                }

                // Create responder object with userId and accepted status
                const responderData: ResponderData = {
                    userId: userId,
                    accepted: false  // Default to false when first responding
                };

                transaction.update(postRef, {
                    responders: arrayUnion(responderData)
                });
            });

            console.log("Successfully added user to responders");
            toast.success("Your response has been submitted!", {
                position: "top-center",
            });
            
            // Add the current user to responders state
            if (auth.currentUser) {
                const userDocRef = doc(db, 'Users', auth.currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setResponders(prev => [
                        ...prev,
                        {
                            id: auth.currentUser!.uid,
                            firstName: userData.firstName || 'Unknown',
                            lastName: userData.lastName || '',
                            email: userData.email || 'No email',
                            photoURL: userData.photoURL,
                            accepted: false
                        }
                    ]);
                }
            }
            
        } catch (err: unknown) {
            if (err instanceof Error && err.message === "ALREADY_RESPONDED") {
                console.log("User already responded to this post");
            } else {
                console.error("Error updating responders:", err);
                toast.error("Failed to respond. Please try again.", {
                    position: "top-center",
                });
            }
        }
    };
    
    // Fixed handleAcceptResponse function to ensure state persistence
    const handleAcceptResponse = async (userId: string): Promise<void> => {
        try {
            const postRef = doc(db, 'posts', post.id);
            
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                
                if (!postDoc.exists()) {
                    throw new Error("Post not found");
                }
                
                const postData = postDoc.data();
                const responders = postData.responders || [];
                
                // Find the responder with the given userId
                const responderIndex = responders.findIndex(
                    (responder: ResponderData) => responder.userId === userId
                );
                
                if (responderIndex === -1) {
                    throw new Error("Responder not found");
                }
                
                // Create a new responders array with the updated data
                const updatedResponders = [...responders];
                updatedResponders[responderIndex] = {
                    ...updatedResponders[responderIndex],
                    accepted: true
                };
                
                // Update the entire responders array in the document
                transaction.update(postRef, {
                    responders: updatedResponders
                });
            });
            
            // Update the local state to reflect the change immediately
            setResponders(prevResponders => 
                prevResponders.map(responder => {
                    if (responder.id === userId) {
                        return { ...responder, accepted: true };
                    }
                    return responder;
                })
            );
            
            toast.success("Response accepted!", {
                position: "top-center",
            });
            
        } catch (error) {
            console.error("Error accepting response:", error);
            toast.error("Failed to accept response. Please try again.", {
                position: "top-center",
            });
        }
    };
    
    // New function to handle opening the contact modal
    const handleOpenContactModal = (responder: UserData) => {
        setSelectedResponder(responder);
        setContactModalOpen(true);
    };
    
    useEffect(() => {
        const fetchResponders = async () => {
            console.log('Current post responders:', post.responders);
            if (!post.responders || post.responders.length === 0) {
                console.log('No responders found');
                setResponders([]);
                return;
            }

            setLoading(true);
            setResponders([]); // Clear previous responders
            try {
                const usersData = await Promise.all(
                    post.responders.map(async (responder: ResponderData) => {
                        console.log('Fetching user:', responder.userId);
                        const userDocRef = doc(db, 'Users', responder.userId); // Using Users collection
                        const userDoc = await getDoc(userDocRef);

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            console.log('Found user data:', userData);
                            const typedUserData: UserData = {
                                id: userDoc.id,
                                firstName: userData.firstName || 'Unknown',
                                lastName: userData.lastName || '',
                                email: userData.email || 'No email',
                                photoURL: userData.photoURL,
                                accepted: responder.accepted // Using the accepted value from responder data
                            };
                            
                            return typedUserData;
                        }
                        console.log('User not found:', responder.userId);
                        return null;
                    })
                );

                const filteredUsers = usersData.filter((user): user is UserData => user !== null);
                console.log('Filtered users:', filteredUsers);
                setResponders(filteredUsers);
            } catch (error) {
                console.error('Error fetching responders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResponders();
    }, [post.responders]);

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const userDoc = await getDoc(doc(db, "Users", post.userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserName(`${userData.firstName} ${userData.lastName}`);
                } else {
                    setUserName("Unknown User");
                }
            } catch (error) {
                console.error("Error fetching user name:", error);
                setUserName("Unknown User");
            }
        };

        console.log("post data=", post);
        fetchUserName();
    }, [post.userId]);

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center z-40 bg-neutral-900/50">
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 w-11/12 md:w-3/4 max-h-[90vh] overflow-y-auto">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Column - Post Details */}
                        <div className="flex-1 md:pr-6 md:border-r md:border-gray-200 md:dark:border-neutral-600">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">{post.title}</h2>
                            <p className="text-gray-700 dark:text-neutral-300 mb-4">{post.description}</p>

                            {post.photoUrl && (
                                <img
                                    src={post.photoUrl}
                                    alt="Post"
                                    className="w-full h-48 object-cover rounded-lg mb-4"
                                />
                            )}

                            <div className="mb-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Created by: {userName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(post.createdAt.seconds * 1000).toLocaleString()}
                                </p>
                            </div>
                            {
                                auth.currentUser?.uid !== post.userId && (
                                    <button
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-4"
                                        onClick={handleResponse}
                                    >
                                        Respond
                                    </button>
                                )
                            }

                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        {/* Right Column - Responses */}
                        <div className="flex-1 md:pl-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">
                                Helping hands
                            </h3>
                            {loading ? (
                                <div className="text-center">
                                    <span className="text-gray-500 dark:text-gray-400">Loading responses...</span>
                                </div>
                            ) : responders.length > 0 ? (
                                <div className="space-y-3">
                                    {responders.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`p-3 px-7 ${user.accepted ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : 'bg-gray-100 dark:bg-neutral-700'} rounded-lg flex items-center justify-between gap-3`}
                                        >
                                            <div className='flex justify-center items-center gap-3'>
                                                <img
                                                    src={user.photoURL ? user.photoURL : "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"}
                                                    alt='ProfileImg'
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-gray-900 dark:text-gray-200 font-medium">{user.firstName} {user.lastName}</p>
                                                        {user.accepted && (
                                                            <span className="flex items-center text-green-500 text-xs font-semibold">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Accepted
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
                                                </div>
                                            </div>
                                            {
                                                auth.currentUser?.uid === post.userId && (
                                                    <div className='flex gap-2'>
                                                        <button
                                                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                                            onClick={() => handleOpenContactModal(user)}
                                                        >
                                                            Contact
                                                        </button>
                                                        {!user.accepted && (
                                                            <button
                                                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                                onClick={() => handleAcceptResponse(user.id)}
                                                            >
                                                                Accept
                                                            </button>
                                                        )}
                                                    </div>
                                                )
                                            }
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">Nobody responded yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Contact Responder Modal */}
            {selectedResponder && (
                <ContactResponder 
                    isOpen={contactModalOpen}
                    onClose={() => setContactModalOpen(false)}
                    responder={selectedResponder}
                    postTitle={post.title}
                    currentUserId={auth.currentUser?.uid || ''}
                />
            )}
        </>
    );
};

export default PostDetails;