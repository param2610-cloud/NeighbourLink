import { useState } from 'react';
import { loadGoogleMapsScript } from '../utils/google_map/MapInit';
import { SafePlaceType, Coordinates, findSafeMeetupPlaces, getCurrentLocation } from '../utils/google_map/GoogleMapsUtils';

interface UseSafeMeetupPlacesResult {
  places: SafePlaceType[];
  loading: boolean;
  error: string | null;
  searchPlaces: (location: Coordinates, radius?: number) => Promise<void>;
  getCurrentLocationAndSearch: (radius?: number) => Promise<void>;
}

export const useSafeMeetupPlaces = (): UseSafeMeetupPlacesResult => {
  const [places, setPlaces] = useState<SafePlaceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = async (location: Coordinates, radius: number = 2000) => {
    if (!location.lat || !location.lng) {
      setError('Invalid location coordinates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loadGoogleMapsScript();
      const foundPlaces = await findSafeMeetupPlaces(location, radius);
      setPlaces(foundPlaces);
    } catch (err) {
      setError('Failed to find safe meetup places');
      console.error('Error searching places:', err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocationAndSearch = async (radius: number = 2000) => {
    setLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      if (location) {
        await searchPlaces(location, radius);
      } else {
        setError('Unable to get your current location');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to get location and search places');
      console.error('Error getting location:', err);
      setLoading(false);
    }
  };

  return {
    places,
    loading,
    error,
    searchPlaces,
    getCurrentLocationAndSearch
  };
};
