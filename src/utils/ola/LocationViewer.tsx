import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { OlaMapsInit } from "./MapInit";

interface LocationViewerProps {
  lat: string;
  lon: string;
  onError?: () => void;
}

const LocationViewer = ({ lat, lon, onError }: LocationViewerProps) => {
  const [address, setAddress] = useState("");
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [hasMapError, setHasMapError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMapError = (error?: any) => {
    console.error("Map loading error:", error);
    setHasMapError(true);
    setIsMapLoading(false);
    if (onError) onError();
  };
  
  useEffect(() => {
    if (lat && lon && mapRef.current && !mapInstanceRef.current) {
      // Set a timeout to detect if map fails to load correctly
      timeoutRef.current = setTimeout(() => {
        if (!mapInstanceRef.current || isMapLoading) {
          handleMapError("Map failed to load within timeout period");
        }
      }, 10000); // 10-second timeout
      
      try {
        // Initialize map
        mapInstanceRef.current = OlaMapsInit.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
          container: 'map',
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 15,
        });

        // Add error handler to map instance
        mapInstanceRef.current.on('error', handleMapError);

        // Add a marker after map is initialized
        mapInstanceRef.current.on('load', () => {
          setIsMapLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          if (!markerRef.current && mapInstanceRef.current) {
            try {
              markerRef.current = OlaMapsInit
                .addMarker({ 
                  offset: [0, -15], 
                  anchor: 'bottom', 
                  color: '#FF5733',
                  isDragging: true
                })
                .setLngLat([parseFloat(lon), parseFloat(lat)])
                .addTo(mapInstanceRef.current);
            } catch (error) {
              console.error("Error adding marker:", error);
            }
          }
        });
      } catch (error) {
        handleMapError(error);
      }
    }
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error("Error removing map:", error);
        }
      }
    };
  }, [lat, lon]);
  
  // Update map center and marker position when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && lat && lon) {
      try {
        const coords = [parseFloat(lon), parseFloat(lat)];
        mapInstanceRef.current.setCenter(coords);
        
        // Update marker position if it exists
        if (markerRef.current) {
          markerRef.current.setLngLat(coords);
        }
      } catch (error) {
        console.error("Error updating map position:", error);
      }
    }
  }, [lat, lon]);

  // Fetch address using Nominatim API instead of relying on Olamaps
  useEffect(() => {
    if (lat && lon) {
      // Reverse geocoding using Nominatim API
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name))
        .catch(() => setAddress("Unable to fetch address"));
    }
  }, [lat, lon]);

  return (
    <div className="rounded-lg overflow-hidden border" 
         style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="p-4 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="font-medium">Location</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <span className="font-medium">Latitude:</span> 
            <span>{parseFloat(lat)?.toFixed(6) || 'N/A'}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="font-medium">Longitude:</span>
            <span>{parseFloat(lon)?.toFixed(6) || 'N/A'}</span>
          </p>
          <p className="text-xs mt-2 break-words">
            {address || 'Fetching address...'}
          </p>
        </div>
      </div>
      
      {/* Map container */}
      <div 
        id="map" 
        ref={mapRef} 
        className="w-full h-64"
        style={{ minHeight: '250px' }}
      />
      
      {/* Loading or error overlay */}
      {isMapLoading && (
        <div className="absolute inset-0 bg-gray-100/70 dark:bg-gray-800/70 flex items-center justify-center">
          <p>Loading map...</p>
        </div>
      )}
      
      {hasMapError && (
        <div className="absolute inset-0 bg-gray-100/70 dark:bg-gray-800/70 flex items-center justify-center">
          <p className="text-red-500">Failed to load map</p>
        </div>
      )}
    </div>
  );
};

export default LocationViewer;