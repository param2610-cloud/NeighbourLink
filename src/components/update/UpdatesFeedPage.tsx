import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { UpdateWithUserData } from '@/interface/main';
import {  AiOutlinePlus } from 'react-icons/ai';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UpdateCard from './UpdateCard';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import { Skeleton } from '../ui/skeleton';

const UpdatesPage: React.FC = () => {
    const [updates, setUpdates] = useState<UpdateWithUserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                console.log("Starting updates fetch...");
                setLoading(true);
                
                // Only fetch top-level updates (those without a parent)
                const updatesQuery = query(
                    collection(db, 'updates'),
                    where('parentId', '==', null),  // Only top-level updates
                    orderBy('createdAt', 'desc')
                );
                
                console.log("Executing updates query...");
                const updatesSnapshot = await getDocs(updatesQuery);
                console.log(updatesSnapshot.docs); // Log all update IDs
                console.log(`Found ${updatesSnapshot.size} top-level updates`);
                const updatesData: UpdateWithUserData[] = [];
                
                // Create an array of promises for fetching user data and reply counts
                const dataPromises = updatesSnapshot.docs.map(async (updateDoc, index) => {
                    const updateData = { id: updateDoc.id, ...updateDoc.data() } as UpdateWithUserData;
                    console.log(`Processing update ${index + 1}/${updatesSnapshot.size}:`, updateDoc.id);
                    
                    if (updateData.userId) {
                        console.log(`Fetching user data for update ${updateDoc.id}, user: ${updateData.userId}`);
                        const userRef = doc(db, 'Users', updateData.userId);
                        const userSnap = await getDoc(userRef);
                        
                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            console.log(`Found user data:`, userData.firstName, userData.lastName);
                            updateData.userData = {
                                firstName: userData.firstName,
                                lastName: userData.lastName,
                                photoURL: userData.photo
                            };
                        } else {
                            console.warn(`User ${updateData.userId} data not found`);
                        }
                    } else {
                        console.warn(`Update ${updateDoc.id} has no userId`);
                    }
                    
                    // Get the reply count
                    console.log(`Counting replies for update ${updateDoc.id}`);
                    const replyCountQuery = query(
                        collection(db, 'updates'),
                        where('parentId', '==', updateDoc.id)
                    );
                    const replyCountSnapshot = await getDocs(replyCountQuery);
                    updateData.replyCount = replyCountSnapshot.size;
                    console.log(`Found ${replyCountSnapshot.size} replies for update ${updateDoc.id}`);
                    
                    updatesData.push(updateData);
                    return updateData; // Return for debugging
                });
                
                // Wait for all data to be fetched
                console.log("Waiting for all update data promises to resolve...");
                const results = await Promise.all(dataPromises);
                console.log("All updates processed successfully:", results.length);
                
                setUpdates(updatesData);
                console.log("Updates state set with data:", updatesData);
            } catch (error) {
                console.error('Error fetching updates:', error);
                setError('Failed to load updates');
            } finally {
                setLoading(false);
                console.log("Update fetch completed");
            }
        };
        
        fetchUpdates();
    }, []);

    const handleNewUpdate = () => {
        if (firebaseUser) {
            navigate('/update/new');
        } else {
            toast.error("Please log in to create an update", { position: "top-center" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="w-20">
                            <Skeleton className="h-4 w-full" />
                        </div>
                        <div className="w-24">
                            <Skeleton className="h-6 w-full" />
                        </div>
                        <div className="w-20">
                            <Skeleton className="h-8 w-full rounded-full" />
                        </div>
                    </div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="mb-4 bg-white dark:bg-slate-800 rounded-lg p-6">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error}</h2>
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
                {/* Header with back button */}
                <div className="flex justify-between items-center mb-6">
                    <div 
                        className="flex gap-2 items-center text-blue-600 dark:text-blue-400 cursor-pointer"
                        onClick={() => navigate(-1)}
                    >
                        <FaArrowLeft /> Back
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Updates</h1>
                    <button
                        onClick={handleNewUpdate}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                            firebaseUser 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-400 cursor-not-allowed text-gray-100'
                        }`}
                        disabled={!firebaseUser}
                    >
                        <AiOutlinePlus /> New
                    </button>
                </div>
                
                {/* Updates list */}
                {updates.length > 0 ? (
                    <div className="space-y-4">
                        {updates.map(update => (
                            <div 
                                key={update.id} 
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer"
                                onClick={() => navigate(`/update/${update.id}`)}
                            >
                                <UpdateCard update={update} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                        <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">No updates yet</p>
                        <button
                            onClick={handleNewUpdate}
                            className={`px-4 py-2 rounded-md ${
                                firebaseUser 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-gray-400 cursor-not-allowed text-gray-100'
                            }`}
                            disabled={!firebaseUser}
                        >
                            Create the first update
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdatesPage;
