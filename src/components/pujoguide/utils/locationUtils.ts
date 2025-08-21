import { Pandal } from '../data/pandalData';

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
    (pandal) => pandal.district.toLowerCase() === district.toLowerCase()
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
          // Fallback to Kolkata coordinates if location access denied
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
  const districts = [...new Set(pandals.map(pandal => pandal.district))];
  return districts.sort();
}
