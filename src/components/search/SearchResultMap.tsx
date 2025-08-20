import React, { useState, useEffect, useMemo } from 'react';
import GoogleMapsViewer from '../../utils/google_map/GoogleMapsViewer';
import { getCurrentLocation } from '../../utils/google_map/GoogleMapsUtils';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface SearchResult {
  id: string;
  type: 'post' | 'resource';
  title: string;
  category: string;
  coordinates: Coordinates;
  urgencyLevel?: number;
  description?: string;
  [key: string]: any;
}

interface SearchResultMapProps {
  results: SearchResult[];
  onResultSelect?: (result: SearchResult) => void;
}

const SearchResultMap: React.FC<SearchResultMapProps> = ({ 
  results, 
  onResultSelect 
}) => {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 37.7749, lng: -122.4194 // Default to San Francisco
  });

  // Get user's current location on component mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          setMapCenter(location);
        }
      } catch (error) {
        console.log('Could not get user location, using default center');
        // Try to center on first result if available
        if (results.length > 0) {
          const firstResult = results.find(result => 
            result.coordinates && 
            typeof result.coordinates.latitude === 'number' && 
            typeof result.coordinates.longitude === 'number'
          );
          
          if (firstResult) {
            setMapCenter({
              lat: firstResult.coordinates.latitude,
              lng: firstResult.coordinates.longitude
            });
          }
        }
      }
    };

    getUserLocation();
  }, [results]);

  // Convert search results to markers format
  const markers = useMemo(() => {
    return results
      .filter(result => 
        result.coordinates && 
        typeof result.coordinates.latitude === 'number' && 
        typeof result.coordinates.longitude === 'number'
      )
      .map((result) => ({
        position: {
          lat: result.coordinates.latitude,
          lng: result.coordinates.longitude
        },
        color: getMarkerColor(result),
        title: result.title || 'No Title',
        description: createMarkerDescription(result),
        draggable: false
      }));
  }, [results]);

  // Handle marker clicks
  const handleMarkerClick = (position: { lat: number; lng: number }) => {
    // Find the result that matches this position
    const matchingResult = results.find(result => 
      result.coordinates &&
      Math.abs(result.coordinates.latitude - position.lat) < 0.0001 &&
      Math.abs(result.coordinates.longitude - position.lng) < 0.0001
    );
    
    if (matchingResult && onResultSelect) {
      onResultSelect(matchingResult);
    }
  };

  // Create marker description with HTML content
  const createMarkerDescription = (result: SearchResult): string => {
    const typeLabel = result.type === 'post' ? 'Request' : 'Resource';
    const urgencyBadge = result.urgencyLevel ? 
      `<div style="margin-top: 8px;">
        <span style="
          background-color: #fee2e2; 
          color: #dc2626; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 12px;
          font-weight: 500;
        ">
          Urgency: ${result.urgencyLevel}/5
        </span>
      </div>` : '';

    return `
      <div style="max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="margin-bottom: 8px;">
          <span style="
            background-color: #f3f4f6; 
            color: #374151; 
            padding: 2px 6px; 
            border-radius: 12px; 
            font-size: 12px;
            margin-right: 8px;
          ">
            ${result.category || 'Uncategorized'}
          </span>
          <span style="
            background-color: ${result.type === 'post' ? '#dbeafe' : '#dcfce7'}; 
            color: ${result.type === 'post' ? '#1e40af' : '#166534'}; 
            padding: 2px 6px; 
            border-radius: 12px; 
            font-size: 12px;
          ">
            ${typeLabel}
          </span>
        </div>
        ${result.description ? `
          <p style="
            margin: 8px 0; 
            color: #6b7280; 
            font-size: 14px; 
            line-height: 1.4;
          ">
            ${result.description.substring(0, 100)}${result.description.length > 100 ? '...' : ''}
          </p>
        ` : ''}
        ${urgencyBadge}
      </div>
    `;
  };

  // Get marker color based on result type and category
  const getMarkerColor = (result: SearchResult): string => {
    if (result.type === 'post') {
      // Color coding for different categories of requests
      switch (result.category) {
        case 'Medical': return '#dc2626'; // Red
        case 'Food': return '#ea580c'; // Orange
        case 'Transportation': return '#2563eb'; // Blue
        case 'Childcare': return '#7c3aed'; // Purple
        case 'Pet Care': return '#92400e'; // Brown
        case 'Household Items': return '#059669'; // Green
        case 'Technology': return '#6b7280'; // Gray
        case 'Education': return '#ca8a04'; // Yellow
        case 'Elderly Care': return '#db2777'; // Pink
        default: return '#374151'; // Default dark gray
      }
    } else {
      // Resources are green
      return '#16a34a'; 
    }
  };

  return (
    <div className="h-full w-full relative">
      <GoogleMapsViewer
        center={mapCenter}
        zoom={12}
        markers={markers}
        height="100%"
        showCurrentLocation={true}
        enableGeolocation={true}
        mapType="roadmap"
        showDirectionsButton={true}
        onMapClick={handleMarkerClick}
      />
      
      {results.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
          <div className="text-center p-6">
            <p className="text-gray-600 text-lg mb-2">No search results</p>
            <p className="text-gray-500 text-sm">Try adjusting your search criteria or location</p>
          </div>
        </div>
      )}
      
      {/* Results counter */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2">
        <span className="text-sm font-medium text-gray-700">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>
  );
};

export default SearchResultMap;
