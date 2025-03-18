import React, { useEffect, useRef, useState } from 'react';
import { OlaMapsInit } from './MapInit';

declare global {
  interface Window {
    OlaMaps: any;
  }
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface OlaMapsViewerProps {
  center?: Coordinates;
  zoom?: number;
  markers?: Array<{
    position: Coordinates;
    color?: string;
    draggable?: boolean;
    title?: string;
  }>;
  height?: string;
  onMarkerDrag?: (position: Coordinates) => void;
  onMapClick?: (position: Coordinates) => void;
  apiKey?: string;
}

const OlaMapsViewer: React.FC<OlaMapsViewerProps> = ({
  center = { lat: 12.931423492103944, lng: 77.61648476788898 },
  zoom = 15,
  markers = [],
  height = '300px',
  onMarkerDrag,
  onMapClick,
  apiKey = 'YOUR_API_KEY' // Replace with your API key or use from environment variable
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, ] = useState(false);
  
  // Load OlaMaps script dynamically


  // Initialize map when script is loaded
  useEffect(() => {
    
    try {
      
      const map = OlaMapsInit.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: mapContainerRef.current,
        center: [center.lng, center.lat],
        zoom: zoom,
      });
      
      mapInstanceRef.current = { map, OlaMapsInit };
      
      // Add click event to map
      if (onMapClick) {
        map.on('click', (e: any) => {
          onMapClick({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng
          });
        });
      }
      
      // Add markers
      markers.forEach(marker => {
        const olaMapsMarker = OlaMapsInit
          .addMarker({ 
            offset: [0, -20], 
            anchor: 'bottom', 
            color: marker.color || '#FF5252',
            draggable: marker.draggable || false 
          })
          .setLngLat([marker.position.lng, marker.position.lat])
          .addTo(map);
        
        if (marker.title) {
          olaMapsMarker.setPopup(
            OlaMapsInit.addPopup({ offset: [0, -30] })
              .setHTML(`<div style="padding: 8px;">${marker.title}</div>`)
          );
        }
        
        if (marker.draggable && onMarkerDrag) {
          olaMapsMarker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLngLat();
            onMarkerDrag({ lat, lng });
          });
        }
      });
      
      return () => {
        // Cleanup if needed
        map.remove();
      };
    } catch (error) {
      console.error('Error initializing OlaMaps:', error);
    }
  }, [mapLoaded, center, zoom, markers, onMarkerDrag, onMapClick, apiKey]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        width: '100%', 
        height: height, 
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {!mapLoaded && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0'
        }}>
          Loading map...
        </div>
      )}
    </div>
  );
};

export default OlaMapsViewer;
