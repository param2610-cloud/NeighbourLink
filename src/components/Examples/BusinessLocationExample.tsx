import React from 'react';
import GoogleMapsViewer from '@/utils/google_map/GoogleMapsViewer';
import { 
  geocodeAddress, 
  getCurrentLocation, 
  calculateDistanceAndDuration 
} from '@/utils/google_map/GoogleMapsUtils';

/**
 * Example component demonstrating Google Maps integration
 * with business location features
 */
const BusinessLocationExample: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = React.useState({
    lat: 12.931423492103944,
    lng: 77.61648476788898
  });
  const [address, setAddress] = React.useState('');
  const [distance, setDistance] = React.useState<string>('');

  // Example: Search for address and update map
  const handleAddressSearch = async () => {
    if (!address) return;
    
    const coordinates = await geocodeAddress(address);
    if (coordinates) {
      setSelectedLocation(coordinates);
    } else {
      alert('Address not found');
    }
  };

  // Example: Get current location
  const handleGetCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setSelectedLocation(location);
      
      // Calculate distance from a reference point (e.g., city center)
      const cityCenter = { lat: 12.9716, lng: 77.5946 }; // Bangalore
      const result = await calculateDistanceAndDuration(location, cityCenter);
      if (result) {
        setDistance(`${result.distance.text} from city center`);
      }
    }
  };

  // Example markers for business locations
  const businessMarkers = [
    {
      position: selectedLocation,
      color: '#10B981',
      title: 'Your Business',
      description: 'This is where your business is located',
      draggable: true,
    },
    {
      position: { lat: 12.9716, lng: 77.5946 },
      color: '#3B82F6',
      title: 'City Center',
      description: 'Bangalore city center reference point',
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Business Location Example</h1>
      
      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Location Controls</h2>
        
        <div className="space-y-4">
          {/* Address Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Search for an address..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
            />
            <button
              onClick={handleAddressSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
          
          {/* Current Location */}
          <button
            onClick={handleGetCurrentLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Use Current Location
          </button>
          
          {/* Distance Info */}
          {distance && (
            <div className="text-sm text-gray-600">
              📍 {distance}
            </div>
          )}
        </div>
      </div>
      
      {/* Location Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Selected Location</h2>
        <div className="space-y-2">
          <div><strong>Latitude:</strong> {selectedLocation.lat.toFixed(6)}</div>
          <div><strong>Longitude:</strong> {selectedLocation.lng.toFixed(6)}</div>
        </div>
      </div>
      
      {/* Interactive Map */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Interactive Map</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click on the map to set a new location, or drag the green marker to adjust.
        </p>
        
        <GoogleMapsViewer
          center={selectedLocation}
          zoom={13}
          markers={businessMarkers}
          height="400px"
          onMapClick={setSelectedLocation}
          onMarkerDrag={(position) => setSelectedLocation(position)}
          showCurrentLocation={true}
          showDirectionsButton={true}
          mapType="roadmap"
        />
      </div>
      
      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">How to Use</h2>
        <ul className="text-blue-700 space-y-1">
          <li>• Search for an address in the search box</li>
          <li>• Click "Use Current Location" to get your GPS position</li>
          <li>• Click anywhere on the map to set a new location</li>
          <li>• Drag the green marker to fine-tune the position</li>
          <li>• Click on markers to see location details</li>
        </ul>
      </div>
    </div>
  );
};

export default BusinessLocationExample;
