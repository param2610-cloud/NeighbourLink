import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiMapPin, FiList, FiX } from 'react-icons/fi';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import PostList from '@/components/PostCard/PostList';
import SharedResourceList from '@/components/PostCard/SharedResourceList ';
import SearchResultMap from './SearchResultMap';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Bottombar from '../authPage/structures/Bottombar';


type ViewMode = 'list' | 'map';
type SortOption = 'urgency' | 'distance' | 'recency';
type FilterSheetState = 'closed' | 'open';

interface SearchResult {
  id: string;
  type: 'post' | 'resource';
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


  resourceName?: string;
  condition?: string;


  [key: string]: any;
}

const CATEGORIES = [
  'Medical', 'Food', 'Transportation', 'Childcare',
  'Pet Care', 'Household Items', 'Technology', 'Education',
  'Elderly Care', 'Other'
];

const SearchPage: React.FC = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterSheetState, setFilterSheetState] = useState<FilterSheetState>('closed');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing,] = useState(false);
  const navigate = useNavigate();


  const [distance, setDistance] = useState([5]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availability, setAvailability] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recency');


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

      const postsQuery = query(
        collection(db, "posts"),

        orderBy("createdAt", "desc"),
        limit(20)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log(data);


        let coordinates = { latitude: 0, longitude: 0 };


        if (data.coordinates && data.coordinates.latitude && data.coordinates.longitude) {
          coordinates = data.coordinates;
        } else if (data.latitude && data.longitude) {
          coordinates = { latitude: data.latitude, longitude: data.longitude };
        }

        return {
          id: doc.id,
          ...data,
          type: "post",

          coordinates: coordinates,

          userId: data.userId || "",
          photoUrl: data.photoUrl || "",
          urgency: data.urgency || false,
          responders: data.responders || []
        };
      }) as SearchResult[];

      let combined = [...postsData];


      combined = combined.filter(item =>
        item.coordinates &&
        typeof item.coordinates.latitude === 'number' &&
        typeof item.coordinates.longitude === 'number'
      );


      const searchTermToUse = term !== undefined ? term : searchTerm;
      if (searchTermToUse) {
        combined = combined.filter(item =>
          item.title.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTermToUse.toLowerCase())
        );
      }


      if (selectedCategories.length > 0) {
        combined = combined.filter(item =>
          selectedCategories.includes(item.category)
        );
      }


      if (availability) {
        combined = combined.filter(item =>
          item.status !== 'completed' && item.status !== 'closed'
        );
      }


      combined = sortResults(combined, sortBy);

      setResults(combined);
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


        return data;
      default:
        return data;
    }
  };


  const handleClearFilters = () => {
    setDistance([5]);
    setSelectedCategories([]);
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



  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }


    fetchResults();
  }, []);


  useEffect(() => {
    fetchResults();
  }, [selectedCategories, availability, sortBy]);

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
                Distance: {distance[0]} km
              </label>
              <Slider
                value={distance}
                onValueChange={setDistance}
                max={20}
                min={1}
                step={1}
              />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((result) => (
                    result.type === 'post' ? (
                      <PostList
                        key={`post-${result.id}`}
                        post={{
                          id: result.id,
                          category: result.category,
                          createdAt: result.createdAt,
                          description: result.description,
                          location: result.location,
                          photoUrl: result.photoUrl,
                          title: result.title,
                          urgency: result.urgency || false,
                          userId: result.userId,
                          responders: result.responders || []
                        }}
                        setUpdated={() => { }}
                      />
                    ) : (
                      <SharedResourceList
                        key={`resource-${result.id}`}
                        resource={{
                          id: result.id,
                          category: result.category,
                          createdAt: result.createdAt,
                          description: result.description,
                          location: result.location,
                          photoUrl: result.photoUrl,
                          resourceName: result.resourceName || result.title,
                          condition: result.condition || "",
                          userId: result.userId
                        }}
                        setUpdated={() => { }}
                      />
                    )
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
