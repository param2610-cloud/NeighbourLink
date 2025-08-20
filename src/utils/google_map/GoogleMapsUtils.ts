/**
 * Google Maps Utility Functions
 * Based on Google Maps JavaScript API best practices
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DirectionUrls {
  googleMaps: string;
  appleMaps: string;
}

/**
 * Generate direction URLs for Google Maps and Apple Maps
 */
export const getDirectionUrls = (
  fromLocation: Coordinates,
  toLocation: Coordinates
): DirectionUrls => {
  const fromLatLng = `${fromLocation.lat},${fromLocation.lng}`;
  const toLatLng = `${toLocation.lat},${toLocation.lng}`;
  
  return {
    googleMaps: `https://www.google.com/maps/dir/${fromLatLng}/${toLatLng}/`,
    appleMaps: `https://maps.apple.com/?saddr=${fromLatLng}&daddr=${toLatLng}&dirflg=d`,
  };
};

/**
 * Calculate distance and duration between two points
 */
export const calculateDistanceAndDuration = async (
  fromLocation: Coordinates,
  toLocation: Coordinates
): Promise<{
  distance: { text: string; value: number };
  duration: { text: string; value: number };
} | null> => {
  try {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }
    
    const service = new window.google.maps.DistanceMatrixService();
    
    return new Promise((resolve) => {
      service.getDistanceMatrix({
        origins: [fromLocation],
        destinations: [toLocation],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      }, (response: any, status: any) => {
        if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
          const result = response.rows[0].elements[0];
          resolve({
            distance: result.distance,
            duration: result.duration,
          });
        } else {
          console.error('Distance calculation failed:', status);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
};

/**
 * Convert address to coordinates using geocoding
 */
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address: address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          console.error('Geocoding failed:', status);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Convert coordinates to address using reverse geocoding
 */
export const reverseGeocode = async (coordinates: Coordinates): Promise<string | null> => {
  try {
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ location: coordinates }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          console.error('Reverse geocoding failed:', status);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Get current user location
 */
export const getCurrentLocation = (): Promise<Coordinates | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

/**
 * Calculate straight-line distance between two points (in kilometers)
 */
export const calculateStraightLineDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) * Math.cos(point2.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (coordinates: any): coordinates is Coordinates => {
  return (
    coordinates &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180
  );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (coordinates: Coordinates, precision: number = 6): string => {
  return `${coordinates.lat.toFixed(precision)}, ${coordinates.lng.toFixed(precision)}`;
};

/**
 * Create a Google Maps URL for sharing
 */
export const createMapsUrl = (coordinates: Coordinates, zoom: number = 15): string => {
  return `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},${zoom}z`;
};

/**
 * Load Google Maps API script dynamically
 */
export const loadGoogleMapsAPI = (apiKey: string, libraries: string[] = ['places']): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));

    document.head.appendChild(script);
  });
};
