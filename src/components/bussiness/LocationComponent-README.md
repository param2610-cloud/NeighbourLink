# Business Location Component

This component provides comprehensive location management functionality for businesses in the NeighbourLink application.

## Features

- 🗺️ **Interactive Google Maps Integration** - Visual map display with clickable and draggable markers
- 📍 **Address Search** - Search for business addresses using Google Places API
- 🧭 **Current Location Detection** - Get current GPS location with one click
- ✏️ **Manual Address Input** - Type or edit business address manually
- 🎯 **Map Click Selection** - Click anywhere on the map to set business location
- 🔄 **Marker Dragging** - Drag markers to fine-tune location positioning
- 📊 **Coordinates Display** - Show exact latitude and longitude coordinates
- 🔗 **Direction Links** - Generate directions to business location
- ⚠️ **Validation Warnings** - Alert when location information is incomplete
- 📱 **Mobile Responsive** - Optimized for mobile and desktop devices

## Setup Instructions

### 1. Google Maps API Configuration

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
   - Places API (optional)

3. Create a `.env` file in your project root:
   ```env
   VITE_GOOGLE_MAP_API_KEY=your_google_maps_api_key_here
   ```

### 2. Component Integration

The LocationSection component is already integrated into the business module. It includes:

- **LocationSection.tsx** - Main location management component
- **GoogleMapsViewer.tsx** - Interactive map display component
- **GoogleMapsUtils.ts** - Utility functions for maps operations

## Usage

### In Business Profile

The LocationSection appears in the business profile editing interface, allowing business owners to:

1. **Set Initial Location:**
   - Search for their business address
   - Use current GPS location
   - Click on map to set location
   - Manually type address

2. **Update Location:**
   - Edit existing business location
   - Drag marker to adjust position
   - Update address information

3. **View Location:**
   - See business location on map
   - Get directions to business
   - View coordinate information

### Component Props

```tsx
interface LocationSectionProps {
  businessData: BusinessCollection;
  editingLocation: boolean;
  tempLocation: TempLocationInfo;
  loading: boolean;
  isLocationIncomplete: () => boolean;
  onEditLocation: () => void;
  onSaveLocation: () => void;
  onCancelLocation: () => void;
  onTempLocationChange: (updates: Partial<TempLocationInfo>) => void;
}
```

## Data Structure

### Business Location Data

```typescript
interface BusinessLocation {
  latitude: number;    // GPS latitude coordinate
  longitude: number;   // GPS longitude coordinate
  address: string;     // Formatted business address
}
```

### Temporary Location Data (During Editing)

```typescript
interface TempLocationInfo {
  latitude: number;
  longitude: number;
  address: string;
}
```

## Features in Detail

### 1. Address Search
- **Functionality:** Search for addresses using Google Places API
- **Implementation:** Uses `geocodeAddress()` utility function
- **User Experience:** Type address → Search → Auto-populate coordinates

### 2. Current Location Detection
- **Functionality:** Get user's current GPS coordinates
- **Implementation:** Uses browser's geolocation API with fallbacks
- **User Experience:** Click "Current" button → Auto-detect location

### 3. Interactive Map
- **Functionality:** Visual map interface with clickable interactions
- **Implementation:** Google Maps JavaScript API with custom markers
- **User Experience:** Click map → Set location, Drag marker → Adjust position

### 4. Manual Address Entry
- **Functionality:** Direct text input for business address
- **Implementation:** Textarea with real-time updates
- **User Experience:** Type address → Coordinates auto-update if valid

### 5. Validation and Warnings
- **Functionality:** Check for incomplete location information
- **Implementation:** `isLocationIncomplete()` utility function
- **User Experience:** Warning cards when location data is missing

## Error Handling

The component includes comprehensive error handling for:

- **Google Maps API Loading Errors**
- **Geolocation Permission Errors** 
- **Network Connectivity Issues**
- **Invalid Address Searches**
- **Firebase Save Errors**

## Mobile Optimization

- **Responsive Design:** Adapts to different screen sizes
- **Touch Gestures:** Supports touch interactions on mobile maps
- **Cooperative Gestures:** Prevents accidental map movements
- **Mobile-Friendly Forms:** Optimized input fields for mobile devices

## Security Considerations

- **API Key Security:** Environment variables for sensitive keys
- **Domain Restrictions:** Restrict API key usage to your domains
- **HTTPS Requirement:** Geolocation requires HTTPS in production
- **Input Validation:** Sanitize and validate all location inputs

## Performance Features

- **Lazy Loading:** Maps load only when needed
- **Cleanup:** Proper component cleanup prevents memory leaks
- **Debouncing:** Prevents excessive API calls during interactions
- **Caching:** Efficient re-rendering with proper dependencies

## Troubleshooting

### Common Issues

1. **Maps Not Loading**
   - Check API key configuration
   - Verify API quotas and billing
   - Check browser console for errors

2. **Geolocation Not Working**
   - Ensure HTTPS in production
   - Check browser location permissions
   - Verify browser compatibility

3. **Search Not Working**
   - Verify Geocoding API is enabled
   - Check API key restrictions
   - Test with known addresses

4. **Saving Errors**
   - Check Firebase configuration
   - Verify user permissions
   - Monitor network connectivity

### Debug Tips

- **Console Logging:** Component includes detailed console logs
- **Error Messages:** User-friendly error messages displayed
- **State Debugging:** Use React DevTools to inspect component state
- **Network Tab:** Monitor API requests in browser DevTools

## Future Enhancements

Potential improvements for the location component:

- **Place Autocomplete:** Real-time address suggestions
- **Business Hours:** Integration with location-based hours
- **Service Areas:** Define service radius around business
- **Multiple Locations:** Support for business chains
- **Offline Support:** Cache location data for offline viewing
- **Analytics:** Track location search patterns

## Dependencies

- **React:** Core UI framework
- **Google Maps API:** Map services and geocoding
- **Firebase:** Data persistence
- **Lucide Icons:** UI icons
- **React Router:** Navigation (indirect)
- **React Toastify:** User notifications

## Browser Support

- **Modern Browsers:** Chrome, Firefox, Safari, Edge
- **Mobile Browsers:** iOS Safari, Android Chrome
- **Geolocation:** Requires HTTPS for production
- **JavaScript:** ES6+ features required

---

This location component provides a complete solution for business location management with excellent user experience and robust error handling.
