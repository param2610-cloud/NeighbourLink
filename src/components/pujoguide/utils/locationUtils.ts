import { Pandal } from '../data/pandalData';

// Interface for reverse geocoding result
interface ReverseGeocodeResult {
  district?: string;
  state?: string;
  city?: string;
  fullAddress?: string;
}

// Interface for enhanced Pandal with dynamic district
interface PandalWithDistrict extends Pandal {
  dynamicDistrict?: string;
}

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Find nearby pandals within a specified radius (in km)
export function findNearbyPandals(
  targetPandal: Pandal,
  allPandals: Pandal[],
  radiusKm: number = 10
): Pandal[] {
  return allPandals
    .filter((pandal) => pandal.id !== targetPandal.id)
    .map((pandal) => ({
      ...pandal,
      distance: calculateDistance(
        targetPandal.coordinates.lat,
        targetPandal.coordinates.lng,
        pandal.coordinates.lat,
        pandal.coordinates.lng
      ),
    }))
    .filter((pandal) => (pandal as any).distance <= radiusKm)
    .sort((a, b) => (a as any).distance - (b as any).distance)
    .slice(0, 5); // Return top 5 nearby pandals
}

// Sort pandals by distance from user's location
export function sortByDistance(
  userLat: number,
  userLng: number,
  pandals: Pandal[]
): Pandal[] {
  return pandals
    .map((pandal) => ({
      ...pandal,
      distance: calculateDistance(userLat, userLng, pandal.coordinates.lat, pandal.coordinates.lng),
    }))
    .sort((a, b) => (a as any).distance - (b as any).distance);
}

// Sort pandals by popularity within a district
export function sortByPopularity(pandals: Pandal[]): Pandal[] {
  return [...pandals].sort((a, b) => b.popularity - a.popularity);
}

// Filter pandals by district
export function filterByDistrict(pandals: Pandal[], district: string): Pandal[] {
  return pandals.filter(
    (pandal) => pandal?.district?.toLowerCase() === district.toLowerCase()
  );
}

// Get user's current location (mock for now)
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          resolve({ lat: 22.5726, lng: 88.3639 });
        }
      );
    } else {
      // Fallback to Kolkata coordinates
      resolve({ lat: 22.5726, lng: 88.3639 });
    }
  });
}

// Get available districts from pandal data
export function getAvailableDistricts(pandals: Pandal[]): string[] {
  const districts = [...new Set(
    pandals
      .map(pandal => pandal.district)
      .filter((district): district is string => Boolean(district))
  )];
  return districts.sort();
}

// **NEW FUNCTIONS FOR GOOGLE MAPS INTEGRATION**

/**
 * Get district information from coordinates using Google Maps Reverse Geocoding
 */
export async function getDistrictFromCoordinates(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const addressComponents = result.address_components;
            
            let district = '';
            let state = '';
            let city = '';
            
            // Parse address components to find district/administrative area
            for (const component of addressComponents) {
              const types = component.types;
              
              // Look for administrative area level 2 (usually district)
              if (types.includes('administrative_area_level_2')) {
                district = component.long_name;
              }
              // Look for administrative area level 1 (usually state)
              else if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
              // Look for locality (city)
              else if (types.includes('locality')) {
                city = component.long_name;
              }
            }
            
            resolve({
              district: district || city, // Fallback to city if district not found
              state,
              city,
              fullAddress: result.formatted_address
            });
          } else {
            console.error('Reverse geocoding failed:', status);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting district from coordinates:', error);
    return null;
  }
}

/**
 * Get districts for all pandals using reverse geocoding
 * This function can be used to populate district data for pandals
 */
export async function enrichPandalsWithDistricts(
  pandals: Pandal[]
): Promise<PandalWithDistrict[]> {
  const enrichedPandals: PandalWithDistrict[] = [];
  
  for (const pandal of pandals) {
    const districtInfo = await getDistrictFromCoordinates(
      pandal.coordinates.lat,
      pandal.coordinates.lng
    );
    
    enrichedPandals.push({
      ...pandal,
      dynamicDistrict: districtInfo?.district || pandal.district || 'Unknown'
    });
    
    // Add small delay to avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return enrichedPandals;
}

/**
 * Filter pandals by district using Google Maps reverse geocoding
 * This is the main function you'll use for filtering
 */
export async function filterByDistrictWithGeocoding(
  pandals: Pandal[], 
  targetDistrict: string
): Promise<Pandal[]> {
  const enrichedPandals = await enrichPandalsWithDistricts(pandals);
  
  return enrichedPandals.filter(pandal => 
    pandal.dynamicDistrict?.toLowerCase() === targetDistrict.toLowerCase()
  );
}

/**
 * Get available districts from pandals using reverse geocoding
 */
export async function getAvailableDistrictsWithGeocoding(
  pandals: Pandal[]
): Promise<string[]> {
  const enrichedPandals = await enrichPandalsWithDistricts(pandals);
  const districts = [...new Set(
    enrichedPandals
      .map(pandal => pandal.dynamicDistrict)
      .filter((district): district is string => Boolean(district))
  )];
  return districts.sort();
}

/**
 * Enhanced filter function that works with both static and dynamic district data
 */
export async function smartDistrictFilter(
  pandals: Pandal[],
  targetDistrict: string,
  useGeocoding: boolean = true
): Promise<Pandal[]> {
  if (useGeocoding) {
    return await filterByDistrictWithGeocoding(pandals, targetDistrict);
  } else {
    return filterByDistrict(pandals, targetDistrict);
  }
}
