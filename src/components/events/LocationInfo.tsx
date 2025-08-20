import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock } from 'lucide-react';
import { 
  getCurrentLocation, 
  calculateDistanceAndDuration, 
  getDirectionUrls,
  calculateStraightLineDistance,
  type Coordinates 
} from '@/utils/google_map/GoogleMapsUtils';

interface LocationInfoProps {
  eventLocation: Coordinates;
  eventTitle: string;
  className?: string;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ 
  eventLocation, 
  eventTitle,
  className = ""
}) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current location on component mount
  useEffect(() => {
    const fetchCurrentLocation = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const location = await getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          
          // Calculate straight-line distance immediately
          const straightDistance = calculateStraightLineDistance(location, eventLocation);
          setDistance(`${straightDistance.toFixed(1)} km (straight line)`);
          
          // Calculate driving distance and duration
          const result = await calculateDistanceAndDuration(location, eventLocation);
          if (result) {
            setDistance(result.distance.text);
            setDuration(result.duration.text);
          }
        } else {
          setError('Unable to get your location');
        }
      } catch (err) {
        console.error('Error getting location info:', err);
        setError('Failed to calculate distance');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentLocation();
  }, [eventLocation]);

  const handleGetDirections = () => {
    if (currentLocation) {
      const urls = getDirectionUrls(currentLocation, eventLocation);
      window.open(urls.googleMaps, '_blank');
    } else {
      // Fallback to directions from current location
      const url = `https://www.google.com/maps/dir/?api=1&destination=${eventLocation.lat},${eventLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Distance and Duration Info */}
      {isLoading && (
        <div className="flex items-center text-sm text-gray-400">
          <Clock className="h-4 w-4 mr-2 animate-spin" />
          Calculating distance...
        </div>
      )}
      
      {distance && !isLoading && (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-indigo-400" />
            Distance: {distance}
          </div>
          {duration && (
            <div className="flex items-center text-sm text-gray-300 ml-6">
              <Clock className="h-4 w-4 mr-2 text-indigo-400" />
              Driving time: {duration}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Get Directions Button */}
      <Button
        onClick={handleGetDirections}
        variant="outline"
        size="sm"
        className="w-full bg-transparent border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white"
      >
        <Navigation className="h-4 w-4 mr-2" />
        Get Directions to {eventTitle}
      </Button>
    </div>
  );
};

export default LocationInfo;
