import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '@/contexts/StateContext';
import { calculateDistance } from '@/utils/utils';
import { getPreSignedUrl } from '@/utils/aws/aws';
import Bottombar from '@/components/authPage/structures/Bottombar';
import EventDetailsPanel from '@/components/events/EventDetailsPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { GiHamburgerMenu } from "react-icons/gi";
import Sidebar from "../components/authPage/structures/Sidebar";
import { useMobileContext } from '@/contexts/MobileContext';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  isRegistrationRequired: boolean;
  organizerDetails: {
    name: string;
    contact: string;
    email: string;
  };
  timingInfo: {
    date: string;
    time: string;
    duration: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images?: string[];
  responders: {
    users?: string[];
  };
  createdAt: any;
  registrationLink?: string;
}

const EventsPage = () => {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const { user } = useStateContext();
  const navigate = useNavigate();
  const {isMobile} = useMobileContext()

  // States for the event details panel
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  // State for the sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Get user's profile and location data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'Users', user.uid));
        if (userDoc.exists() && userDoc.data().location) {
          const location = userDoc.data().location;
          setUserLocation({
            lat: location.latitude,
            lng: location.longitude,
          });
        } else {
          // Fallback to geolocation API
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setUserLocation({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              },
              (error) => {
                console.error('Error getting location:', error);
              }
            );
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch events from Firestore
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const allEvents: Event[] = [];

        // Process events and images
        for (const doc of querySnapshot.docs) {
          const eventData = { id: doc.id, ...doc.data() } as Event;

          // Process images if they exist
          if (eventData.images && Array.isArray(eventData.images)) {
            for (let i = 0; i < eventData.images.length; i++) {
              const processedUrl = await getPreSignedUrl(eventData.images[i]);
              eventData.images[i] = processedUrl;
            }
          }

          // Ensure location data is properly formatted
          if (eventData.location) {
            if (
              typeof eventData.location.latitude === 'number' &&
              typeof eventData.location.longitude === 'number'
            ) {
              // Location data is valid
            } else {
              console.warn(`Event ${eventData.id} has invalid location coordinates`);
            }
          }

          allEvents.push(eventData);
        }

        // Separate my events and other events
        const myEventsArray = allEvents.filter((event) =>
          event.responders?.users?.includes(user.uid)
        );

        const otherEvents = allEvents.filter(
          (event) => !event.responders?.users?.includes(user.uid)
        );

        // Filter nearby events based on location
        let nearbyEventsArray = otherEvents;

        if (userLocation) {
          nearbyEventsArray = otherEvents.filter((event) => {
            if (!event.location) return true; // Include events without location

            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              event.location.latitude,
              event.location.longitude
            );

            return distance <= radius;
          });
        }

        setMyEvents(myEventsArray);
        setNearbyEvents(nearbyEventsArray);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, userLocation, radius]);

  // Format event date
  const formatEventDate = (dateStr: string, timeStr: string) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`);
      return date.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (e) {
      return `${dateStr} ${timeStr}`;
    }
  };

  // Open event details panel
  const openEventDetails = (event: Event) => {
    console.log('Opening event details for:', event);
    console.log('Event location:', event.location);

    setSelectedEvent(event);
    setIsDetailsPanelOpen(true);
  };

  // Render individual event card
  const renderEventCard = (event: Event, isRSVPed: boolean) => {
    return (
      <div
        key={event.id}
        className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4 cursor-pointer transition-transform hover:scale-[1.01] border-l-4 border-green-500"
        onClick={() => openEventDetails(event)}
      >
        {event.images && event.images.length > 0 && (
          <div className="relative w-full h-48 bg-gray-700">
            <img
              src={event.images[0]}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-green-900 text-green-200 text-xs font-semibold px-2 py-1 rounded">
              {event.eventType}
            </div>
          </div>
        )}

        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>

          <p className="text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
              {formatEventDate(event.timingInfo.date, event.timingInfo.time)}
            </span>
            <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
              {event.timingInfo.duration}
            </span>
          </div>

          {event.location?.address && (
            <div className="text-sm text-gray-400 mb-3">📍 {event.location.address}</div>
          )}

          <div className="flex items-center text-sm text-gray-400 mb-3">
            <span>Organizer: {event.organizerDetails?.name}</span>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              {event.responders?.users && (
                <p className="text-xs text-gray-500 mt-1">
                  {event.responders.users.length}{' '}
                  {event.responders.users.length === 1 ? 'person' : 'people'} attending
                </p>
              )}
            </div>

            <div>
              {isRSVPed && (
                <span className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white">
                  Attending ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Responsive Sidebar */}
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

      {/* Overlay to close sidebar when clicking outside (only on mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Enhanced Top Navigation */}
        <div className="sticky top-0 z-10 bg-gray-800 shadow-md">
          <div className="flex items-center justify-between p-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={toggleSidebar}
            >
              <GiHamburgerMenu className="text-2xl text-gray-300" />
            </div>

            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">
                Neighbour
              </h1>
              <h1 className="text-xl font-bold text-blue-600">
              Link
              </h1>
              <span className="mx-2 text-blue-500">
                |
              </span>
              <h2 className="text-xl font-bold text-green-600">
                Events
              </h2>
            </div>

            <div className="opacity-0 w-8 h-8">
              {/* Empty div for layout balance */}
            </div>
          </div>
        </div>

        <div className="flex-1 pb-24">
          <div className="flex flex-row h-screen">
            <div className={`flex-1 overflow-auto ${isDetailsPanelOpen ? 'hidden md:block' : 'block'}`}>
              <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-6">
                  <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full bg-gray-800">
                    <FaArrowLeft className="text-gray-300" />
                  </button>
                  <h1 className="text-2xl font-bold text-white">Community Events</h1>
                </div>

                {loading ? (
                  <div className="space-y-6">
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4 text-white">
                        <span className="border-b-2 border-green-500 pb-1">My Events</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                          <div key={i} className=" rounded-lg p-4">
                            <Skeleton className="h-48 w-full mb-4" />
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-4" />
                            <div className="flex gap-2 mb-4">
                              <Skeleton className="h-6 w-24" />
                              <Skeleton className="h-6 w-24" />
                            </div>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-white">
                        <span className="border-b-2 border-green-500 pb-1">Events Near You</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                          <div key={i} className=" rounded-lg p-4">
                            <Skeleton className="h-48 w-full mb-4" />
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-4" />
                            <div className="flex gap-2 mb-4">
                              <Skeleton className="h-6 w-24" />
                              <Skeleton className="h-6 w-24" />
                            </div>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* My Events Section */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4 text-white">
                        <span className="border-b-2 border-green-500 pb-1">My Events</span>
                      </h2>

                      {myEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                          {myEvents.map((event) => renderEventCard(event, true))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-800 rounded-lg shadow">
                          <p className="text-gray-400">You haven't RSVP'd to any events yet.</p>
                        </div>
                      )}
                    </div>

                    {/* Nearby Events Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">
                          <span className="border-b-2 border-green-500 pb-1">Events Near You</span>
                        </h2>

                        <select
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
                        >
                          <option value={1}>1 km</option>
                          <option value={3}>3 km</option>
                          <option value={5}>5 km</option>
                          <option value={10}>10 km</option>
                        </select>
                      </div>

                      {nearbyEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                          {nearbyEvents.map((event) => renderEventCard(event, false))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-800 rounded-lg shadow">
                          <p className="text-gray-400">No events found nearby.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Event Details Panel */}
            {selectedEvent && (
              <EventDetailsPanel
                event={selectedEvent}
                isOpen={isDetailsPanelOpen}
                onClose={() => {
                  setIsDetailsPanelOpen(false);
                  // Add a small delay before clearing the selected event
                  // to allow for smooth exit animation
                  setTimeout(() => setSelectedEvent(null), 300);
                }}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        {
          isMobile && 
        <Bottombar />
        }
      </div>
    </div>
  );
};

export default EventsPage;
