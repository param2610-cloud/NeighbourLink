import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

interface LocationViewerProps {
  lat: string;
  lon: string;
  onError?: () => void;
}

const LocationViewer = ({ lat, lon }: LocationViewerProps) => {
  const [address, setAddress] = useState("");
  
  // Fetch address using Nominatim
  useEffect(() => {
    if (lat && lon) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name))
        .catch(() => setAddress("Unable to fetch address"));
    }
  }, [lat, lon]);

  // Generate map URL for an iframe
  const mapUrl = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    if (isNaN(latitude) || isNaN(longitude)) return null;
    
    // Using OpenStreetMap for the map
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.005}%2C${longitude + 0.005}%2C${latitude + 0.005}&marker=${latitude}%2C${longitude}`;
  };

  return (
    <div className="rounded-lg overflow-hidden border relative" 
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
      
      {/* Map container - Using iframe for simplicity */}
      <div className="relative h-64" style={{ minHeight: '250px' }}>
        {mapUrl() ? (
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            marginHeight={0} 
            marginWidth={0} 
            src={mapUrl() || undefined}
            title="Location Map"
            style={{ border: "none" }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/70 dark:bg-gray-800/70 z-10">
            <p className="text-red-500 font-medium">Invalid coordinates</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationViewer;