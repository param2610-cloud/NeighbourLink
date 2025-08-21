import React, { useState, useEffect } from 'react';
import { Edit, MapPin, Navigation, Search, X } from 'lucide-react';
import GoogleMapsViewer from '@/utils/google_map/GoogleMapsViewer';
import { 
  geocodeAddress, 
  reverseGeocode, 
  getCurrentLocation,
  Coordinates 
} from '@/utils/google_map/GoogleMapsUtils';
import { BusinessCollection } from '../types';
import WarningCard from './WarningCard';

interface TempLocationInfo {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationSectionProps {
  businessData: BusinessCollection;
  editingLocation: boolean;
  tempLocation: TempLocationInfo;
  loading: boolean;
  isLocationIncomplete: () => boolean;
  onEditLocation: () => void;
  onSaveLocation: () => void;
  onCancelLocation: () => void;
  onTempLocationChange: (updates: Partial<TempLocationInfo>) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  businessData,
  editingLocation,
  tempLocation,
  loading,
  isLocationIncomplete,
  onEditLocation,
  onSaveLocation,
  onCancelLocation,
  onTempLocationChange,
}) => {
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force map re-render

  // Initialize temp location with current business location
  useEffect(() => {
    if (editingLocation && businessData.location && !tempLocation.address) {
      onTempLocationChange({
        latitude: businessData.location.latitude,
        longitude: businessData.location.longitude,
        address: businessData.location.address,
      });
    }
  }, [editingLocation, businessData.location, tempLocation.address, onTempLocationChange]);

  // Handle address search
  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) return;
    
    setIsSearching(true);
    try {
      const coordinates = await geocodeAddress(addressSearch);
      if (coordinates) {
        const fullAddress = await reverseGeocode(coordinates);
        onTempLocationChange({
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          address: fullAddress || addressSearch,
        });
        setMapKey(prev => prev + 1); // Force map update
        setAddressSearch('');
      } else {
        alert('Address not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      alert('Error searching for address. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle current location
  const handleGetCurrentLocation = async () => {
    setGettingCurrentLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        const address = await reverseGeocode(location);
        onTempLocationChange({
          latitude: location.lat,
          longitude: location.lng,
          address: address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        });
        setMapKey(prev => prev + 1); // Force map update
      } else {
        alert('Unable to get your current location. Please check your location permissions.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Error getting current location. Please try again.');
    } finally {
      setGettingCurrentLocation(false);
    }
  };

  // Handle map click to set location
  const handleMapClick = async (position: Coordinates) => {
    if (!editingLocation) return;
    
    try {
      const address = await reverseGeocode(position);
      onTempLocationChange({
        latitude: position.lat,
        longitude: position.lng,
        address: address || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Error getting address for location:', error);
      onTempLocationChange({
        latitude: position.lat,
        longitude: position.lng,
        address: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
      });
    }
  };

  // Handle marker drag
  const handleMarkerDrag = async (position: Coordinates) => {
    if (!editingLocation) return;
    
    try {
      const address = await reverseGeocode(position);
      onTempLocationChange({
        latitude: position.lat,
        longitude: position.lng,
        address: address || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Error getting address for dragged location:', error);
      onTempLocationChange({
        latitude: position.lat,
        longitude: position.lng,
        address: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
      });
    }
  };

  // Clear search suggestions
  const clearSuggestions = () => {
    setAddressSearch('');
  };

  // Get map center and markers for display
  const getMapCenter = (): Coordinates => {
    if (editingLocation && tempLocation.latitude && tempLocation.longitude) {
      return { lat: tempLocation.latitude, lng: tempLocation.longitude };
    }
    if (businessData.location?.latitude && businessData.location?.longitude) {
      return { lat: businessData.location.latitude, lng: businessData.location.longitude };
    }
    // Default to Bangalore coordinates
    return { lat: 12.931423492103944, lng: 77.61648476788898 };
  };

  const getMapMarkers = () => {
    const center = getMapCenter();
    return [{
      position: center,
      color: editingLocation ? '#F59E0B' : '#10B981', // Orange while editing, green when saved
      draggable: editingLocation,
      title: businessData.businessName || 'Business Location',
      description: editingLocation 
        ? 'Drag to adjust location or click on map to set new position' 
        : (businessData.location?.address || 'Business address'),
    }];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Business Location
          </h3>
          {!editingLocation && (
            <button
              onClick={onEditLocation}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Location
            </button>
          )}
        </div>

        {/* Location Missing Warning */}
        {isLocationIncomplete() && !editingLocation && (
          <WarningCard
            title="Business Location Missing"
            message="Add your business location so customers can find you easily."
            actionText="Add Location"
            onAction={onEditLocation}
            icon={<MapPin className="w-5 h-5 text-amber-600" />}
          />
        )}

        {editingLocation ? (
          <div className="space-y-6">
            {/* Address Search */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Search for an address..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                  />
                  {addressSearch && (
                    <button
                      onClick={clearSuggestions}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleAddressSearch}
                  disabled={isSearching || !addressSearch.trim()}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={gettingCurrentLocation}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {gettingCurrentLocation ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  Current
                </button>
              </div>

              {/* Manual Address Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Address
                </label>
                <textarea
                  value={tempLocation.address}
                  onChange={(e) => onTempLocationChange({ address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your business address"
                  rows={3}
                />
              </div>

              {/* Coordinates Display */}
              {tempLocation.latitude && tempLocation.longitude && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Coordinates:</span> {tempLocation.latitude.toFixed(6)}, {tempLocation.longitude.toFixed(6)}
                </div>
              )}
            </div>

            {/* Interactive Map */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location Map (Click or drag marker to adjust)
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <GoogleMapsViewer
                  key={mapKey}
                  center={getMapCenter()}
                  zoom={15}
                  markers={getMapMarkers()}
                  height="400px"
                  onMapClick={handleMapClick}
                  onMarkerDrag={handleMarkerDrag}
                  showCurrentLocation={true}
                  mapType="roadmap"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                💡 Tip: Click anywhere on the map to set your business location, or drag the marker to fine-tune the position.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={onSaveLocation}
                disabled={loading || !tempLocation.latitude || !tempLocation.longitude}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Save Location'
                )}
              </button>
              <button
                onClick={onCancelLocation}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Location Display */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 mt-1">
                    {businessData.location?.address || 'Not provided'}
                  </div>
                  {businessData.location?.latitude && businessData.location?.longitude && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {businessData.location.latitude.toFixed(6)}, {businessData.location.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              {/* Map View */}
              {businessData.location?.latitude && businessData.location?.longitude && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <GoogleMapsViewer
                    center={getMapCenter()}
                    zoom={15}
                    markers={getMapMarkers()}
                    height="300px"
                    showDirectionsButton={true}
                    mapType="roadmap"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSection;
