import { auth, db } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ResourceCard, PromotionCard, EventCard, UpdateCard, Resource, Promotion, Event, Update } from './components/Feed';
import { FeedItem } from './components/Feed';
import { FloatingActionMenu } from './Home';
import { Skeleton } from '@/components/ui/skeleton';

// Reuse the convertDoc function from your Feed component
const convertDoc = <T extends FeedItem>(doc: any, type: FeedItem['type']): T => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        type,
        createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt
    } as T;
};

// User-specific fetch functions
const fetchUserResources = async (userId: string): Promise<Resource[]> => {
    console.debug('📊 Fetching resources for user:', userId);
    const resourcesRef = collection(db, "resources");
    const q = query(resourcesRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.map(doc => convertDoc<Resource>(doc, 'resource'));
    console.debug('📊 Found resources:', resources.length);
    return resources;
};

const fetchUserPromotions = async (userId: string): Promise<Promotion[]> => {
    console.debug('📊 Fetching promotions for user:', userId);
    const promotionsRef = collection(db, "promotions");
    const q = query(promotionsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const promotions = querySnapshot.docs.map(doc => convertDoc<Promotion>(doc, 'promotion'));
    console.debug('📊 Found promotions:', promotions.length);
    return promotions;
};

const fetchUserEvents = async (userId: string): Promise<Event[]> => {
    console.debug('📊 Fetching events for user:', userId);
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => convertDoc<Event>(doc, 'event'));
    console.debug('📊 Found events:', events.length);
    return events;
};

const fetchUserUpdates = async (userId: string): Promise<Update[]> => {
    console.debug('📊 Fetching updates for user:', userId);
    const updatesRef = collection(db, "updates");
    const q = query(updatesRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const updates = querySnapshot.docs.map(doc => convertDoc<Update>(doc, 'update'));
    console.debug('📊 Found updates:', updates.length);
    return updates;
};

const fetchAllUserFeedItems = async (userId: string): Promise<FeedItem[]> => {
    console.debug('🔄 Starting to fetch all feed items for user:', userId);
    try {
        const startTime = performance.now();
        const [resources, promotions, events, updates] = await Promise.all([
            fetchUserResources(userId),
            fetchUserPromotions(userId),
            fetchUserEvents(userId),
            fetchUserUpdates(userId)
        ]);

        const allItems: FeedItem[] = [...resources, ...promotions, ...events, ...updates];
        const sortedItems = allItems.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const endTime = performance.now();
        console.debug('✅ Fetch completed in', (endTime - startTime).toFixed(2), 'ms');
        console.debug('📊 Total items:', sortedItems.length, {
            resources: resources.length,
            promotions: promotions.length,
            events: events.length,
            updates: updates.length
        });

        return sortedItems;
    } catch (error) {
        console.error("❌ Error fetching user feed items:", error);
        throw error;
    }
};

// Reuse your existing Card components from Feed


const AuthPosts: React.FC = () => {
    console.debug('🔄 Rendering AuthPosts component');
    const user = auth.currentUser;
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const openModal = (type?: 'resource' | 'promotion' | 'event' | 'update') => {
        // Handle modal opening logic here
        console.log('Opening modal for type:', type);
    };

    const handleDeleteItem = async (id: string, type: FeedItem['type']) => {
        console.debug('🗑️ Attempting to delete item:', { id, type });
        try {
            let collectionName: string;
            switch (type) {
                case 'resource': collectionName = 'resources'; break;
                case 'promotion': collectionName = 'promotions'; break;
                case 'event': collectionName = 'events'; break;
                case 'update': collectionName = 'updates'; break;
                default: return;
            }
            await deleteDoc(doc(db, collectionName, id));
            console.debug('✅ Item deleted successfully');
            setFeedItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('❌ Error deleting item:', error);
        }
    };

    useEffect(() => {
        const loadUserPosts = async () => {
            try {
                setLoading(true);
                if (!user) {
                    throw new Error('User not authenticated');
                }
                const items = await fetchAllUserFeedItems(user.uid);
                setFeedItems(items);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch user posts:', err);
                setError(err instanceof Error ? err.message : 'Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        loadUserPosts();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8 max-w-md">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                        Authentication Required
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Please sign in to view your posts.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container w-full mt-16 mx-auto px-4 py-8">
                <div className="mb-8 text-center space-y-3">
                    <div className="h-8 w-48 mx-auto">
                        <Skeleton  className="h-full w-full" />
                    </div>
                    <div className="h-4 w-32 mx-auto">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="space-y-3">
                            <Skeleton className="h-[200px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[80%]" />
                                <Skeleton className="h-4 w-[60%]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div className="container w-full mt-16 mx-auto px-4 py-8 bg-transparent">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    My Posts
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {feedItems.length} posts created
                </p>
            </div>

            <div className="space-y-4">
                {feedItems.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                            You haven't created any posts yet.
                        </p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        {/* <div className=''> */}

                            {
                                feedItems.map((item) => {
                                    switch (item.type) {
                                        case 'resource':
                                            return <ResourceCard key={item.id} resource={item as Resource} onDelete={handleDeleteItem} />;
                                        case 'promotion':
                                            return <PromotionCard key={item.id} promotion={item as Promotion} onDelete={handleDeleteItem} />;
                                        case 'event':
                                            return <EventCard key={item.id} event={item as Event} onDelete={handleDeleteItem} />;
                                        case 'update':
                                            return <UpdateCard key={item.id} update={item as Update} onDelete={handleDeleteItem} />;
                                        default:
                                    }
                                })
                            }
                        {/* </div> */}
                    </div>
                )}
            </div>
            <FloatingActionMenu openModal={openModal} />

        </div>
    );
};

export default AuthPosts;