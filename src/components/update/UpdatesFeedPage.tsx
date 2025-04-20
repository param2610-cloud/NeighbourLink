import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { UpdateWithUserData } from '@/interface/main';
    import { AiOutlinePlus } from 'react-icons/ai';
import { FaArrowLeft } from 'react-icons/fa';
import { GiHamburgerMenu } from "react-icons/gi";
import { useNavigate } from 'react-router-dom';
import UpdateCard from './UpdateCard';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import { Skeleton } from '../ui/skeleton';
import Sidebar from "../authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { useMobileContext } from '@/contexts/MobileContext';

const UpdatesPage: React.FC = () => {
    const [updates, setUpdates] = useState<UpdateWithUserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { isMobile } = useMobileContext();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    async function handleLogout() {
        try {
            await auth.signOut();
            window.location.href = "/login";
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error logging out:", error.message);
            }
        }
    }

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
                
                const updatesQuery = query(
                    collection(db, 'updates'),
                    where('parentId', '==', null),
                    orderBy('createdAt', 'desc')
                );
                
                console.log("Executing updates query...");
                const updatesSnapshot = await getDocs(updatesQuery);
                console.log(updatesSnapshot.docs);
                console.log(`Found ${updatesSnapshot.size} top-level updates`);
                const updatesData: UpdateWithUserData[] = [];
                
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
                    
                    console.log(`Counting replies for update ${updateDoc.id}`);
                    const replyCountQuery = query(
                        collection(db, 'updates'),
                        where('parentId', '==', updateDoc.id)
                    );
                    const replyCountSnapshot = await getDocs(replyCountQuery);
                    updateData.replyCount = replyCountSnapshot.size;
                    console.log(`Found ${replyCountSnapshot.size} replies for update ${updateDoc.id}`);
                    
                    updatesData.push(updateData);
                    return updateData;
                });
                
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
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
                <div
                    className={`fixed inset-y-0 left-0 w-64 transform ${
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0 transition-transform duration-300 z-100`}
                >
                    <Sidebar
                        handleLogout={handleLogout}
                        isSidebarOpen={isSidebarOpen}
                    />
                </div>
                
                <div className="md:ml-64">
                    <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-md">
                        <div className="flex items-center justify-between p-4">
                            <div
                                className="flex items-center space-x-2 cursor-pointer"
                                onClick={toggleSidebar}
                            >
                                <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
                            </div>

                            <div className="flex items-center">
                                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                                    Neighbour
                                </h1>
                                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                                Link
                                </h1>
                                <span className="mx-2 text-blue-500 dark:text-gray-400">
                                    |
                                </span>
                                <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                                    Updates
                                </h2>
                            </div>

                            <div className="opacity-0 w-8 h-8">
                                {/* Empty div for layout balance */}
                            </div>
                        </div>
                    </div>

                    <div className="py-8 px-4 sm:px-6 lg:px-8 pb-24">
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
                    
                    {isMobile && <Bottombar />}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
                <div
                    className={`fixed inset-y-0 left-0 w-64 transform ${
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0 transition-transform duration-300 z-100`}
                >
                    <Sidebar
                        handleLogout={handleLogout}
                        isSidebarOpen={isSidebarOpen}
                    />
                </div>
                
                <div className="md:ml-64 flex flex-col items-center justify-center p-4 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">{error}</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Go Back
                    </button>
                </div>
                
                {isMobile && <Bottombar />}
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            <div
                className={`fixed inset-y-0 left-0 w-64 transform ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 transition-transform duration-300 z-100`}
            >
                <Sidebar
                    handleLogout={handleLogout}
                    isSidebarOpen={isSidebarOpen}
                />
            </div>

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-transparent z-30 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            <div className="md:ml-64">
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
                    <div className="flex items-center justify-between p-4">
                        <div
                            className="flex items-center space-x-2 cursor-pointer"
                            onClick={toggleSidebar}
                        >
                            <GiHamburgerMenu className="text-2xl text-gray-700 dark:text-gray-200" />
                        </div>

                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-600">
                                Neighbour
                            </h1>
                            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-700">
                            Link
                            </h1>
                            <span className="mx-2 text-blue-500 dark:text-gray-400">
                                |
                            </span>
                            <h2 className="text-xl font-bold text-green-600 dark:text-green-600">
                                Updates
                            </h2>
                        </div>

                        <div className="opacity-0 w-8 h-8">
                            {/* Empty div for layout balance */}
                        </div>
                    </div>
                </div>

                <div className="py-8 px-4 sm:px-6 lg:px-8 pb-24">
                    <div className="max-w-3xl mx-auto">
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
                
                {isMobile && <Bottombar />}
            </div>
        </div>
    );
};

export default UpdatesPage;
