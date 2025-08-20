import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchQuery }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative w-full max-w-lg">
        {/* Glassmorphism Search Container */}
        <div className="relative backdrop-blur-lg bg-white/20 rounded-full border border-white/30 shadow-xl">
          <div className="flex items-center">
            <div className="pl-4 pr-2">
              <Search className="h-5 w-5 text-white/80" />
            </div>
            <input
              type="text"
              placeholder="Search pandals, locations..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full py-3 pr-4 bg-transparent text-white placeholder-white/70 focus:outline-none focus:ring-0 text-sm md:text-base"
            />
          </div>
        </div>
        
        {/* Search Button - Hidden on mobile, visible on larger screens */}
        <button className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-full p-2.5 transition-all duration-200 hidden sm:block">
          <Search className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
