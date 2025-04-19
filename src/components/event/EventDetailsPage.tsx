import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AiOutlineLoading3Quarters, AiOutlineHeart, AiOutlineShareAlt, AiFillHeart, AiOutlineCalendar } from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { IoMdArrowBack } from 'react-icons/io';
import { BsCalendarEvent } from 'react-icons/bs';
import { FiClock, FiUsers, FiMail, FiPhone } from 'react-icons/fi';
import { ImageDisplay } from '../../components/AWS/UploadFile';
import { Timestamp } from 'firebase/firestore';
import MapContainer from '../MapContainer';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';

interface Event {
    id?: string;
    title: string;
    description: string;
    eventType: 'cultural' | 'technical' | 'sports' | 'workshop' | 'seminar' | 'other';
    organizerDetails: {
        name: string;
        contact: string;
        email: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        address: string;
    };
    timingInfo: {
        date: string;
        time: string;
        duration: string;
    };
    isRegistrationRequired: boolean;
    registrationLink?: string;
    images?: string[];
    bannerImageIndex?: number;
    visibilityRadius: string | number;
    createdAt: Timestamp;
    userId: string;
    responders?: {
        title: string;
        useProfileLocation: boolean;
        users?: string[]; // Array of user IDs who have RSVPed
    };
}

const EventDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEventDetails] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [isRSVPed, setIsRSVPed] = useState(false);
    const [isRSVPing, setIsRSVPing] = useState(false);
    console.log(event);
    

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                setLoading(true);
                if (!id) return;

                const eventDoc = await getDoc(doc(db, 'events', id));
                
                if (eventDoc.exists()) {
                    const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;
                    setEventDetails(eventData);
                    
                    // Check if user has RSVPed
                    if (firebaseUser && eventData.responders?.users) {
                        setIsRSVPed(eventData.responders.users.includes(firebaseUser.uid));
                    }
                    
                    // Check if user has saved this event
                    if (firebaseUser) {
                        const userDoc = await getDoc(doc(db, 'Users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setIsSaved(userData.savedEvents?.includes(id) || false);
                        }
                    }
                } else {
                    setError("Event not found");
                }
            } catch (error) {
                console.error("Error fetching event:", error);
                setError("Error loading event details");
            } finally {
                setLoading(false);
            }
        };

        fetchEventData();
    }, [id, firebaseUser]);
    
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Unknown date';
        
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const navigateImage = (direction: 'next' | 'prev') => {
        if (!event?.images || event.images.length <= 1) return;

        if (direction === 'next') {
            setCurrentImageIndex((prev) => (prev + 1) % event.images!.length);
        } else {
            setCurrentImageIndex((prev) => (prev - 1 + event.images!.length) % event.images!.length);
        }
    };

    const handleSaveEvent = async () => {
        if (!firebaseUser || !id) {
            toast.error('Please log in to save events.', { position: 'top-center' });
            return;
        }

        try {
            setSaveLoading(true);
            const userRef = doc(db, 'Users', firebaseUser.uid);

            if (isSaved) {
                await updateDoc(userRef, {
                    savedEvents: arrayRemove(id)
                });
                setIsSaved(false);
                toast.success("Event removed from saved items", { position: 'top-center' });
            } else {
                await updateDoc(userRef, {
                    savedEvents: arrayUnion(id)
                });
                setIsSaved(true);
                toast.success("Event saved successfully", { position: 'top-center' });
            }
        } catch (error) {
            console.error('Error updating saved events:', error);
            toast.error("Failed to update saved events", { position: 'top-center' });
        } finally {
            setSaveLoading(false);
        }
    };

    const handleShareEvent = async () => {
        try {
            const eventUrl = window.location.href;
            await navigator.clipboard.writeText(eventUrl);
            toast.success('Event link copied to clipboard!', { position: 'top-center' });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error('Failed to copy link', { position: 'top-center' });
        }
    };

    const handleRSVP = async () => {
        if (!firebaseUser) {
            toast.error("Please log in to RSVP for this event", { position: 'top-center' });
            return;
        }

        if (!event?.id) return;

        try {
            setIsRSVPing(true);
            const eventRef = doc(db, 'events', event.id);
            
            if (isRSVPed) {
                // Remove user from responders
                await updateDoc(eventRef, {
                    "responders.users": arrayRemove(firebaseUser.uid)
                });
                setIsRSVPed(false);
                toast.success("You are no longer attending this event", { position: 'top-center' });
            } else {
                // Add user to responders
                await updateDoc(eventRef, {
                    "responders.users": arrayUnion(firebaseUser.uid)
                });
                setIsRSVPed(true);
                toast.success("You are now attending this event", { position: 'top-center' });
            }
        } catch (error) {
            console.error("Error updating RSVP status:", error);
            toast.error("Failed to update RSVP status", { position: 'top-center' });
        } finally {
            setIsRSVPing(false);
        }
    };

    const handleContactOrganizer = () => {
        if (!event?.organizerDetails?.email) {
            toast.error("No contact information available", { position: 'top-center' });
            return;
        }
        
        window.location.href = `mailto:${event.organizerDetails.email}?subject=Regarding: ${event.title}`;
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <AiOutlineLoading3Quarters size={60} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error || "Event not available"}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-10 p-2 bg-white/70 dark:bg-gray-800/70 rounded-full"
            >
                <IoMdArrowBack className="text-xl" />
            </button>

            {/* Image Gallery */}
            <div className="relative w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700">
                {event.images && event.images.length > 0 ? (
                    <>
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <ImageDisplay objectKey={event.images[currentImageIndex]} />
                        </div>

                        {/* Image navigation dots */}
                        {event.images.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {event.images.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                                        onClick={() => setCurrentImageIndex(i)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Image navigation arrows */}
                        {event.images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/40 dark:bg-gray-800/40 rounded-full"
                                    onClick={() => navigateImage('prev')}
                                >
                                    &lt;
                                </button>
                                <button
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white/40 dark:bg-gray-800/40 rounded-full"
                                    onClick={() => navigateImage('next')}
                                >
                                    &gt;
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BsCalendarEvent size={60} className="text-gray-400 dark:text-gray-500" />
                    </div>
                )}
            </div>

            {/* Event details card */}
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl -mt-8 relative z-10 p-5 shadow-sm min-h-[calc(100vh-16rem)]">
                {/* Title and event type */}
                <div className="mb-4">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{event.title}</h1>
                    </div>

                    {/* Event type and RSVP count */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                            {event.eventType}
                        </span>

                        {event.isRegistrationRequired && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200">
                                Registration Required
                            </span>
                        )}

                        {event.responders?.users && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200">
                                {event.responders.users.length} {event.responders.users.length === 1 ? 'person' : 'people'} attending
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6 text-gray-700 dark:text-gray-300">
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p>{event.description}</p>
                </div>

                {/* Event Timing */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Event Details</h2>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <AiOutlineCalendar className="mr-2 text-gray-500 dark:text-gray-400" />
                            <p className="text-gray-700 dark:text-gray-300">{formatDate(event.timingInfo.date)}</p>
                        </div>
                        <div className="flex items-center">
                            <FiClock className="mr-2 text-gray-500 dark:text-gray-400" />
                            <p className="text-gray-700 dark:text-gray-300">{event.timingInfo.time} ({event.timingInfo.duration})</p>
                        </div>
                    </div>
                </div>

                {/* Location */}
                {event.location && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Location</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">{event.location.address}</p>
                        <div className="h-60 rounded-lg overflow-hidden">
                            <MapContainer 
                                center={[event.location.latitude, event.location.longitude]}
                                zoom={15}
                                scrollWheelZoom={false}
                            />
                        </div>
                    </div>
                )}

                {/* Organizer details */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Organizer Details</h2>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <FiUsers className="mr-2 text-gray-500 dark:text-gray-400" />
                            <p className="text-gray-700 dark:text-gray-300">{event.organizerDetails.name}</p>
                        </div>
                        {event.organizerDetails.email && (
                            <div className="flex items-center">
                                <FiMail className="mr-2 text-gray-500 dark:text-gray-400" />
                                <p className="text-gray-700 dark:text-gray-300">{event.organizerDetails.email}</p>
                            </div>
                        )}
                        {event.organizerDetails.contact && (
                            <div className="flex items-center">
                                <FiPhone className="mr-2 text-gray-500 dark:text-gray-400" />
                                <p className="text-gray-700 dark:text-gray-300">{event.organizerDetails.contact}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Registration Link */}
                {event.isRegistrationRequired && event.registrationLink && (
                    <div className="mb-6">
                        <a 
                            href={event.registrationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            Register for Event
                        </a>
                    </div>
                )}

                {/* Action buttons */}
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
                    <div className="flex justify-between mb-3">
                        <button
                            onClick={handleSaveEvent}
                            disabled={!firebaseUser || saveLoading}
                            className={`flex items-center ${!firebaseUser ? 'opacity-50 cursor-not-allowed' :
                                isSaved ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                                } transition-colors`}
                        >
                            {saveLoading ? (
                                <AiOutlineLoading3Quarters className="animate-spin mr-1" />
                            ) : isSaved ? (
                                <AiFillHeart className="mr-1" />
                            ) : (
                                <AiOutlineHeart className="mr-1" />
                            )}
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                        <button
                            onClick={handleShareEvent}
                            className="flex items-center text-gray-500 dark:text-gray-400"
                        >
                            <AiOutlineShareAlt className="mr-1" /> Share
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleRSVP}
                            disabled={isRSVPing || !firebaseUser}
                            className={`flex-1 py-3 ${
                                !firebaseUser ? 'bg-gray-400 cursor-not-allowed' :
                                isRSVPed ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                            } text-white rounded-lg flex items-center justify-center font-medium`}
                        >
                            {isRSVPing ? 'Processing...' : isRSVPed ? 'Cancel RSVP' : 'RSVP'}
                        </button>
                        
                        <button
                            onClick={handleContactOrganizer}
                            className={`flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center font-medium`}
                        >
                            <BiMessageDetail className="mr-2" /> Contact Organizer
                        </button>
                    </div>
                </div>

                {/* Spacer for fixed bottom bar */}
                <div className="h-32"></div>
            </div>
        </div>
    );
};

export default EventDetailsPage;
