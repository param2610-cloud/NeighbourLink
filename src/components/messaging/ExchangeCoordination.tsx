import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiMap, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { sendMessage } from '../../services/messagingService';
import GoogleMapsViewer from '../../utils/google_map/GoogleMapsViewer';

interface ExchangeCoordinationProps {
  conversationId: string;
  currentUserId: string;
  postId?: string;
  onClose: () => void;
}

interface LocationOption {
  id: string;
  name: string;
  address: string;
  isSafe: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}


const SAFE_LOCATIONS: LocationOption[] = [
  { 
    id: '1', 
    name: 'Central Library', 
    address: '123 Main St', 
    isSafe: true,
    coordinates: { lat: 12.935423, lng: 77.61648 } 
  },
  { 
    id: '2', 
    name: 'Community Center', 
    address: '456 Park Ave', 
    isSafe: true,
    coordinates: { lat: 12.931423, lng: 77.62048 } 
  },
  { 
    id: '3', 
    name: 'Town Hall', 
    address: '789 Civic Blvd', 
    isSafe: true,
    coordinates: { lat: 12.927423, lng: 77.61248 } 
  },
];

const ExchangeCoordination: React.FC<ExchangeCoordinationProps> = ({
  conversationId,
  currentUserId,
  postId,
  onClose
}) => {
  const [exchangeType, setExchangeType] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [customLocation, setCustomLocation] = useState('');
  const [customCoordinates, setCustomCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomMap, setShowCustomMap] = useState(false);

  
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hourStr = hour.toString().padStart(2, '0');
        const minStr = min.toString().padStart(2, '0');
        slots.push(`${hourStr}:${minStr}`);
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();

  
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 14);
  const formattedMaxDate = maxDate.toISOString().split('T')[0];

  const handleSubmit = async () => {
    if ((!selectedLocation && !customLocation) || (!selectedLocation && !customCoordinates)) {
      alert('Please select or enter a location');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      
      const location = selectedLocation || { 
        id: 'custom',
        name: customLocation, 
        address: '', 
        isSafe: false,
        coordinates: customCoordinates || undefined
      };
      
      const exchangeData = {
        conversationId,
        postId,
        createdBy: currentUserId,
        exchangeType,
        location: {
          name: location.name,
          address: location.address,
          isSafe: location.isSafe,
          coordinates: location.coordinates
        },
        dateTime: new Date(`${selectedDate}T${selectedTime}`),
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const exchangeRef = await addDoc(collection(db, 'exchanges'), exchangeData);
      
      
      const locationName = location.name;
      const exchangeDate = new Date(`${selectedDate}T${selectedTime}`);
      const formattedDateTime = exchangeDate.toLocaleString(undefined, { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      
      const message = `I've suggested a ${exchangeType} at ${locationName} on ${formattedDateTime}. Exchange ID: ${exchangeRef.id}`;
      
      await sendMessage(conversationId, currentUserId, message);
      
      onClose();
    } catch (error) {
      console.error('Error creating exchange:', error);
      alert('Failed to create exchange arrangement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const getMapMarkers = () => {
    const markers = [];
    
    
    if (!selectedLocation || !showCustomMap) {
      SAFE_LOCATIONS.forEach(location => {
        if (location.coordinates) {
          markers.push({
            position: location.coordinates,
            color: selectedLocation?.id === location.id ? '#4CAF50' : '#2196F3',
            title: location.name,
            draggable: false
          });
        }
      });
    }
    
    
    if (showCustomMap && customCoordinates) {
      markers.push({
        position: customCoordinates,
        color: '#FF5252',
        draggable: true,
        title: customLocation || 'Custom Location'
      });
    }
    
    return markers;
  };

  
  const getMapCenter = () => {
    if (showCustomMap && customCoordinates) {
      return customCoordinates;
    }
    
    if (selectedLocation?.coordinates) {
      return selectedLocation.coordinates;
    }
    
    
    return { lat: 12.931423492103944, lng: 77.61648476788898 };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Arrange Exchange
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* Exchange type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exchange Type
            </label>
            <div className="flex space-x-4">
              <button
                className={`flex-1 py-2 px-4 rounded-md ${
                  exchangeType === 'pickup' 
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 dark:bg-indigo-900 dark:text-indigo-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}
                onClick={() => setExchangeType('pickup')}
              >
                Pickup
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md ${
                  exchangeType === 'delivery' 
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 dark:bg-indigo-900 dark:text-indigo-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}
                onClick={() => setExchangeType('delivery')}
              >
                Delivery
              </button>
            </div>
          </div>
          
          {/* Map view */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <FiMap className="text-indigo-600 mr-2" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Meeting Location
              </label>
            </div>
            
            <div className="mb-4">


              <GoogleMapsViewer 
                center={getMapCenter()}
                zoom={14}
                markers={getMapMarkers()}
                height="200px"
                onMapClick={(position: {lat: number; lng: number}) => {
                  if (showCustomMap) {
                    setCustomCoordinates(position);
                  }
                }}
                onMarkerDrag={(position: {lat: number; lng: number}) => {
                  setCustomCoordinates(position);
                }}
              />
            </div>
            
            {/* Safe locations */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Safe Exchange Locations
              </p>
              
              {SAFE_LOCATIONS.map(location => (
                <button
                  key={location.id}
                  className={`w-full text-left py-2 px-3 rounded-md flex justify-between items-center ${
                    selectedLocation?.id === location.id 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => {
                    setSelectedLocation(location);
                    setCustomLocation('');
                    setCustomCoordinates(null);
                    setShowCustomMap(false);
                  }}
                >
                  <div>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{location.address}</div>
                  </div>
                  {selectedLocation?.id === location.id && (
                    <FiCheck className="text-green-600" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Custom location */}
            <div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Or enter a custom location
                </p>
                <button
                  type="button" 
                  className="text-xs text-indigo-600 dark:text-indigo-400"
                  onClick={() => {
                    setShowCustomMap(!showCustomMap);
                    setSelectedLocation(null);
                  }}
                >
                  {showCustomMap ? "Hide map" : "Set on map"}
                </button>
              </div>
              <input
                type="text"
                placeholder="Enter meeting location"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={customLocation}
                onChange={(e) => {
                  setCustomLocation(e.target.value);
                  setSelectedLocation(null);
                }}
              />
              {showCustomMap && (
                <p className="text-xs mt-1 text-gray-500">
                  {customCoordinates 
                    ? `Selected location: ${customCoordinates.lat.toFixed(6)}, ${customCoordinates.lng.toFixed(6)}` 
                    : "Click on the map to choose a location"}
                </p>
              )}
            </div>
          </div>
          
          {/* Date and Time */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <FiClock className="text-indigo-600 mr-2" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date & Time
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min={formattedToday}
                  max={formattedMaxDate}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Time
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!selectedLocation && (!customLocation || !customCoordinates))}
            className={`w-full py-3 rounded-md ${
              isSubmitting || (!selectedLocation && (!customLocation || !customCoordinates))
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? 'Setting up...' : 'Confirm Exchange Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExchangeCoordination;
