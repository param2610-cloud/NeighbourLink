import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FiCheck, FiX } from 'react-icons/fi';
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
        <div className="flex flex-col md:flex-row bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 text-white">
          {/* Left: Map / preview */}
          <div className="md:w-1/2 p-5 border-r border-white/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-indigo-100">Arrange meetup</h3>
                <p className="text-sm text-indigo-200/60">Choose date, time and a safe public location</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full text-indigo-200 hover:bg-white/5">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg overflow-hidden border border-white/5 bg-black/40">
              <GoogleMapsViewer
                center={getMapCenter()}
                zoom={14}
                markers={getMapMarkers()}
                height="320px"
                onMapClick={(position: {lat: number; lng: number}) => {
                  if (showCustomMap) setCustomCoordinates(position);
                }}
                onMarkerDrag={(position: {lat: number; lng: number}) => setCustomCoordinates(position)}
              />
            </div>

            <div className="mt-3 text-xs text-indigo-200/50">Tip: pick a well-lit public place. Use the map to fine-tune a custom location.</div>
          </div>

          {/* Right: Controls */}
          <div className="md:w-1/2 p-6">
            {/* Type selector */}
            <div className="mb-4">
              <label className="text-sm font-medium text-yellow-200 mb-2 block">Type</label>
              <div className="inline-flex rounded-lg bg-white/5 p-1">
                <button
                  onClick={() => setExchangeType('pickup')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${exchangeType === 'pickup' ? 'bg-yellow-400 text-black shadow' : 'text-indigo-200/70'}`}>
                  Pickup
                </button>
                <button
                  onClick={() => setExchangeType('delivery')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${exchangeType === 'delivery' ? 'bg-yellow-400 text-black shadow' : 'text-indigo-200/70'}`}>
                  Delivery
                </button>
              </div>
            </div>

            {/* Safe locations list */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-yellow-200">Safe locations</label>
                <button
                  type="button"
                  className="text-xs text-yellow-300"
                  onClick={() => { setShowCustomMap(!showCustomMap); setSelectedLocation(null); }}
                >
                  {showCustomMap ? 'Use address' : 'Pick on map'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {SAFE_LOCATIONS.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => { setSelectedLocation(loc); setCustomLocation(''); setCustomCoordinates(null); setShowCustomMap(false); }}
                    className={`w-full text-left p-3 rounded-lg border ${selectedLocation?.id === loc.id ? 'border-yellow-400 bg-yellow-500/12' : 'border-white/5 bg-white/2'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-indigo-50">{loc.name}</div>
                        <div className="text-xs text-indigo-200/60">{loc.address}</div>
                      </div>
                      {selectedLocation?.id === loc.id && <FiCheck className="text-yellow-300 w-5 h-5" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom location / Address */}
            <div className="mb-4">
              <label className="text-sm font-medium text-yellow-200 mb-2 block">Custom location</label>
              <input
                type="text"
                placeholder="Enter meeting address"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-indigo-50 placeholder:italic placeholder:text-indigo-200/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                value={customLocation}
                onChange={(e) => { setCustomLocation(e.target.value); setSelectedLocation(null); }}
              />
              {showCustomMap && (
                <div className="mt-2 text-xs text-indigo-200/50">{customCoordinates ? `Selected: ${customCoordinates.lat.toFixed(5)}, ${customCoordinates.lng.toFixed(5)}` : 'Tap the map to pick a location'}</div>
              )}
            </div>

            {/* Date & Time */}
            <div className="mb-4">
              <label className="text-sm font-medium text-yellow-200 mb-2 block">When</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  min={formattedToday}
                  max={formattedMaxDate}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-indigo-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                />
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-indigo-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                >
                  {timeSlots.map(t => <option key={t} value={t} className="bg-[#0b1220]">{t}</option>)}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!selectedLocation && (!customLocation || !customCoordinates))}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold ${isSubmitting || (!selectedLocation && (!customLocation || !customCoordinates)) ? 'bg-white/10 text-indigo-300 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}>
                {isSubmitting ? 'Setting up...' : 'Confirm meetup'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-lg border text-sm bg-transparent border-white/5 text-indigo-200"
              >Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeCoordination;
