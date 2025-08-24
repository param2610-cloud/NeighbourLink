import React, { useState } from 'react';
import SafeMeetupPlaces from './SafeMeetupPlaces';
import { SafePlaceType, Coordinates, getCurrentLocation, reverseGeocode } from '../../utils/google_map/GoogleMapsUtils';
import GoogleMapsViewer from '@/utils/google_map/GoogleMapsViewer';

interface MeetupArrangerProps {
  onLocationSelect?: (location: Coordinates, place?: SafePlaceType) => void;
}

const MeetupArranger: React.FC<MeetupArrangerProps> = ({ onLocationSelect }) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SafePlaceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapLocation, setMapLocation] = useState<Coordinates | null>(null);
  const [selectedLocationAddress, setSelectedLocationAddress] = useState<string>('');
  const [locationUpdateKey, setLocationUpdateKey] = useState(0); // Add this to force refresh

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setMapLocation(location); // Set as initial map center
        setShowMap(false); // Hide map when using current location
        setLocationUpdateKey(prev => prev + 1); // Force refresh of SafeMeetupPlaces
      } else {
        setError('Unable to get your location');
      }
    } catch (err) {
      setError('Failed to get location');
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMapLocationSelect = async (coordinates: Coordinates) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get address for the selected location
      const address = await reverseGeocode(coordinates);
      setSelectedLocationAddress(address || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
      
      // Set this as the current location for finding safe places
      setCurrentLocation(coordinates);
      setMapLocation(coordinates);
      
      // Clear previously selected place since we're choosing a new location
      setSelectedPlace(null);
      
      // Force refresh of SafeMeetupPlaces component
      setLocationUpdateKey(prev => prev + 1);
      
      console.log('🗺️ Map location selected:', coordinates);
      console.log('📍 Address:', address);
      
    } catch (err) {
      setError('Failed to get address for selected location');
      console.error('Reverse geocoding error:', err);
      
      // Still set the location even if address lookup fails
      setCurrentLocation(coordinates);
      setMapLocation(coordinates);
      setSelectedLocationAddress(`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
      setLocationUpdateKey(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place: SafePlaceType) => {
    setSelectedPlace(place);
    onLocationSelect?.(place.coordinates, place);
  };

  const handleUseSelectedMapLocation = () => {
    if (currentLocation) {
      onLocationSelect?.(currentLocation);
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
    if (!showMap && !mapLocation && currentLocation) {
      setMapLocation(currentLocation);
    }
  };

  const getMapMarkers = () => {
    if (!mapLocation) return [];
    
    return [{
      position: mapLocation,
      color: '#EA4335',
      title: 'Selected Location',
      description: selectedLocationAddress || 'Click to select meetup area',
      draggable: true
    }];
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-50 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Arrange Safe Meetup</h2>
        <p className="text-sm text-gray-600 mt-1">
          Find safe public places nearby for your meetup
        </p>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Getting Location...' : 'Use My Location'}
          </button>
          
          <button
            onClick={toggleMapView}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {showMap ? 'Hide Map' : 'Pick on Map'}
          </button>
          
          {currentLocation && (
            <button
              onClick={handleUseSelectedMapLocation}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Use Selected
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Map Section */}
        {showMap && (
          <div className="mb-4">
            <div className="mb-2">
              <h4 className="font-medium text-gray-700">Select Location on Map</h4>
              <p className="text-sm text-gray-500">Click anywhere on the map to set your meetup area</p>
              {selectedLocationAddress && (
                <p className="text-sm text-blue-600 mt-1">
                  📍 {selectedLocationAddress}
                </p>
              )}
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <GoogleMapsViewer
                center={mapLocation || { lat: 22.5726, lng: 88.3639 }} // Default to Kolkata
                zoom={13}
                markers={getMapMarkers()}
                height="300px"
                onMapClick={handleMapLocationSelect}
                onMarkerDrag={handleMapLocationSelect}
                showCurrentLocation={true}
                mapType="roadmap"
              />
            </div>
          </div>
        )}

        {selectedPlace && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-800">Selected Meetup Location:</h4>
            <p className="text-green-700 text-sm">{selectedPlace.name}</p>
            <p className="text-green-600 text-xs">{selectedPlace.address}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                ⭐ {selectedPlace.rating}/5
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                📍 {selectedPlace.distance.toFixed(1)}km away
              </span>
            </div>
          </div>
        )}

        {/* Show current area info */}
        {currentLocation && selectedLocationAddress && !showMap && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-800">Searching around:</h4>
            <p className="text-blue-700 text-sm">📍 {selectedLocationAddress}</p>
          </div>
        )}

        {/* Safe Places List */}
        {currentLocation && (
          <div>
            <div className="mb-2 text-xs text-gray-500">
              Debug: Location = {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)} | Key: {locationUpdateKey}
            </div>
            <SafeMeetupPlaces
              location={currentLocation}
              onPlaceSelect={handlePlaceSelect}
              maxResults={3} // Limit to 3 as requested
              radius={2000}
              key={`safe-places-${locationUpdateKey}`} // Use the update key to force refresh
            />
          </div>
        )}

        {!currentLocation && !loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">📍</div>
            <p>Get your location or pick a location on the map to find safe meetup places nearby</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetupArranger;
