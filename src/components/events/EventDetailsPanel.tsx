import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Calendar, Clock, Users, MapPin } from 'lucide-react';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useStateContext } from '@/contexts/StateContext';
import OlaMapsViewer from '@/utils/ola/OlaMapsViewer';
import { motion, AnimatePresence } from 'framer-motion';

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

interface EventDetailsPanelProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({ 
  event, 
  isOpen, 
  onClose 
}) => {
  const { user } = useStateContext();
  const [isRSVPing, setIsRSVPing] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  
  useEffect(() => {
    if (event && user) {
      setIsRSVPed(event.responders?.users?.includes(user.uid) || false);
    }
  }, [event, user]);
  
  if (!event) return null;
  
  const handleRSVP = async () => {
    if (!user) {
      alert("Please log in to RSVP for this event");
      return;
    }

    try {
      setIsRSVPing(true);
      const eventRef = doc(db, "events", event.id);
      
      if (isRSVPed) {
        // Remove user from responders
        await updateDoc(eventRef, {
          "responders.users": arrayRemove(user.uid)
        });
        setIsRSVPed(false);
      } else {
        // Add user to responders
        await updateDoc(eventRef, {
          "responders.users": arrayUnion(user.uid)
        });
        setIsRSVPed(true);
      }
    } catch (error) {
      console.error("Error updating RSVP status:", error);
      alert("Failed to update RSVP status. Please try again.");
    } finally {
      setIsRSVPing(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Get the number of attendees
  const attendeeCount = event.responders?.users?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="w-full md:w-1/3 bg-gray-800 border-l border-gray-700 overflow-y-auto h-full"
        >
          {/* Header with close button */}
          <div className="flex justify-between items-center p-4 sticky top-0 z-10 bg-gray-800 border-b border-gray-700">
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
              <X size={20} />
            </button>
            <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-sm">
              {event.eventType}
            </span>
          </div>
          
          {/* Event Title */}
          <h2 className="text-2xl font-bold px-4 py-2 text-white">{event.title}</h2>
          
          {/* Event Image */}
          {event.images && event.images.length > 0 && (
            <div className="w-full mt-2 mb-4">
              <img 
                src={event.images[0]} 
                alt={event.title} 
                className="w-full h-auto"
              />
            </div>
          )}
          
          {/* Event Description */}
          <div className="px-4 py-2 text-gray-300">
            {event.description}
          </div>
          
          <div className="space-y-6 mt-6">
            {/* Date Section */}
            <div className="flex items-center px-4">
              <div className="w-8">
                <Calendar className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Date</h3>
                <p className="text-gray-400">
                  {formatDate(event.timingInfo.date)}
                </p>
              </div>
            </div>
            
            {/* Time Section */}
            <div className="flex items-center px-4">
              <div className="w-8">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Time</h3>
                <p className="text-gray-400">
                  {event.timingInfo.time} ({event.timingInfo.duration})
                </p>
              </div>
            </div>

            {/* Location Section */}
            {event.location && (
              <div className="px-4">
                <div className="flex items-center mb-2">
                  <div className="w-8">
                    <MapPin className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white">Location</h3>
                </div>
                
                {/* Address */}
                {event.location.address && (
                  <p className="text-gray-400 ml-8 mb-3">{event.location.address}</p>
                )}
                
                {/* Map */}
                {event.location.latitude && event.location.longitude && (
                  <div className="mt-2 rounded-md overflow-hidden">
                    <OlaMapsViewer
                      center={{ lat: event.location.latitude, lng: event.location.longitude }}
                      zoom={15}
                      markers={[
                        {
                          position: { lat: event.location.latitude, lng: event.location.longitude },
                          color: '#4CAF50',
                          title: event.title
                        }
                      ]}
                      height="200px"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Organizer Section */}
            <div className="flex items-center px-4">
              <div className="w-8">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Organizer</h3>
                <p className="font-medium text-gray-300">{event.organizerDetails.name}</p>
                <div className="text-sm text-gray-400">
                  <p>Email: {event.organizerDetails.email}</p>
                  {event.organizerDetails.contact && (
                    <p>Contact: {event.organizerDetails.contact}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Registration Link */}
            {event.isRegistrationRequired && event.registrationLink && (
              <div className="px-4">
                <a 
                  href={event.registrationLink}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline block"
                >
                  Registration Required - Click here to register
                </a>
              </div>
            )}
            
            {/* Attendance Information */}
            <div className="px-4 py-2">
              <p className="text-sm text-gray-400">
                {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
              </p>
            </div>
            
            {/* RSVP Button */}
            <div className="px-4 py-4">
              <Button 
                onClick={handleRSVP}
                disabled={isRSVPing || (event.isRegistrationRequired && !isRSVPed)}
                className="w-full py-6 text-md rounded-md"
                style={{ 
                  backgroundColor: isRSVPed ? '#f44336' : '#4caf50',
                  color: 'white'
                }}
              >
                {isRSVPing ? 'Processing...' : isRSVPed ? 'Cancel RSVP' : 'RSVP'}
              </Button>
              
              {event.isRegistrationRequired && !isRSVPed && (
                <p className="text-xs text-yellow-400 mt-2">
                  Registration is required for this event
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventDetailsPanel;
