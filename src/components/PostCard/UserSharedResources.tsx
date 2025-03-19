import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import SharedResourceList from "../PostCard/SharedResourceList ";
import { IoMdAdd } from "react-icons/io";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SharedResource {
    id: string;
    category: string;
    createdAt: any;
    description: string;
    location: string;
    photoUrl: string;
    resourceName: string;
    condition: string;
    userId: string;
    type: string;
}

function UserSharedResources() {
    const [resources, setResources] = useState<SharedResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [updated, setUpdated] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Set up auth state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                // Redirect to login if not authenticated
                window.location.href = "/login";
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserResources = async () => {
            if (!currentUserId) return;

            try {
                setLoading(true);
                setError(null);

                // Query shared resources collection without ordering
                const resourcesQuery = query(
                    collection(db, "sharedResources"),
                    where("userId", "==", currentUserId)
                );

                const resourcesSnapshot = await getDocs(resourcesQuery);

                const resourcesData = resourcesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    type: "resource",
                })) as SharedResource[];

                // Sort locally instead of in the query
                resourcesData.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis?.() || 0;
                    const timeB = b.createdAt?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                setResources(resourcesData);
            } catch (error) {
                console.error("Error fetching user resources: ", error);
                setError("Failed to load your shared resources. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserResources();
    }, [currentUserId, updated]);

    // Handle the indexing error with guidance
    const renderIndexingError = () => (
        <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        Your Firestore database needs an index for this query. Please create an index for the "sharedResources" collection with fields "userId" and "createdAt".
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-neutral-800 p-4">

            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Shared Resources</h1>
                <div className="flex gap-2 justify-start mb-3 items-center hover:cursor-pointer text-blue-600 dark:text-blue-400"
                    onClick={() => navigate('/')}
                ><FaArrowLeft /> Back</div>

                {error && renderIndexingError()}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <AiOutlineLoading3Quarters size={60} className="animate-spin text-blue-500" />
                    </div>
                ) : resources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="w-full p-3 ">
                            <div className="w-full h-full flex justify-center items-center bg-neutral-50 dark:bg-neutral-600 rounded-lg shadow p-4 md:p-6"
                                onClick={() => navigate('/resource/offer')}
                            >
                                <div className="w-56 h-56 rounded-full p-4 md:p-6 flex items-center justify-center border-4 border-dashed border-gray-300 dark:border-gray-300 text-gray-400 dark:text-gray-300">
                                    <IoMdAdd size={80} />
                                </div>
                            </div>
                        </div>
                        {resources.map((resource) => (
                            <SharedResourceList key={resource.id} resource={resource} setUpdated={setUpdated} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-8 text-center">
                        <p className="text-gray-700 dark:text-gray-300 text-lg">
                            You haven't shared any resources yet.
                        </p>
                        <button
                            onClick={() => navigate("/resource/offer")}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Share a Resource
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserSharedResources;