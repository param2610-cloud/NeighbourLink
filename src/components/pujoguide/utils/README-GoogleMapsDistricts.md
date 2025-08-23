# District Filtering with Google Maps Integration

This document explains how to use Google Maps reverse geocoding to filter pandals by district when you don't have district information in your database.

## Overview

The enhanced `locationUtils.ts` provides functions to:
1. Get district information from coordinates using Google Maps Geocoding API
2. Filter pandals by district using real-time reverse geocoding
3. Enrich pandal data with dynamic district information
4. Provide fallback to static district data

## Prerequisites

1. **Google Maps API Key**: Ensure you have `VITE_GOOGLE_MAP_API_KEY` set in your environment
2. **Google Maps API**: The Geocoding API should be enabled for your project
3. **Internet Connection**: Required for real-time reverse geocoding

## Key Functions

### 1. `getDistrictFromCoordinates(lat, lng)`
Gets district information from coordinates using Google Maps reverse geocoding.

```typescript
const districtInfo = await getDistrictFromCoordinates(22.5726, 88.3639);
// Returns: { district: "Kolkata", state: "West Bengal", city: "Kolkata", fullAddress: "..." }
```

### 2. `filterByDistrictWithGeocoding(pandals, targetDistrict)`
Filters pandals by district using reverse geocoding.

```typescript
const kolkataPandals = await filterByDistrictWithGeocoding(pandalData, "Kolkata");
```

### 3. `enrichPandalsWithDistricts(pandals)`
Enriches all pandals with dynamic district information.

```typescript
const enrichedPandals = await enrichPandalsWithDistricts(pandalData);
// Each pandal will have a 'dynamicDistrict' property
```

### 4. `getAvailableDistrictsWithGeocoding(pandals)`
Gets all available districts using reverse geocoding.

```typescript
const districts = await getAvailableDistrictsWithGeocoding(pandalData);
// Returns: ["Kolkata", "Howrah", "Midnapore", "Burdwan"]
```

### 5. `smartDistrictFilter(pandals, targetDistrict, useGeocoding)`
Smart filter that can use either geocoding or static data.

```typescript
// With geocoding
const filtered1 = await smartDistrictFilter(pandals, "Kolkata", true);

// Without geocoding (uses static district field)
const filtered2 = await smartDistrictFilter(pandals, "Kolkata", false);
```

## Usage Examples

### Basic Implementation

```typescript
import { 
  filterByDistrictWithGeocoding,
  getAvailableDistrictsWithGeocoding 
} from './utils/locationUtils';
import { pandalData } from './data/pandalData';

// Get available districts
const districts = await getAvailableDistrictsWithGeocoding(pandalData);

// Filter by district
const kolkataPandals = await filterByDistrictWithGeocoding(pandalData, "Kolkata");
```

### React Component Example

```typescript
const [pandals, setPandals] = useState(pandalData);
const [districts, setDistricts] = useState([]);
const [selectedDistrict, setSelectedDistrict] = useState('');

// Load districts on mount
useEffect(() => {
  const loadDistricts = async () => {
    const availableDistricts = await getAvailableDistrictsWithGeocoding(pandalData);
    setDistricts(availableDistricts);
  };
  loadDistricts();
}, []);

// Filter handler
const handleDistrictChange = async (district) => {
  if (district) {
    const filtered = await filterByDistrictWithGeocoding(pandalData, district);
    setPandals(filtered);
  } else {
    setPandals(pandalData);
  }
  setSelectedDistrict(district);
};
```

## Performance Considerations

1. **API Rate Limits**: Google Maps Geocoding API has rate limits. The `enrichPandalsWithDistricts` function includes a 100ms delay between requests.

2. **Caching**: Consider caching district information to avoid repeated API calls:

```typescript
// Simple cache implementation
const districtCache = new Map();

const getCachedDistrict = async (lat, lng) => {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (districtCache.has(key)) {
    return districtCache.get(key);
  }
  
  const result = await getDistrictFromCoordinates(lat, lng);
  districtCache.set(key, result);
  return result;
};
```

3. **Fallback Strategy**: Always provide fallback to static data when API fails:

```typescript
const getDistrictSafely = async (pandal) => {
  try {
    const dynamicDistrict = await getDistrictFromCoordinates(
      pandal.coordinates.lat, 
      pandal.coordinates.lng
    );
    return dynamicDistrict?.district || pandal.district || 'Unknown';
  } catch (error) {
    return pandal.district || 'Unknown';
  }
};
```

## Error Handling

The functions include comprehensive error handling:

```typescript
try {
  const districts = await getAvailableDistrictsWithGeocoding(pandals);
  // Use districts
} catch (error) {
  console.error('Failed to get districts:', error);
  // Fallback to static districts
  const fallbackDistricts = getAvailableDistricts(pandals);
}
```

## API Costs

- Google Maps Geocoding API costs ~$5 per 1000 requests
- For 12 pandals (current data), one-time enrichment costs ~$0.06
- Consider batch processing and caching for larger datasets

## Best Practices

1. **Lazy Loading**: Only fetch district info when needed
2. **Progressive Enhancement**: Start with static data, enhance with geocoding
3. **User Feedback**: Show loading states during API calls
4. **Error Recovery**: Always have fallback mechanisms
5. **Caching**: Cache results to minimize API calls

## Integration with Existing Code

The new functions are designed to work alongside existing functionality:

```typescript
// Old way (using static district field)
const oldFiltered = filterByDistrict(pandals, "Kolkata");

// New way (using geocoding)
const newFiltered = await filterByDistrictWithGeocoding(pandals, "Kolkata");

// Smart way (with fallback)
const smartFiltered = await smartDistrictFilter(pandals, "Kolkata", true);
```

## Example Component

See `locationUtilsExample.tsx` for a complete React component demonstrating all features with a working UI.
