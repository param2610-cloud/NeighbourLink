import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface MarkerData {
  position: Coordinates;
  color?: string;
  draggable?: boolean;
  title?: string;
  description?: string;
  icon?: string; // Custom icon URL
}

interface GoogleMapsViewerProps {
  center?: Coordinates;
  zoom?: number;
  markers?: MarkerData[];
  height?: string;
  onMarkerDrag?: (position: Coordinates, markerIndex: number) => void;
  onMapClick?: (position: Coordinates) => void;
  showCurrentLocation?: boolean;
  enableGeolocation?: boolean;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  styles?: any[]; // Custom map styles
  showDirectionsButton?: boolean;
}

const GoogleMapsViewer: React.FC<GoogleMapsViewerProps> = ({
  center = { lat: 12.931423492103944, lng: 77.61648476788898 },
  zoom = 15,
  markers = [],
  height = '300px',
  onMarkerDrag,
  onMapClick,
  showCurrentLocation = false,
  enableGeolocation = true,
  mapType = 'roadmap',
  styles = [],
  showDirectionsButton = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentLocationMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current location if enabled
  useEffect(() => {
    if (showCurrentLocation && enableGeolocation && isLoaded) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(userLocation);
            
            // Add current location marker
            if (mapInstanceRef.current) {
              // Remove existing current location marker
              if (currentLocationMarkerRef.current) {
                currentLocationMarkerRef.current.setMap(null);
              }

              const currentLocationMarker = new window.google.maps.Marker({
                position: userLocation,
                map: mapInstanceRef.current,
                title: 'Your Current Location',
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                  scale: 10,
                },
                zIndex: 1000, // Make sure it appears on top
              });

              currentLocationMarkerRef.current = currentLocationMarker;
              
              // Optionally center map on user location if no center provided
              if (!center || (center.lat === 12.931423492103944 && center.lng === 77.61648476788898)) {
                mapInstanceRef.current.setCenter(userLocation);
                mapInstanceRef.current.setZoom(15);
              }
            }
          },
          (error) => {
            console.error('Error getting current location:', error);
            setLocationError('Unable to retrieve your location');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        setLocationError('Geolocation is not supported by this browser');
      }
    }
  }, [showCurrentLocation, enableGeolocation, isLoaded, center]);

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
    if (!apiKey) {
      setLoadError('Google Maps API key not found');
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setLoadError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts before loading
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google) return;

    try {
      // Initialize map with enhanced options
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeId: mapType,
        styles: styles.length > 0 ? styles : undefined,
        gestureHandling: 'cooperative', // Better mobile experience
      });

      mapInstanceRef.current = map;

      // Add click event listener
      if (onMapClick) {
        map.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          onMapClick({ lat, lng });
        });
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add markers with enhanced features
      markers.forEach((markerData, index) => {
        // Create custom icon if color is specified
        let iconConfig;
        if (markerData.icon) {
          // Custom icon URL
          iconConfig = {
            url: markerData.icon,
            scaledSize: new window.google.maps.Size(32, 32),
          };
        } else if (markerData.color) {
          // Custom colored circle marker
          iconConfig = {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: markerData.color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
          };
        }

        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map: map,
          title: markerData.title || `Marker ${index + 1}`,
          draggable: markerData.draggable || false,
          icon: iconConfig,
          animation: window.google.maps.Animation.DROP, // Nice drop animation
        });

        // Add drag event listener with marker index
        if (markerData.draggable && onMarkerDrag) {
          marker.addListener('dragend', (event: any) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            onMarkerDrag({ lat, lng }, index);
          });
        }

        // Enhanced info window with description
        if (markerData.title || markerData.description) {
          const contentString = `
            <div style="padding: 12px; max-width: 250px; font-family: Arial, sans-serif;">
              ${markerData.title ? `<h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${markerData.title}</h3>` : ''}
              ${markerData.description ? `<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${markerData.description}</p>` : ''}
              ${showDirectionsButton ? `
                <div style="margin-top: 10px;">
                  <a 
                    href="https://www.google.com/maps/dir/?api=1&destination=${markerData.position.lat},${markerData.position.lng}" 
                    target="_blank" 
                    style="
                      display: inline-block;
                      padding: 6px 12px;
                      background-color: #4285F4;
                      color: white;
                      text-decoration: none;
                      border-radius: 4px;
                      font-size: 12px;
                    "
                  >
                    Get Directions
                  </a>
                </div>
              ` : ''}
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: contentString,
          });

          marker.addListener('click', () => {
            // Close other info windows
            markersRef.current.forEach(m => {
              if (m.infoWindow) {
                m.infoWindow.close();
              }
            });
            infoWindow.open(map, marker);
          });

          // Store reference to info window for cleanup
          (marker as any).infoWindow = infoWindow;
        }

        markersRef.current.push(marker);
      });

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setLoadError('Failed to initialize map');
    }
  }, [isLoaded, center, zoom, markers, onMarkerDrag, onMapClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all markers
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
        // Clean up info windows
        if ((marker as any).infoWindow) {
          (marker as any).infoWindow.close();
        }
      });
      
      // Clean up current location marker
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
      }
    };
  }, []);

  // Display location error if any
  if (locationError && showCurrentLocation) {
    console.warn('Location Error:', locationError);
  }

  // Display current location info for debugging (can be removed in production)
  if (currentLocation && showCurrentLocation) {
    console.log('Current Location:', currentLocation);
  }

  if (loadError) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: height, 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          color: '#666'
        }}
      >
        {loadError}
      </div>
    );
  }

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
      {!isLoaded && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#666'
        }}>
          Loading Google Maps...
        </div>
      )}
    </div>
  );
};

export default GoogleMapsViewer;
