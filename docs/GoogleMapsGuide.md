# Google Maps Integration Guide

This guide explains how to implement Google Maps JavaScript API features in your React application, based on best practices and the components we've created.

## 🚀 Features Implemented

- ✅ **Basic Map Display** - Show Google Maps with custom center and zoom
- ✅ **Markers** - Add custom markers with colors, icons, and info windows
- ✅ **Current Location** - Get and display user's current location
- ✅ **Address Search** - Geocoding and reverse geocoding
- ✅ **Distance Calculation** - Calculate distance and duration between points
- ✅ **Interactive Features** - Map clicks, marker dragging, info windows
- ✅ **Directions** - Generate direction URLs for Google Maps and Apple Maps
- ✅ **Error Handling** - Proper error handling for API failures
- ✅ **TypeScript Support** - Full TypeScript definitions

## 📁 File Structure

```
src/
├── components/
│   ├── events/
│   │   ├── EventDetailsPanel.tsx      # Event details with map
│   │   └── LocationInfo.tsx           # Distance and directions component
│   └── examples/
│       └── GoogleMapsDemo.tsx         # Complete demo component
├── utils/google_map/
│   ├── GoogleMapsViewer.tsx           # Main map component
│   ├── GoogleMapsUtils.ts             # Utility functions
│   └── MapInit.ts                     # Map initialization utilities
```

## 🔧 Setup

### 1. Environment Variables

Add your Google Maps API key to your `.env` file:

```env
VITE_GOOGLE_MAP_API_KEY=your_google_maps_api_key_here
```

### 2. API Key Configuration

Make sure your Google Maps API key has the following APIs enabled:
- Maps JavaScript API
- Geocoding API
- Distance Matrix API
- Places API (optional)

## 🛠️ Usage Examples

### Basic Map Display

```tsx
import GoogleMapsViewer from '@/utils/google_map/GoogleMapsViewer';

function MyMapComponent() {
  return (
    <GoogleMapsViewer
      center={{ lat: 22.5726, lng: 88.3639 }}
      zoom={15}
      height="400px"
    />
  );
}
```

### Map with Markers

```tsx
const markers = [
  {
    position: { lat: 22.5726, lng: 88.3639 },
    color: '#4CAF50',
    title: 'Kolkata',
    description: 'City of Joy'
  },
  {
    position: { lat: 22.5825, lng: 88.3700 },
    color: '#F44336',
    title: 'Victoria Memorial',
    description: 'Historic monument'
  }
];

<GoogleMapsViewer
  center={{ lat: 22.5726, lng: 88.3639 }}
  zoom={13}
  markers={markers}
  height="400px"
  showCurrentLocation={true}
  showDirectionsButton={true}
/>
```

### Using Utility Functions

```tsx
import {
  getCurrentLocation,
  geocodeAddress,
  calculateDistanceAndDuration,
  getDirectionUrls
} from '@/utils/google_map/GoogleMapsUtils';

// Get current location
const currentLoc = await getCurrentLocation();

// Search for address
const coordinates = await geocodeAddress('Times Square, New York');

// Calculate distance
const result = await calculateDistanceAndDuration(
  { lat: 40.7128, lng: -74.0060 }, // New York
  { lat: 34.0522, lng: -118.2437 }  // Los Angeles
);

// Get direction URLs
const urls = getDirectionUrls(fromLocation, toLocation);
window.open(urls.googleMaps, '_blank');
```

### Event Location with Distance Info

```tsx
import LocationInfo from '@/components/events/LocationInfo';

function EventDetails({ event }) {
  return (
    <div>
      <h2>{event.title}</h2>
      
      {/* Show distance and directions */}
      <LocationInfo 
        eventLocation={{ 
          lat: event.location.latitude, 
          lng: event.location.longitude 
        }}
        eventTitle={event.title}
      />
      
      {/* Show map */}
      <GoogleMapsViewer
        center={{ lat: event.location.latitude, lng: event.location.longitude }}
        markers={[{
          position: { lat: event.location.latitude, lng: event.location.longitude },
          title: event.title,
          description: event.description
        }]}
        showCurrentLocation={true}
        showDirectionsButton={true}
      />
    </div>
  );
}
```

## 🎛️ Component Props

### GoogleMapsViewer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `Coordinates` | Kolkata coords | Map center point |
| `zoom` | `number` | `15` | Initial zoom level |
| `markers` | `MarkerData[]` | `[]` | Array of markers to display |
| `height` | `string` | `'300px'` | Map container height |
| `showCurrentLocation` | `boolean` | `false` | Show user's current location |
| `enableGeolocation` | `boolean` | `true` | Enable geolocation features |
| `mapType` | `string` | `'roadmap'` | Map type (roadmap, satellite, etc.) |
| `showDirectionsButton` | `boolean` | `false` | Show directions in info windows |
| `onMapClick` | `function` | - | Callback for map clicks |
| `onMarkerDrag` | `function` | - | Callback for marker drag |

### MarkerData Interface

```tsx
interface MarkerData {
  position: { lat: number; lng: number };
  color?: string;           // Hex color for marker
  draggable?: boolean;      // Whether marker can be dragged
  title?: string;          // Marker title
  description?: string;    // Additional description
  icon?: string;          // Custom icon URL
}
```

## 🔍 Available Utility Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `getCurrentLocation()` | Get user's current location | `Promise<Coordinates \| null>` |
| `geocodeAddress(address)` | Convert address to coordinates | `Promise<Coordinates \| null>` |
| `reverseGeocode(coords)` | Convert coordinates to address | `Promise<string \| null>` |
| `calculateDistanceAndDuration(from, to)` | Calculate distance and travel time | `Promise<{distance, duration} \| null>` |
| `getDirectionUrls(from, to)` | Generate direction URLs | `{googleMaps: string, appleMaps: string}` |
| `calculateStraightLineDistance(p1, p2)` | Calculate straight-line distance in km | `number` |
| `isValidCoordinates(coords)` | Validate coordinate object | `boolean` |

## 🎨 Styling and Customization

### Custom Map Styles

```tsx
const darkMapStyles = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#242f3e"}]
  },
  // ... more styles
];

<GoogleMapsViewer
  styles={darkMapStyles}
  mapType="roadmap"
/>
```

### Custom Marker Icons

```tsx
const markers = [
  {
    position: { lat: 22.5726, lng: 88.3639 },
    icon: '/path/to/custom-icon.png',
    title: 'Custom Icon Marker'
  }
];
```

## 🚨 Error Handling

The components include comprehensive error handling:

- **API Loading Errors**: Displays error message if Google Maps fails to load
- **Geolocation Errors**: Handles permission denied and other location errors
- **Geocoding Errors**: Graceful fallback when address lookup fails
- **Network Errors**: Proper error states for network issues

## 📱 Mobile Considerations

- **Touch Gestures**: Maps use `gestureHandling: 'cooperative'` for better mobile experience
- **Responsive Design**: Components are fully responsive
- **Performance**: Lazy loading and cleanup to prevent memory leaks

## 🔐 Security Best Practices

1. **API Key Security**: Store API keys in environment variables
2. **Domain Restrictions**: Restrict API key usage to your domains
3. **API Quotas**: Monitor and set appropriate quotas
4. **HTTPS Only**: Geolocation requires HTTPS in production

## 📊 Performance Tips

1. **Lazy Loading**: Maps are loaded only when needed
2. **Marker Cleanup**: Proper cleanup prevents memory leaks
3. **Debounced Search**: Implement debouncing for address search
4. **Efficient Re-renders**: Components use proper dependency arrays

## 🧪 Testing

For testing components that use Google Maps:

```tsx
// Mock Google Maps API for tests
global.google = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    InfoWindow: jest.fn(),
    // ... other mocks
  }
};
```

## 📚 Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps Integration Guide](https://developers.google.com/maps/documentation/javascript/react-map)
- [Google Maps API Key Setup](https://developers.google.com/maps/gmp-get-started)

## 🤝 Contributing

When contributing to the Google Maps integration:

1. Follow TypeScript best practices
2. Add proper error handling
3. Include cleanup in useEffect hooks
4. Test with different locations and edge cases
5. Update documentation for new features

---

This integration provides a solid foundation for Google Maps functionality in your React application. The components are designed to be reusable, well-documented, and production-ready.
