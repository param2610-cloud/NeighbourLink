import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import GoogleMapsViewer from '@/utils/google_map/GoogleMapsViewer';
import {
  getCurrentLocation,
  geocodeAddress,
  reverseGeocode,
  calculateDistanceAndDuration,
  getDirectionUrls,
  type Coordinates
} from '@/utils/google_map/GoogleMapsUtils';

/**
 * Demo component showcasing Google Maps JavaScript API features
 * This demonstrates the implementation based on the guide provided
 */
const GoogleMapsDemo: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<Coordinates | null>(null);
  const [markers, setMarkers] = useState<Array<{
    position: Coordinates;
    color?: string;
    draggable?: boolean;
    title?: string;
    description?: string;
  }>>([]);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 22.5726, lng: 88.3639 }); // Kolkata
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get current location
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setStatus('Getting your location...');
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setMapCenter(location);
        
        // Add current location marker
        const newMarker = {
          position: location,
          color: '#4285F4',
          title: 'Your Current Location',
          description: 'This is your current location based on GPS'
        };
        setMarkers(prev => [newMarker, ...prev.filter(m => m.title !== 'Your Current Location')]);
        
        // Get address for current location
        const address = await reverseGeocode(location);
        setStatus(address || 'Location found');
      } else {
        setStatus('Unable to get your location. Please check permissions.');
      }
    } catch (error) {
      setStatus('Error getting location');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for address
  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return;
    
    setIsLoading(true);
    setStatus(`Searching for "${searchAddress}"...`);
    
    try {
      const coordinates = await geocodeAddress(searchAddress);
      if (coordinates) {
        setSearchResult(coordinates);
        setMapCenter(coordinates);
        
        // Add search result marker
        const newMarker = {
          position: coordinates,
          color: '#EA4335',
          title: 'Search Result',
          description: searchAddress
        };
        setMarkers(prev => [newMarker, ...prev.filter(m => m.title !== 'Search Result')]);
        
        setStatus(`Found: ${searchAddress}`);
        
        // Calculate distance if current location is available
        if (currentLocation) {
          const result = await calculateDistanceAndDuration(currentLocation, coordinates);
          if (result) {
            setStatus(`Found: ${searchAddress} - ${result.distance.text} away (${result.duration.text})`);
          }
        }
      } else {
        setStatus('Address not found. Please try a different search.');
      }
    } catch (error) {
      setStatus('Error searching for address');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map click
  const handleMapClick = async (position: Coordinates) => {
    const address = await reverseGeocode(position);
    const newMarker = {
      position,
      color: '#34A853',
      title: 'Clicked Location',
      description: address || 'Unknown location',
      draggable: true
    };
    setMarkers(prev => [newMarker, ...prev.filter(m => m.title !== 'Clicked Location')]);
    setStatus(`Clicked: ${address || 'Unknown location'}`);
  };

  // Handle marker drag
  const handleMarkerDrag = async (position: Coordinates, markerIndex: number) => {
    const address = await reverseGeocode(position);
    setMarkers(prev => prev.map((marker, index) => 
      index === markerIndex 
        ? { ...marker, position, description: address || 'Unknown location' }
        : marker
    ));
    setStatus(`Marker moved to: ${address || 'Unknown location'}`);
  };

  // Get directions
  const handleGetDirections = () => {
    if (currentLocation && searchResult) {
      const urls = getDirectionUrls(currentLocation, searchResult);
      window.open(urls.googleMaps, '_blank');
    } else {
      setStatus('Please set both current location and search for a destination');
    }
  };

  // Clear all markers
  const handleClearMarkers = () => {
    setMarkers([]);
    setStatus('All markers cleared');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Google Maps JavaScript API Demo
          </CardTitle>
          <CardDescription>
            Interactive demo showcasing Google Maps features including current location, 
            address search, markers, directions, and map interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
              Get My Location
            </Button>
            
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                placeholder="Enter address..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearchAddress}
                disabled={isLoading || !searchAddress.trim()}
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              onClick={handleGetDirections}
              disabled={!currentLocation || !searchResult}
              variant="outline"
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
            
            <Button 
              onClick={handleClearMarkers}
              variant="destructive"
              className="w-full"
            >
              Clear Markers
            </Button>
          </div>

          {/* Status */}
          {status && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
              {status}
            </div>
          )}

          {/* Map */}
          <div className="h-96 w-full border rounded-lg overflow-hidden">
            <GoogleMapsViewer
              center={mapCenter}
              zoom={13}
              markers={markers}
              height="100%"
              showCurrentLocation={false} // We're handling this manually
              onMapClick={handleMapClick}
              onMarkerDrag={handleMarkerDrag}
              showDirectionsButton={true}
              mapType="roadmap"
            />
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium">How to use:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Get My Location:</strong> Find and display your current location</li>
              <li><strong>Search:</strong> Enter an address to find and mark it on the map</li>
              <li><strong>Click on Map:</strong> Click anywhere to add a marker and get the address</li>
              <li><strong>Drag Markers:</strong> Green markers can be dragged to new locations</li>
              <li><strong>Get Directions:</strong> Get directions between your location and search result</li>
              <li><strong>Info Windows:</strong> Click markers to see detailed information</li>
            </ul>
          </div>

          {/* Marker List */}
          {markers.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Active Markers ({markers.length}):</h4>
              <div className="space-y-2">
                {markers.map((marker, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: marker.color || '#666' }}
                    />
                    <div>
                      <div className="font-medium">{marker.title}</div>
                      <div className="text-gray-600">{marker.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleMapsDemo;
