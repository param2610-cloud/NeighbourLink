import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Update } from "@/pages/components/Feed";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { MdVerified } from "react-icons/md";
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";

// Utility: robustly parse various Firestore/JS date shapes to a Date or null
function parseToDate(value: any): Date | null {
    if (!value && value !== 0) return null;

    // Firestore Timestamp instance (has toDate)
    if (value && typeof value.toDate === 'function') {
        try { return value.toDate(); } catch { return null; }
    }

    // Object with seconds/nanoseconds (Firestore-like)
    if (value && typeof value === 'object' && typeof value.seconds === 'number') {
        try {
            const ms = value.seconds * 1000 + (value.nanoseconds ? Math.floor(value.nanoseconds / 1e6) : 0);
            return new Date(ms);
        } catch { return null; }
    }

    // number (seconds or milliseconds)
    if (typeof value === 'number') {
        // if looks like seconds (<= 1e10), treat as seconds
        if (value <= 1e10) return new Date(value * 1000);
        return new Date(value);
    }

    // numeric string
    if (typeof value === 'string' && /^\d+$/.test(value)) {
        try {
            if (value.length <= 10) return new Date(Number(value) * 1000);
            return new Date(Number(value));
        } catch { /* fallthrough */ }
    }

    // ISO or other date string
    if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    // Date instance
    if (value instanceof Date) return value;

    return null;
}

interface StoryItem extends Update {
    userName: string;
    userPhoto: string;
    isVerified?: boolean;
}

interface UserStoryGroup {
    userId: string;
    userName: string;
    userPhoto: string;
    isVerified: boolean;
    stories: StoryItem[];
}

interface StoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userGroups: UserStoryGroup[];
    initialUserIndex: number;
}

const StoriesModal: React.FC<StoriesModalProps> = ({
    isOpen,
    onClose,
    userGroups,
    initialUserIndex
}) => {
    const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const currentUserGroup = userGroups[currentUserIndex];
    const currentStory = currentUserGroup?.stories[currentStoryIndex];

    useEffect(() => {
        if (!isOpen || isPaused) return;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    // Move to next story within the current user's stories
                    if (currentStoryIndex < currentUserGroup.stories.length - 1) {
                        setCurrentStoryIndex(currentStoryIndex + 1);
                        return 0;
                    } else {
                        // Move to next user's stories
                        if (currentUserIndex < userGroups.length - 1) {
                            setCurrentUserIndex(currentUserIndex + 1);
                            setCurrentStoryIndex(0);
                            return 0;
                        } else {
                            // End of all stories - close modal instead of looping
                            onClose();
                            return prev;
                        }
                    }
                }
                return prev + 1;
            });
        }, 50); // 5 seconds total (100 * 50ms)

        return () => clearInterval(timer);
    }, [isOpen, isPaused, currentUserIndex, currentStoryIndex, userGroups.length, currentUserGroup?.stories.length, onClose]);

    useEffect(() => {
        if (isOpen) {
            // Reset to the correct user when modal opens
            setCurrentUserIndex(initialUserIndex);
            setCurrentStoryIndex(0);
            setProgress(0);
        }
    }, [isOpen, initialUserIndex]);

    useEffect(() => {
        setProgress(0);
    }, [currentUserIndex, currentStoryIndex]);

    const goToNext = () => {
        if (currentStoryIndex < currentUserGroup.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            setProgress(0);
        } else if (currentUserIndex < userGroups.length - 1) {
            setCurrentUserIndex(currentUserIndex + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        } else {
            // End of all stories - close modal instead of looping
            onClose();
        }
    };

    const goToPrevious = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
            setProgress(0);
        } else if (currentUserIndex > 0) {
            setCurrentUserIndex(currentUserIndex - 1);
            setCurrentStoryIndex(userGroups[currentUserIndex - 1].stories.length - 1);
            setProgress(0);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                goToNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPrevious();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, currentUserIndex, currentStoryIndex, userGroups.length, currentUserGroup?.stories.length, onClose]);

    if (!isOpen || !currentStory || !currentUserGroup) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black"
            onClick={onClose}
        >
            {/* Progress bars */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-1 w-80 max-w-sm">
                {currentUserGroup.stories.map((_, index) => (
                    <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-100"
                            style={{
                                width: index < currentStoryIndex
                                    ? '100%'
                                    : index === currentStoryIndex
                                        ? `${progress}%`
                                        : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-between text-white w-80 max-w-sm px-4 bg-black/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                        {currentUserGroup.userPhoto ? (
                            <ImageDisplay publicId={currentUserGroup.userPhoto} className="w-full h-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs">
                                {currentUserGroup.userName?.[0]?.toUpperCase() || "?"}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">{currentUserGroup.userName}</h3>
                        <p className="text-xs text-gray-300">
                            {(() => {
                                const d = parseToDate(currentStory.createdAt);
                                return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time';
                            })()}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2">
                    <X size={20} />
                </button>
            </div>

            {/* Story content container - Instagram style */}
            <div className="h-full flex items-center justify-center">
                {/* Story content - Instagram mobile size */}
                <div
                    className="relative w-80 max-w-sm mx-auto bg-gray-900/50 rounded-lg overflow-hidden shadow-2xl"
                    style={{ height: 'min(85vh, 600px)' }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Navigation areas inside the story container */}
                    <div
                        className="absolute left-0 top-0 w-1/2 h-full z-20 cursor-pointer flex items-center justify-start pl-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevious();
                        }}
                    >
                        {/* Show left arrow if there are previous stories */}
                        {(currentUserIndex > 0 || currentStoryIndex > 0) && (
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all">
                                <ChevronLeft size={18} className="text-white" />
                            </div>
                        )}
                    </div>

                    <div
                        className="absolute right-0 top-0 w-1/2 h-full z-20 cursor-pointer flex items-center justify-end pr-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                    >
                        {/* Show right arrow if there are next stories */}
                        {(currentUserIndex < userGroups.length - 1 || currentStoryIndex < currentUserGroup.stories.length - 1) && (
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all">
                                <ChevronRight size={18} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* Story content */}
                    {currentStory.images && currentStory.images.length > 0 ? (
                        <div className="w-full h-full relative">
                            <ImageDisplay
                                publicId={currentStory.images[0]}
                                className="w-full h-full object-cover"
                            />
                            {/* Text overlay for image stories */}
                            {(currentStory.title || currentStory.description) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 p-4 z-10">
                                    {currentStory.title && (
                                        <h2 className="text-lg font-bold mb-2 text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)' }}>{currentStory.title}</h2>
                                    )}
                                    {currentStory.description && (
                                        <p className="text-gray-200 text-sm" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)' }}>{currentStory.description}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Text-only story */
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-6">
                            <div className="text-center text-white">
                                {currentStory.title && (
                                    <h2 className="text-xl font-bold mb-4">{currentStory.title}</h2>
                                )}
                                {currentStory.description && (
                                    <p className="text-base leading-relaxed">{currentStory.description}</p>
                                )}
                                <div className="mt-4 text-xs opacity-80">
                                    <p>{(() => {
                                        const d = parseToDate(currentStory.createdAt);
                                        return d ? d.toLocaleDateString() : 'Unknown date';
                                    })()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User indicator at bottom center */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-30">
                        {/* Story dots */}
                        {currentUserGroup.stories.length > 1 && (
                            <div className="flex gap-1">
                                {currentUserGroup.stories.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-all ${index === currentStoryIndex ? 'bg-white' : 'bg-white/40'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* User counter */}
                        {userGroups.length > 1 && (
                            <div className="text-white text-xs bg-black/50 px-2 py-1 rounded-full ml-2">
                                {currentUserIndex + 1}/{userGroups.length}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const Stories: React.FC<{ onStoryOpen?: () => void }> = ({ onStoryOpen }) => {
    const [userGroups, setUserGroups] = useState<UserStoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUserIndex, setSelectedUserIndex] = useState(0);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                setLoading(true);
                console.log("Fetching stories from updates collection...");

                const updatesRef = collection(db, "updates");
                const q = query(updatesRef, orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);

                console.log("Found updates docs:", querySnapshot.docs.length);

                const storiesWithUser = await Promise.all(
                    querySnapshot.docs.map(async (document) => {
                        const data = document.data();
                        console.log("Update document data:", data);

                        // Normalize createdAt to ISO string (handles Firestore Timestamp, Date, seconds object or string)
                        const rawCreated = data.createdAt;
                        let createdIso = '';
                        if (rawCreated && typeof rawCreated.toDate === 'function') {
                            createdIso = rawCreated.toDate().toISOString();
                        } else if (rawCreated && typeof rawCreated.seconds === 'number') {
                            createdIso = new Date(rawCreated.seconds * 1000).toISOString();
                        } else if (typeof rawCreated === 'string') {
                            createdIso = rawCreated;
                        } else if (rawCreated instanceof Date) {
                            createdIso = rawCreated.toISOString();
                        } else {
                            createdIso = new Date().toISOString();
                        }

                        const story = {
                            id: document.id,
                            ...data,
                            type: "update",
                            createdAt: createdIso,
                        } as Update;

                        // Fetch user data
                        let userName = "Anonymous";
                        let userPhoto = "/assets/base-img.jpg";
                        let isVerified = false;

                        if (story.userId) {
                            try {
                                const userDoc = await getDoc(doc(db, "Users", story.userId));
                                if (userDoc.exists()) {
                                    const userData = userDoc.data();
                                    userName = userData.firstName
                                        ? `${userData.firstName} ${userData.lastName}`
                                        : userData.displayName || "User";
                                    userPhoto = userData.photo || "/assets/base-img.jpg";
                                    isVerified = userData.isVerified || false;
                                }
                            } catch (error) {
                                console.error("Error fetching user data:", error);
                            }
                        }

                        return {
                            ...story,
                            userName,
                            userPhoto,
                            isVerified,
                        } as StoryItem;
                    })
                );

                console.log("Processed stories:", storiesWithUser);

                // Filter only recent stories (last 24 hours)
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                const recentStories = storiesWithUser.filter(story => {
                    const storyDate = new Date(story.createdAt);
                    return storyDate > oneDayAgo;
                });

                console.log("Recent stories (last 24h):", recentStories);

                // If no recent stories, show all stories for testing
                const storiesToGroup = recentStories.length === 0 ? storiesWithUser : recentStories;

                // Group stories by user
                const groupedStories = storiesToGroup.reduce((groups, story) => {
                    const existingGroup = groups.find(group => group.userId === story.userId);

                    if (existingGroup) {
                        existingGroup.stories.push(story);
                    } else {
                        groups.push({
                            userId: story.userId,
                            userName: story.userName,
                            userPhoto: story.userPhoto,
                            isVerified: story.isVerified || false,
                            stories: [story]
                        });
                    }

                    return groups;
                }, [] as UserStoryGroup[]);

                console.log("Grouped stories by user:", groupedStories);
                setUserGroups(groupedStories);
            } catch (error) {
                console.error("Error fetching stories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, []);

    const openStory = (userIndex: number) => {
        setSelectedUserIndex(userIndex);
        setModalOpen(true);
        onStoryOpen?.(); // Close sidebar when story opens
    };

    if (loading) {
        return (
            <div className="px-4 py-3 bg-white dark:bg-gray-900">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                            <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (userGroups.length === 0) {
        return null;
    }

    return (
        <>
            <div className="px-14 py-3 bg-white dark:bg-gray-900 ">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                    {userGroups.map((userGroup, index) => (
                        <motion.div
                            key={userGroup.userId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer"
                            onClick={() => openStory(index)}
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 p-0.5">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5 overflow-hidden">
                                        {userGroup.userPhoto ? (
                                            <ImageDisplay publicId={userGroup.userPhoto} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300 text-sm font-semibold">
                                                {userGroup.userName?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {userGroup.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <MdVerified size={12} className="text-white" />
                                    </div>
                                )}
                                {/* Story count indicator */}
                                {userGroup.stories.length > 1 && (
                                    <div className="absolute top-0 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {userGroup.stories.length}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 text-center max-w-[70px] truncate">
                                {userGroup.userName.split(' ')[0]}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <StoriesModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                userGroups={userGroups}
                initialUserIndex={selectedUserIndex}
            />
        </>
    );
};

export default Stories;
