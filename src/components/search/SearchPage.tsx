import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiMapPin, FiList, FiX, FiClock, FiUser, FiStar } from 'react-icons/fi';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import SearchResultMap from './SearchResultMap';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Bottombar from '../authPage/structures/Bottombar';
import { calculateDistance } from '@/utils/utils';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';


type ViewMode = 'list' | 'map';
type SortOption = 'urgency' | 'distance' | 'recency';
type FilterSheetState = 'closed' | 'open';

interface SearchResult {
  id: string;
  type: 'resource' | 'promotion' | 'event' | 'update' | 'business' | 'post';
  title: string;
  description: string;
  category: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: any;
  urgencyLevel?: number;
  urgency?: boolean;
  userId: string;
  photoUrl: string;
  responders?: { userId: string; accepted: boolean }[];
  
  // Resource specific
  resourceName?: string;
  condition?: string;
  
  // Business specific
  businessName?: string;
  contact?: { phone: string; email: string; verified: boolean };
  services?: any[];
  products?: any[];
  
  // Event specific
  startDate?: any;
  endDate?: any;
  maxParticipants?: number;
  currentParticipants?: number;
  
  // Promotion specific
  visibilityRadius?: string;
  duration?: string;
  isPromoted?: boolean;

  [key: string]: any;
}

const CATEGORIES = [
  'Medical', 'Food', 'Transportation', 'Childcare',
  'Pet Care', 'Household Items', 'Technology', 'Education',
  'Elderly Care', 'Business', 'Events', 'Community',
  'Services', 'Products', 'Other'
];

const COLLECTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'resource', label: 'Resources' },
  { value: 'promotion', label: 'Promotions' },
  { value: 'event', label: 'Events' },
  { value: 'update', label: 'Updates' },
  { value: 'business', label: 'Businesses' },
  { value: 'post', label: 'Posts' }
];

// Search Result Card Component
interface SearchResultCardProps {
  result: SearchResult;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
  const navigate = useNavigate();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resource': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'promotion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'event': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'update': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'business': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'post': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'resource': return 'Resource';
      case 'promotion': return 'Promotion';
      case 'event': return 'Event';
      case 'update': return 'Update';
      case 'business': return 'Business';
      case 'post': return 'Request';
      default: return 'Item';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const handleCardClick = () => {
    // Navigate to appropriate detail page based on type
    switch (result.type) {
      case 'business':
        navigate(`/business/${result.id}`);
        break;
      case 'event':
        navigate(`/events/${result.id}`);
        break;
      case 'resource':
        navigate(`/resources/${result.id}`);
        break;
      case 'promotion':
        navigate(`/promotions/${result.id}`);
        break;
      case 'update':
        navigate(`/updates/${result.id}`);
        break;
      case 'post':
        navigate(`/posts/${result.id}`);
        break;
      default:
        console.log('Unknown type:', result.type);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-neutral-700"
      onClick={handleCardClick}
    >
      {/* Header with type and category */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
            {getTypeLabel(result.type)}
          </span>
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300">
            {result.category}
          </span>
          {result.urgency && (
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
              Urgent
            </span>
          )}
        </div>
        {result.urgencyLevel && (
          <div className="flex items-center gap-1">
            <FiStar className="text-yellow-500" size={14} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{result.urgencyLevel}/5</span>
          </div>
        )}
      </div>

      {/* Image */}
      {result.photoUrl && (
        <div className="mb-3">
          <ImageDisplay 
            publicId={result.photoUrl} 
            alt={result.title}
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      )}

      {/* Title and Description */}
      <div className="mb-3">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any
        }}>
          {result.title}
        </h3>
        {result.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as any
          }}>
            {result.description}
          </p>
        )}
      </div>

      {/* Business-specific info */}
      {result.type === 'business' && result.contact && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-neutral-800 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📞 {result.contact.phone}
          </p>
          {result.contact.verified && (
            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded mt-1">
              Verified
            </span>
          )}
        </div>
      )}

      {/* Event-specific info */}
      {result.type === 'event' && (result.startDate || result.maxParticipants) && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-neutral-800 rounded">
          {result.startDate && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📅 {formatDate(result.startDate)}
            </p>
          )}
          {result.maxParticipants && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              👥 {result.currentParticipants || 0}/{result.maxParticipants} participants
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <FiClock size={14} />
            <span>{formatDate(result.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiMapPin size={14} />
            <span className="truncate" style={{ maxWidth: '100px' }}>{result.location}</span>
          </div>
        </div>
        {result.responders && result.responders.length > 0 && (
          <div className="flex items-center gap-1">
            <FiUser size={14} />
            <span>{result.responders.length} responses</span>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterSheetState, setFilterSheetState] = useState<FilterSheetState>('closed');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing,] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [distance, setDistance] = useState([5]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [availability, setAvailability] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recency');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);


  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setLocationError('Geolocation not supported');
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.trim()) {
        if (!recentSearches.includes(term)) {
          const updatedSearches = [term, ...recentSearches.slice(0, 4)];
          setRecentSearches(updatedSearches);
          localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        }
      }
      fetchResults(term);
    }, 300),
    [recentSearches]
  );


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearch(newSearchTerm);
  };


  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);

    try {
      if (!recentSearches.includes(searchTerm)) {
        const updatedSearches = [searchTerm, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      }

      await fetchResults(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchResults = async (term?: string) => {
    try {
      setLoading(true);

      // Define collections to search
      const collections = [
        { name: 'resources', type: 'resource' },
        { name: 'promotions', type: 'promotion' },
        { name: 'events', type: 'event' },
        { name: 'updates', type: 'update' },
        { name: 'business', type: 'business' }
      ];

      let allResults: SearchResult[] = [];

      // Fetch from each collection
      for (const { name, type } of collections) {
        try {
          const collectionQuery = query(
            collection(db, name),
            orderBy("createdAt", "desc"),
            limit(20)
          );
          
          const snapshot = await getDocs(collectionQuery);
          
          const collectionData = snapshot.docs.map((doc) => {
            const data = doc.data();
            
            // Normalize coordinates
            let coordinates = { latitude: 0, longitude: 0 };
            if (data.coordinates && data.coordinates.latitude && data.coordinates.longitude) {
              coordinates = data.coordinates;
            } else if (data.latitude && data.longitude) {
              coordinates = { latitude: data.latitude, longitude: data.longitude };
            } else if (data.location && data.location.latitude && data.location.longitude) {
              coordinates = { latitude: data.location.latitude, longitude: data.location.longitude };
            }

            // Normalize title based on type
            let title = data.title || '';
            if (type === 'business') {
              title = data.businessName || data.name || '';
            } else if (type === 'resource') {
              title = data.resourceName || data.title || '';
            } else if (type === 'event') {
              title = data.title || data.eventName || '';
            }

            // Normalize description
            let description = data.description || '';
            if (type === 'business') {
              description = data.description || data.tagline || '';
            }

            // Normalize category
            let category = data.category || 'Other';
            if (type === 'business') {
              category = data.businessCategory || data.category || 'Business';
            }

            // Normalize location string
            let location = data.location || '';
            if (typeof location === 'object' && location.address) {
              location = location.address;
            } else if (typeof location !== 'string') {
              location = `${coordinates.latitude}, ${coordinates.longitude}`;
            }

            return {
              id: doc.id,
              ...data,
              type: type as SearchResult['type'],
              title,
              description,
              category,
              location,
              coordinates,
              userId: data.userId || "",
              photoUrl: data.photoUrl || data.imageUrl || (data.images && data.images[0]) || "",
              urgency: data.urgency || false,
              urgencyLevel: data.urgencyLevel || (data.urgency ? 3 : 0),
              responders: data.responders || []
            } as SearchResult;
          });

          allResults = [...allResults, ...collectionData];
        } catch (error) {
          console.error(`Error fetching from ${name}:`, error);
          // Continue with other collections even if one fails
        }
      }

      // Filter results with valid coordinates
      allResults = allResults.filter(item =>
        item.coordinates &&
        typeof item.coordinates.latitude === 'number' &&
        typeof item.coordinates.longitude === 'number' &&
        !isNaN(item.coordinates.latitude) &&
        !isNaN(item.coordinates.longitude)
      );

      // Apply search term filter
      const searchTermToUse = term !== undefined ? term : searchTerm;
      if (searchTermToUse && searchTermToUse.trim()) {
        const searchLower = searchTermToUse.toLowerCase();
        allResults = allResults.filter(item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          (item.businessName && item.businessName.toLowerCase().includes(searchLower)) ||
          (item.resourceName && item.resourceName.toLowerCase().includes(searchLower))
        );
      }

      // Apply category filter
      if (selectedCategories.length > 0) {
        allResults = allResults.filter(item =>
          selectedCategories.includes(item.category)
        );
      }

      // Apply type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes('all')) {
        allResults = allResults.filter(item =>
          selectedTypes.includes(item.type)
        );
      }

      // Apply availability filter
      if (availability) {
        allResults = allResults.filter(item =>
          item.status !== 'completed' && 
          item.status !== 'closed' && 
          item.status !== 'inactive'
        );
      }

      // Apply location-based distance filter
      if (userLocation && distance[0] > 0) {
        allResults = allResults.filter(item => {
          const itemDistance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            item.coordinates.latitude,
            item.coordinates.longitude
          );
          return itemDistance <= distance[0];
        });
      }

      // Sort results
      allResults = sortResults(allResults, sortBy);

      setResults(allResults);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };


  function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: NodeJS.Timeout | null = null;

    return function (...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        func(...args);
      };

      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    };
  }


  const sortResults = (data: SearchResult[], sortOption: SortOption) => {
    switch (sortOption) {
      case 'urgency':
        return [...data].sort((a, b) => (b.urgencyLevel || 0) - (a.urgencyLevel || 0));
      case 'recency':
        return [...data].sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      case 'distance':
        if (userLocation) {
          return [...data].sort((a, b) => {
            const distanceA = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              a.coordinates.latitude,
              a.coordinates.longitude
            );
            const distanceB = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              b.coordinates.latitude,
              b.coordinates.longitude
            );
            return distanceA - distanceB;
          });
        }
        return data;
      default:
        return data;
    }
  };


  const handleClearFilters = () => {
    setDistance([5]);
    setSelectedCategories([]);
    setSelectedTypes(['all']);
    setAvailability(true);
    setSortBy('recency');
  };




  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      if (type === 'all') {
        return ['all'];
      } else {
        const filtered = prev.filter(t => t !== 'all');
        if (filtered.includes(type)) {
          const newTypes = filtered.filter(t => t !== type);
          return newTypes.length === 0 ? ['all'] : newTypes;
        } else {
          return [...filtered, type];
        }
      }
    });
  };



  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    fetchResults();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedCategories, selectedTypes, availability, sortBy, distance, userLocation]);

  return (
    <div className="min-h-screen mb-16 bg-gray-100 dark:bg-neutral-800 pt-4">
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search for resources, requests..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    fetchResults('');
                  }}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
            >
              <FiSearch />
            </button>
          </div>

          {/* Recent searches */}
          {recentSearches.length > 0 && !searchTerm && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch();
                    }}
                    className="bg-gray-200 dark:bg-neutral-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-neutral-600"
                  >
                    {term}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recentSearches');
                  }}
                  className="text-red-500 text-sm hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          )}


          {/* View mode toggle and filter button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <FiList />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg ${viewMode === 'map' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <FiMapPin />
              </button>
              <button className="flex gap-2 justify-start items-center hover:cursor-pointer text-blue-600 dark:text-blue-400"
                onClick={() => navigate('/')}
              ><FaArrowLeft /> Back</button>
            </div>
            <button
              onClick={() => setFilterSheetState(filterSheetState === 'closed' ? 'open' : 'closed')}
              className="flex items-center gap-1 bg-gray-200 dark:bg-neutral-700 px-3 py-1 rounded-full"
            >
              <FiFilter size={14} />
              <span>Filter</span>
            </button>

          </div>
        </div>

        {/* Filter Bottom Sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-xl shadow-lg transition-transform duration-300 transform z-50 ${filterSheetState === 'open' ? 'translate-y-0' : 'translate-y-full'
            }`}
          style={{ maxHeight: '80vh', overflowY: 'auto' }}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold dark:text-white">Filters</h2>
              <button
                onClick={() => setFilterSheetState('closed')}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Distance Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Distance: {distance[0]} km {!userLocation && '(Location needed for filtering)'}
              </label>
              <Slider
                value={distance}
                onValueChange={setDistance}
                max={20}
                min={1}
                step={1}
                disabled={!userLocation}
              />
              {locationError && (
                <p className="text-xs text-red-500 mt-1">{locationError}</p>
              )}
            </div>

            {/* Collection Types */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Content Types</h3>
              <div className="grid grid-cols-2 gap-2">
                {COLLECTION_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={selectedTypes.includes(type.value)}
                      onCheckedChange={() => toggleType(type.value)}
                    />
                    <label
                      htmlFor={`type-${type.value}`}
                      className="text-sm dark:text-gray-300"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm dark:text-gray-300"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium dark:text-gray-300">Show only available</span>
              <Switch
                checked={availability}
                onCheckedChange={setAvailability}
              />
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Sort by</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSortBy('urgency')}
                  className={`py-2 px-3 text-sm rounded-lg ${sortBy === 'urgency'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-neutral-700 dark:text-gray-300'
                    }`}
                >
                  Urgency
                </button>
                <button
                  onClick={() => setSortBy('distance')}
                  className={`py-2 px-3 text-sm rounded-lg ${sortBy === 'distance'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-neutral-700 dark:text-gray-300'
                    }`}
                >
                  Distance
                </button>
                <button
                  onClick={() => setSortBy('recency')}
                  className={`py-2 px-3 text-sm rounded-lg ${sortBy === 'recency'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-neutral-700 dark:text-gray-300'
                    }`}
                >
                  Recency
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  fetchResults();
                  setFilterSheetState('closed');
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className={`${refreshing ? 'opacity-50' : ''} transition-opacity`}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : results.length > 0 ? (
            <>
              {viewMode === 'list' ? (
                <div className="space-y-4">
                  {results.map((result) => (
                    <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                  ))}
                </div>
              ) : (
                <div className="h-[60vh] rounded-lg overflow-hidden">
                  <SearchResultMap results={results} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? `No results found for "${searchTerm}"` : "No results found"}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
      <Bottombar />
    </div>
  );
};

export default SearchPage;
