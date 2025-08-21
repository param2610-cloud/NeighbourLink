import { reverseGeocode } from '../utils/google_map/GoogleMapsUtils';
import { PandelService } from '../services/pandelService';

export interface AddressUpdateResult {
  success: boolean;
  address?: string;
  error?: string;
}

// Cache to store addresses to avoid repeated API calls
const addressCache = new Map<string, string>();

export class AddressManager {
  /**
   * Get address from coordinates and update pandel if needed
   */
  static async getAndUpdateAddress(
    pandelId: number,
    lat: number,
    lng: number,
    currentAddress?: string
  ): Promise<AddressUpdateResult> {
    try {
      const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      
      // Check cache first
      if (addressCache.has(cacheKey)) {
        const cachedAddress = addressCache.get(cacheKey)!;
        return { success: true, address: cachedAddress };
      }

      // If we already have a detailed address, don't fetch again
      if (currentAddress && this.isDetailedAddress(currentAddress)) {
        addressCache.set(cacheKey, currentAddress);
        return { success: true, address: currentAddress };
      }

      // Get address from Google Maps
      const address = await reverseGeocode({ lat, lng });
      
      if (!address) {
        return { 
          success: false, 
          error: 'Could not get address from coordinates' 
        };
      }

      // Cache the address
      addressCache.set(cacheKey, address);

      // Update pandel address in backend if it's different or empty
      if (!currentAddress || currentAddress !== address) {
        const updateSuccess = await PandelService.updatePandelAddress(pandelId, address);
        
        if (!updateSuccess) {
          console.warn(`Failed to update address for pandel ${pandelId}`);
        }
      }

      return { success: true, address };

    } catch (error) {
      console.error('Error getting/updating address:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if an address is detailed enough (contains street info, city, etc.)
   */
  private static isDetailedAddress(address: string): boolean {
    // Consider an address detailed if it has at least 3 parts separated by commas
    // and contains some common address components
    const parts = address.split(',').map(part => part.trim());
    const hasStreetInfo = /\d/.test(address); // Contains numbers (likely street numbers)
    const hasCity = parts.some(part => 
      part.toLowerCase().includes('kolkata') || 
      part.toLowerCase().includes('howrah') ||
      part.toLowerCase().includes('west bengal')
    );
    
    return parts.length >= 3 && (hasStreetInfo || hasCity);
  }

  /**
   * Clear the address cache
   */
  static clearCache(): void {
    addressCache.clear();
  }

  /**
   * Get cached address for coordinates
   */
  static getCachedAddress(lat: number, lng: number): string | null {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    return addressCache.get(cacheKey) || null;
  }
}
