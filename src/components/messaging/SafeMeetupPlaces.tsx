import React, { useState, useEffect } from 'react';
import { loadGoogleMapsScript } from '../../utils/google_map/MapInit';
import { SafePlaceType, Coordinates, findSafeMeetupPlaces } from '../../utils/google_map/GoogleMapsUtils';

interface SafeMeetupPlacesProps {
  location: Coordinates;
  onPlaceSelect?: (place: SafePlaceType) => void;
  maxResults?: number;
  radius?: number;
}

const SafeMeetupPlaces: React.FC<SafeMeetupPlacesProps> = ({
  location,
  onPlaceSelect,
  maxResults = 10,
  radius = 2000
}) => {
  const [places, setPlaces] = useState<SafePlaceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔄 SafeMeetupPlaces component rendered with location:', location);

  const getPlaceTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'train_station': '🚂',
      'bus_station': '🚌',
      'transit_station': '🚇',
      'shopping_mall': '🛒',
      'police': '👮',
      'subway_station': '🚇'
    };
    return icons[type] || '📍';
  };

  const getPlaceTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      'train_station': 'Train Station',
      'bus_station': 'Bus Station',
      'transit_station': 'Transit Station',
      'shopping_mall': 'Shopping Mall',
      'police': 'Police Station',
      'subway_station': 'Subway Station'
    };
    return names[type] || 'Place';
  };

  useEffect(() => {
    const searchPlaces = async () => {
      if (!location.lat || !location.lng) {
        console.log('❌ SafeMeetupPlaces: Invalid location, skipping search:', location);
        return;
      }

      console.log('🔄 SafeMeetupPlaces: Starting search for location:', location);
      setLoading(true);
      setError(null);
      setPlaces([]); // Clear existing places immediately

      try {
        await loadGoogleMapsScript();
        console.log('✅ SafeMeetupPlaces: Google Maps script loaded');
        const foundPlaces = await findSafeMeetupPlaces(location, radius);
        console.log('📍 SafeMeetupPlaces: Found places:', foundPlaces);
        const limitedPlaces = foundPlaces.slice(0, maxResults);
        console.log('🎯 SafeMeetupPlaces: Setting places (limited):', limitedPlaces);
        setPlaces(limitedPlaces);
      } catch (err) {
        setError('Failed to load safe meetup places');
        console.error('❌ SafeMeetupPlaces: Error loading places:', err);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    console.log('🔄 SafeMeetupPlaces: useEffect triggered with dependencies:', {
      lat: location.lat,
      lng: location.lng,
      radius,
      maxResults
    });
    
    searchPlaces();
  }, [location.lat, location.lng, radius, maxResults]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Finding safe meetup places...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No safe meetup places found nearby</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 px-4 py-2 bg-gray-50">
        Safe Meetup Places Nearby
        <span className="text-xs text-gray-500 ml-2">
          ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
        </span>
      </h3>
      <div className="space-y-2">
        {places.map((place) => (
          <div
            key={place.placeId}
            className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onPlaceSelect?.(place)}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{getPlaceTypeIcon(place.type)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {place.name}
                </h4>
                <p className="text-sm text-gray-600 truncate">
                  {place.address}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {getPlaceTypeName(place.type)}
                  </span>
                  {place.distance && (
                    <span className="text-xs text-gray-500">
                      {place.distance.toFixed(1)} km
                    </span>
                  )}
                </div>
                {place.rating && (
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-yellow-600">★</span>
                    <span className="text-xs text-gray-600 ml-1">
                      {place.rating}
                    </span>
                    {place.openNow !== undefined && (
                      <span className={`text-xs ml-2 px-1 py-0.5 rounded ${
                        place.openNow 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {place.openNow ? 'Open' : 'Closed'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafeMeetupPlaces;
