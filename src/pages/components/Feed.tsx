import { ImageDisplay } from '@/components/AWS/UploadFile';
import { db } from '@/firebase';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
export interface BaseItem {
    id?: string;
    createdAt: string;
    description: string;
    duration: string;
    title?: string;
    userId: string;
    visibilityRadius: string;
    images?: string[];
    type: 'resource' | 'promotion' | 'event' | 'update';
}

export interface Resource extends BaseItem {
    category: string;
}

export interface Promotion extends BaseItem {
    contactInfo: {
        contact: string;
        email: string;
        name: string;
        description: string;
    };
    responders: {
        title: string;
        useProfileLocation: boolean;
    };
}

export interface Event extends BaseItem {
    eventType: string;
    isRegistrationRequired: boolean;
    organizerDetails: {
        contact: string;
        email: string;
        name: string;
    };
    timingInfo: {
        date: string;
        duration: string;
        time: string;
    };
    responders: {
        title: string;
        useProfileLocation: boolean;
    };
}

export interface Update extends BaseItem {
    date: string;
    responders: {
        title: string;
        useProfileLocation: boolean;
    };
}

// Union type for items in feed
export type FeedItem = Resource | Promotion | Event | Update;

const convertDoc = <T extends BaseItem>(doc: any, type: FeedItem['type']): T => {
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

// const formatTimeSince = (timestamp: Timestamp) => {
//     const now = new Date();
//     const postDate = timestamp.toDate();
//     const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

//     if (diffInSeconds < 60) {
//       return `${diffInSeconds} sec ago`;
//     } else if (diffInSeconds < 3600) {
//       return `${Math.floor(diffInSeconds / 60)} min ago`;
//     } else if (diffInSeconds < 86400) {
//       return `${Math.floor(diffInSeconds / 3600)} hr ago`;
//     } else {
//       return `${Math.floor(diffInSeconds / 86400)} days ago`;
//     }
//   };


export const fetchResources = async (): Promise<Resource[]> => {
    const resourcesRef = collection(db, "resources");
    const q = query(resourcesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => convertDoc<Resource>(doc, 'resource'));
};

// Fetch all promotions
export const fetchPromotions = async (): Promise<Promotion[]> => {
    const promotionsRef = collection(db, "promotions");
    const q = query(promotionsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => convertDoc<Promotion>(doc, 'promotion'));
};

// Fetch all events
export const fetchEvents = async (): Promise<Event[]> => {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => convertDoc<Event>(doc, 'event'));
};

// Fetch all updates
export const fetchUpdates = async (): Promise<Update[]> => {
    const updatesRef = collection(db, "updates");
    const q = query(updatesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => convertDoc<Update>(doc, 'update'));
};

// Fetch all feed items from all collections
export const fetchAllFeedItems = async (): Promise<FeedItem[]> => {
    try {
        const [resources, promotions, events, updates] = await Promise.all([
            fetchResources(),
            fetchPromotions(),
            fetchEvents(),
            fetchUpdates()
        ]);

        // Combine all items and sort by createdAt (newest first)
        const allItems: FeedItem[] = [...resources, ...promotions, ...events, ...updates];

        return allItems.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    } catch (error) {
        console.error("Error fetching feed items:", error);
        throw error;
    }
};

// interface FeedProps {
//     // Add props here if needed
// }

const Feed: React.FC = () => {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadFeedItems = async () => {
            try {
                setLoading(true);
                const items = await fetchAllFeedItems();
                setFeedItems(items);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch feed items:', err);
                setError('Failed to load feed. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadFeedItems();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
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
        <div className="container w-full sm:w-[550px] mt-16 mx-auto px-4 py-8 bg-transparent">
            {/* <h1 className="text-3xl font-bold mb-6 dark:text-white">Your Feed</h1> */}

            <div className="space-y-4">
                {feedItems.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No feed items to display.</p>
                ) : (
                    feedItems.map((item) => {
                        switch (item.type) {
                            case 'resource':
                                return <ResourceCard key={item.id} resource={item as Resource} />;
                            case 'promotion':
                                return <PromotionCard key={item.id} promotion={item as Promotion} />;
                            case 'event':
                                return <EventCard key={item.id} event={item as Event} />;
                            case 'update':
                                return <UpdateCard key={item.id} update={item as Update} />;
                            default:
                                return null;
                        }
                    })
                )}
            </div>
        </div>
    );
};

export default Feed;



interface ResourceCardProps {
    resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = resource.images?.length || 0;
    const date = new Date(resource.createdAt).toLocaleDateString();

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-blue-500 overflow-hidden mb-4">
            {resource.images && resource.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {/* Images container with fade transition */}
                    {resource.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <div className="w-full h-full object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}

                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {resource.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* ... rest of the card content remains the same ... */}
            <div className="p-4">
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full mb-2">
                    Resource: {resource.category}
                </span>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{resource.title || 'Resource'}</h3>
                <p className="text-xs font-light text-gray-600 dark:text-gray-300 mt-1">{resource.description}</p>
                <div className="flex items-center mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Duration: {resource.duration}</span>
                </div>
                <div className="flex gap-2 items-center text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    <span>Posted: {date}</span>
                </div>
            </div>
        </div>
    );
};




interface PromotionCardProps {
    promotion: Promotion;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = promotion.images?.length || 0;
    const date = new Date(promotion.createdAt).toLocaleDateString();

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-purple-500 overflow-hidden mb-4">
            {promotion.images && promotion.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {/* Images container with fade transition */}
                    {promotion.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <div className="w-full h-full flex justify-center items-center object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}

                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {promotion.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="p-4">
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full mb-2">
                    Promotion
                </span>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    {promotion.responders?.title || 'Promotion'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {promotion.description}
                </p>
                <div className="mt-3 text-[10px]">
                    <p className="text-gray-700 dark:text-gray-300">
                        Contact: {promotion.contactInfo?.name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                        Email: {promotion.contactInfo?.email}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                        Phone: {promotion.contactInfo?.contact}
                    </p>
                    <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400">
                        <span>Posted: {date}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EventCardProps {
    event: Event;
}
const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = event.images?.length || 0;
    const createdDate = new Date(event.createdAt).toLocaleDateString();
    const eventDate = event.timingInfo?.date;

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-green-500 overflow-hidden mb-4">
            {event.images && event.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {/* Images container with fade transition */}
                    {event.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            <div className="w-full h-full flex justify-center items-center object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}

                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {event.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        Event: {event.eventType}
                    </span>
                    {event.isRegistrationRequired && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                            Registration Required
                        </span>
                    )}
                </div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{event.title || 'Event'}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                <div className="mt-3 text-[10px]">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>Date: {eventDate} - Time: {event.timingInfo?.time}</span>
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300 mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Duration: {event.timingInfo?.duration}</span>
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300 mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>Organizer: {event.organizerDetails?.name}</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 mt-2">Posted: {createdDate}</div>
                </div>
            </div>
        </div>
    );
};

interface UpdateCardProps {
    update: Update;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = update.images?.length || 0;
    const createdDate = new Date(update.createdAt).toLocaleDateString();
    const updateDate = update.date ? new Date(update.date).toLocaleDateString() : null;

    const handleNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    };

    const handlePrev = () => {
        setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-amber-500 overflow-hidden mb-4">
            {update.images && update.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {/* Images container with fade transition */}
                    {update.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            <div className="w-full h-full flex justify-center items-center object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}

                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {update.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="p-4">
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full mb-2">
                    Update
                </span>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{update.responders?.title || 'Update'}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{update.description}</p>
                <div className="mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                    {updateDate && <span>Update Date: {updateDate}</span>}
                    <div className="mt-1">Posted: {createdDate}</div>
                </div>
            </div>
        </div>
    );
};