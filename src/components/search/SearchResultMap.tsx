import React, { useState, useEffect, useRef } from 'react';
import { initMap } from '../../utils/ola/MapInit';
import { addMarker, MarkerOptions } from '../../utils/ola/MapMarkers';

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
  [key: string]: any;
}

interface SearchResultMapProps {
  results: SearchResult[];
}

const SearchResultMap: React.FC<SearchResultMapProps> = ({ results }) => {
  const [, setSelectedResult] = useState<SearchResult | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -122.4194, 37.7749 
  ]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
   
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const initializeMap = async () => {
      try {
        const mapInstance = await initMap('map-container', mapCenter);
        mapInstanceRef.current = mapInstance;
        
        
        if (results.length > 0) {
          addMarkers();
        }
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    
    initializeMap();
    
    return () => {
      
      markersRef.current.forEach(marker => {
        if (marker && marker.remove) {
          marker.remove();
        }
      });
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, [mapContainerRef]);
  
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [
            position.coords.longitude, 
            position.coords.latitude
          ];
          setMapCenter(newCenter);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newCenter);
          }
        },
        () => {
          
          if (results.length > 0) {
            const validResult = results.find(result => 
              result.coordinates && 
              typeof result.coordinates.longitude === 'number' && 
              typeof result.coordinates.latitude === 'number'
            );
            
            if (validResult) {
              const newCenter: [number, number] = [
                validResult.coordinates.longitude,
                validResult.coordinates.latitude
              ];
              setMapCenter(newCenter);
              
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(newCenter);
              }
            }
          }
        }
      );
    }
  }, []);
  
  
  useEffect(() => {
    if (mapInstanceRef.current && results.length > 0) {
      addMarkers();
    }
  }, [results, mapInstanceRef.current]);
  
  
  const addMarkers = () => {
    
    markersRef.current.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    markersRef.current = [];
    
    
    results.forEach(result => {
      
      if (!result.coordinates || 
          typeof result.coordinates.latitude !== 'number' || 
          typeof result.coordinates.longitude !== 'number') {
        console.warn("Skipping marker with invalid coordinates:", result);
        return;
      }
      
      const popupContent = `
        <div class="p-2 max-w-[200px]">
          <h3 class="font-medium text-sm">${result.title || 'No Title'}</h3>
          <p class="text-xs text-gray-600 mt-1">
            ${result.category || 'Uncategorized'} • ${result.type === 'post' ? 'Request' : 'Resource'}
          </p>
          ${result.urgencyLevel ? `
            <div class="mt-1">
              <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Urgency: ${result.urgencyLevel}/5
              </span>
            </div>
          ` : ''}
        </div>
      `;
      
      const markerColor = getMarkerColor(result);
      
      try {
        const markerOptions: MarkerOptions = {
          coordinates: [result.coordinates.longitude, result.coordinates.latitude],
          color: markerColor,
          popup: {
            content: popupContent,
            closeOnClick: true
          }
        };
        
        const marker = addMarker(mapInstanceRef.current, markerOptions);
        if (marker) {
          markersRef.current.push(marker);
          
          
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.addEventListener('click', () => {
              setSelectedResult(result);
            });
          }
        }
      } catch (error) {
        console.error("Error adding marker:", error, result);
      }
    });
  };
  
  
  const getMarkerColor = (result: SearchResult) => {
    if (result.type === 'post') {
      
      switch (result.category) {
        case 'Medical': return '#FF0000'; 
        case 'Food': return '#FFA500'; 
        case 'Transportation': return '#0000FF'; 
        case 'Childcare': return '#800080'; 
        case 'Pet Care': return '#A52A2A'; 
        case 'Household Items': return '#008000'; 
        case 'Technology': return '#808080'; 
        case 'Education': return '#FFFF00'; 
        case 'Elderly Care': return '#FFC0CB'; 
        default: return '#000000'; 
      }
    } else {
      
      return '#00C853'; 
    }
  };

  return (
    <div className="h-full w-full relative">
      <div id="map-container" ref={mapContainerRef} className="h-full w-full" />
      
      {!mapInstanceRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <p>Loading map...</p>
        </div>
      )}
      
      {results.length === 0 && mapInstanceRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <p>No results to display on the map</p>
        </div>
      )}
    </div>
  );
};

export default SearchResultMap;
