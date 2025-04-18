import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string;
}

interface PostRespondersProps {
    postId: string;
    onSelectResponder: (responder: UserData, postTitle: string) => void;
    postTitle: string;
}

const PostResponders: React.FC<PostRespondersProps> = ({ postId, onSelectResponder, postTitle }) => {
    const [responders, setResponders] = useState<UserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResponders = async () => {
            try {
                setLoading(true);
                // Query the responses collection for this post
                const responsesQuery = query(collection(db, "responses"), where("postId", "==", postId));
                const responseSnapshots = await getDocs(responsesQuery);
                
                const respondersData: UserData[] = [];
                
                // For each response, get the user details
                for (const responseDoc of responseSnapshots.docs) {
                    const responseData = responseDoc.data();
                    const userId = responseData.userId;
                    
                    // Get user details from the users collection
                    const userDoc = await getDocs(query(collection(db, "Users"), where("id", "==", userId)));
                    
                    if (!userDoc.empty) {
                        const userData = userDoc.docs[0].data() as UserData;
                        respondersData.push({
                            id: userId,
                            firstName: userData.firstName || 'Unknown',
                            lastName: userData.lastName  || '',
                            email: userData.email,
                            photoURL: userData.photoURL
                        });
                    }
                }
                
                setResponders(respondersData);
            } catch (err) {
                console.error("Error fetching responders:", err);
                setError("Failed to load responders");
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchResponders();
        }
    }, [postId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <AiOutlineLoading3Quarters className="animate-spin text-indigo-600" size={24} />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center p-2">{error}</div>;
    }

    if (responders.length === 0) {
        return <div className="text-gray-500 text-center p-2">No responders yet</div>;
    }

    return (
        <div className="space-y-3 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">People Interested</h3>
            {responders.map((responder) => (
                <div 
                    key={responder.id}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => onSelectResponder(responder, postTitle)}
                >
                    <img 
                        src={responder.photoURL || "/assets/pictures/blue-circle-with-white-user_78370-4707.avif"} 
                        alt={`${responder.firstName}'s profile`}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                            {responder.firstName} {responder.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {responder.email}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PostResponders;
