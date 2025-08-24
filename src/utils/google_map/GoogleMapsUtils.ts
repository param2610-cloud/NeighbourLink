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
    
    // Sanitize coordinates before using them
    const sanitizedFrom = sanitizeCoordinates(fromLocation);
    const sanitizedTo = sanitizeCoordinates(toLocation);
    
    if (!sanitizedFrom || !sanitizedTo) {
      console.error('Invalid coordinates provided');
      return null;
    }
    
    const service = new window.google.maps.DistanceMatrixService();
    
    return new Promise((resolve) => {
      service.getDistanceMatrix({
        origins: [new window.google.maps.LatLng(sanitizedFrom.lat, sanitizedFrom.lng)],
        destinations: [new window.google.maps.LatLng(sanitizedTo.lat, sanitizedTo.lng)],
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

export interface SafePlaceType {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  type: string;
  rating: number;
  openNow: boolean | undefined;
  distance: number;
}

/**
 * Search for safe meetup places around given coordinates
 * Returns only the 3 nearest places with high ratings
 */
export const findSafeMeetupPlaces = async (
  location: Coordinates,
  radius: number = 2000
): Promise<SafePlaceType[]> => {
  console.log('🔍 findSafeMeetupPlaces called with:', { location, radius });
  
  try {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('❌ Google Maps Places API not loaded');
      throw new Error('Google Maps Places API not loaded');
    }

    // Sanitize input coordinates
    const sanitizedLocation = sanitizeCoordinates(location);
    if (!sanitizedLocation) {
      console.error('❌ Invalid location coordinates');
      return [];
    }

    console.log('✅ Google Maps Places API is available');

    // Create a temporary map element for the PlacesService
    const mapDiv = document.createElement('div');
    const map = new window.google.maps.Map(mapDiv, {
      center: new window.google.maps.LatLng(sanitizedLocation.lat, sanitizedLocation.lng),
      zoom: 15
    });

    const service = new window.google.maps.places.PlacesService(map);

    const safeTypes = [
      'transit_station',
      'shopping_mall',
      'police',
      'hospital',
      'library',
      'cafe'
    ];

    console.log('🏗️ Searching for types:', safeTypes);

    const searchPromises = safeTypes.map(type => 
      new Promise<any[]>((resolve) => {
        console.log(`🔎 Searching for type: ${type}`);
        const request = {
          location: new window.google.maps.LatLng(sanitizedLocation.lat, sanitizedLocation.lng),
          radius,
          type: type
        };

        // Add timeout to prevent hanging requests
        const timeout = setTimeout(() => {
          console.warn(`⏰ Search timeout for ${type}`);
          resolve([]);
        }, 15000);

        service.nearbySearch(request, (results: any[], status: any) => {
          clearTimeout(timeout);
          console.log(`📍 Results for ${type}:`, { status, count: results?.length || 0 });
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const mappedResults = results.map(place => ({ ...place, searchType: type }));
            console.log(`✅ Mapped results for ${type}:`, mappedResults.length, 'places');
            resolve(mappedResults);
          } else {
            console.warn(`❌ No results for ${type}:`, status);
            resolve([]);
          }
        });
      })
    );

    const allResults = await Promise.all(searchPromises);
    console.log('🎯 All search results:', allResults);
    
    const places = allResults.flat();
    console.log('📋 Flattened places:', places.length, 'total places');

    const processedPlaces = places
      .filter(place => place.place_id && place.name && place.geometry && place.geometry.location)
      .map(place => {
        try {
          const placeCoords = {
            lat: typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat,
            lng: typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng
          };
          
          const distance = calculateStraightLineDistance(sanitizedLocation, placeCoords);
          
          return {
            placeId: place.place_id,
            name: place.name,
            address: place.vicinity || '',
            coordinates: placeCoords,
            type: place.searchType,
            rating: place.rating || 0,
            openNow: place.opening_hours?.open_now,
            distance: distance
          };
        } catch (error) {
          console.error('Error processing place:', place, error);
          return null;
        }
      })
      .filter((place): place is SafePlaceType => place !== null)
      .filter((place: SafePlaceType) => {
        const isEssentialService = ['police', 'hospital', 'transit_station'].includes(place.type);
        return isEssentialService || !place.rating || place.rating >= 3.5;
      })
      .sort((a: SafePlaceType, b: SafePlaceType) => {
        // Create a weighted score: lower distance is better, higher rating is better
        const scoreA = a.distance! - (a.rating || 0) * 0.5;
        const scoreB = b.distance! - (b.rating || 0) * 0.5;
        return scoreA - scoreB;
      })
      .slice(0, 3);

    console.log('🎉 Final processed places (top 3):', processedPlaces);
    return processedPlaces;

  } catch (error) {
    console.error('💥 Error finding safe meetup places:', error);
    return [];
  }
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

/**
 * Sanitize coordinates to ensure proper number types
 */
export const sanitizeCoordinates = (coordinates: any): Coordinates | null => {
  try {
    const lat = typeof coordinates.lat === 'string' ? parseFloat(coordinates.lat) : coordinates.lat;
    const lng = typeof coordinates.lng === 'string' ? parseFloat(coordinates.lng) : coordinates.lng;
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinate values:', coordinates);
      return null;
    }
    
    return { lat, lng };
  } catch (error) {
    console.error('Error sanitizing coordinates:', error);
    return null;
  }
};
