import React from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, Calendar, Clock, Users } from 'lucide-react';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useStateContext } from '@/contexts/StateContext';
import MapContainer from '@/components/MapContainer';

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

interface EventDetailsSheetProps {
  event: Event | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventDetailsSheet: React.FC<EventDetailsSheetProps> = ({ 
  event, 
  isOpen, 
  onOpenChange 
}) => {
  const { user } = useStateContext();
  const [isRSVPing, setIsRSVPing] = React.useState(false);
  
  if (!event) return null;
  
  const isRSVPed = event.responders?.users?.includes(user?.uid || "");
  
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
      } else {
        // Add user to responders
        await updateDoc(eventRef, {
          "responders.users": arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error updating RSVP status:", error);
      alert("Failed to update RSVP status. Please try again.");
    } finally {
      setIsRSVPing(false);
    }
  };

  // Get the number of attendees
  const attendeeCount = event.responders?.users?.length || 0;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 bg-black text-white max-w-none border-l-0 shadow-none overflow-y-scroll">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4">
          <button onClick={() => onOpenChange(false)} className="text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Event Badge */}
        <div className="px-4">
          <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-sm">
            {event.eventType}
          </span>
        </div>
        
        {/* Event Title */}
        <h2 className="text-2xl font-bold px-4 py-2">{event.title}</h2>
        
        {/* Event Image */}
        {event.images && event.images.length > 0 && (
          <div className="w-full mt-4 mb-6">
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
              <Calendar className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Date</h3>
              <p className="text-gray-400">
                Friday, February {event.timingInfo.date.split('-')[2]}, {new Date(event.timingInfo.date).getFullYear()}
              </p>
            </div>
          </div>
          
          {/* Time Section */}
          <div className="flex items-center px-4">
            <div className="w-8">
              <Clock className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Time</h3>
              <p className="text-gray-400">
                {event.timingInfo.time} ({event.timingInfo.duration})
              </p>
            </div>
          </div>
          
          {/* Organizer Section */}
          <div className="flex items-center px-4">
            <div className="w-8">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Organizer</h3>
              <p className="font-medium text-gray-300">{event.organizerDetails.name}</p>
              <div className="text-sm text-gray-400">
                <p>Email: {event.organizerDetails.email}</p>
                {event.organizerDetails.contact && (
                  <p>Contact: {event.organizerDetails.contact}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Attendance Information */}
          <div className="px-4 py-2">
            <p className="text-sm text-gray-400">
              {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} attending
            </p>
          </div>
          
          {/* RSVP Button */}
          <div className="px-4 py-4 mt-auto sticky bottom-0">
            <Button 
              onClick={handleRSVP}
              disabled={isRSVPing}
              className="w-full py-6 text-md rounded-md"
              style={{ 
                backgroundColor: isRSVPed ? '#f44336' : '#4caf50',
                color: 'white'
              }}
            >
              {isRSVPing ? 'Processing...' : isRSVPed ? 'Cancel RSVP' : 'RSVP'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EventDetailsSheet;
