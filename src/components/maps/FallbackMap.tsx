import React from 'react';

interface FallbackMapProps {
  lat: number;
  lng: number;
  location?: string;
  zoom?: number;
  width?: number;
  height?: number;
}

const FallbackMap: React.FC<FallbackMapProps> = ({
  lat,
  lng,
  location,
  zoom = 15,
  width = 600,
  height = 300
}) => {
  // For security, you might want to move this to an environment variable
  const apiKey = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with your Google Maps API key
  
  // Create Google Maps Static API URL
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
  
  // Fallback map without API key
  const fallbackDisplay = (
    <div className="border rounded-lg p-4 bg-gray-100 dark:bg-gray-700 text-center">
      <div className="text-lg font-medium mb-2">Location</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {location || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
      </div>
    </div>
  );

  return (
    <div className="w-full rounded-lg overflow-hidden">
      {apiKey !== "YOUR_GOOGLE_MAPS_API_KEY" ? (
        <img 
          src={mapUrl} 
          alt={`Map showing location at ${location || `${lat}, ${lng}`}`}
          className="w-full h-auto object-cover"
        />
      ) : (
        fallbackDisplay
      )}
    </div>
  );
};

export default FallbackMap;
