import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';

export type SearchType = 'all' | 'district' | 'pandal';

interface SearchBarProps {
  onSearch: (query: string, type: SearchType) => void;
  searchQuery: string;
  availableDistricts: string[];
  currentSearchType: SearchType;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  searchQuery, 
  availableDistricts,
  currentSearchType 
}) => {
  const [searchType, setSearchType] = useState<SearchType>(currentSearchType);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Handle click outside if needed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    onSearch(searchQuery, type);
  };

  const handleInputChange = (value: string) => {
    onSearch(value, searchType);
  };

  const getPlaceholderText = () => {
    switch (searchType) {
      case 'district':
        return 'Search by district (e.g., Kolkata, Howrah)...';
      case 'pandal':
        return 'Search specific pandal name...';
      default:
        return 'Search pandals, locations...';
    }
  };

  return (
    <div className="flex justify-center mb-4">
      <div className="relative w-full max-w-3xl">
        {/* Compact Search Type Selector */}
        <div className="flex items-center justify-center mb-2">
          <div className="flex gap-1 backdrop-blur-lg bg-white/10 rounded-full p-1 border border-white/20">
            <button
              onClick={() => handleSearchTypeChange('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                searchType === 'all' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleSearchTypeChange('district')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-all ${
                searchType === 'district' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <MapPin className="h-3 w-3" />
              District
            </button>
            <button
              onClick={() => handleSearchTypeChange('pandal')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                searchType === 'pandal' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Pandal
            </button>
          </div>
        </div>

        {/* Compact Glassmorphism Search Container */}
        <div className="relative backdrop-blur-lg bg-white/20 rounded-full border border-white/30 shadow-lg">
          <div className="flex items-center">
            <div className="pl-4 pr-2">
              <Search className="h-4 w-4 text-white/80" />
            </div>
            <input
              type="text"
              placeholder={getPlaceholderText()}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full py-4 bg-transparent text-white placeholder-white/70 focus:outline-none focus:ring-0 text-sm"
            />
          </div>
        </div>
        
        {/* Compact District Suggestions for District Search */}
        {searchType === 'district' && searchQuery && (
          <div className="absolute top-full mt-1 w-full bg-white/90 backdrop-blur-lg border border-white/30 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
            <div className="p-1">
              {availableDistricts
                .filter(district => 
                  district.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 6)
                .map(district => (
                  <button
                    key={district}
                    onClick={() => handleInputChange(district)}
                    className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-purple-100 rounded transition-colors flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3 text-purple-600" />
                    <span>{district}</span>
                  </button>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
