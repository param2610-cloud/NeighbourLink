import React from 'react';
import { SearchType } from './SearchBar';

interface SearchResultHeaderProps {
  searchQuery: string;
  searchType: SearchType;
  resultCount: number;
  isLocationBased?: boolean;
}

const SearchResultHeader: React.FC<SearchResultHeaderProps> = ({
  searchQuery,
  searchType,
  resultCount,
  isLocationBased = false
}) => {
  const getTitle = () => {
    if (isLocationBased && !searchQuery) {
      return "Pandals Near You";
    }
    
    if (searchType === 'district' && searchQuery) {
      return `Famous Pandals in ${searchQuery}`;
    }
    
    if (searchType === 'pandal' && searchQuery) {
      return `Search Results for "${searchQuery}"`;
    }
    
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`;
    }
    
    return "All Pandals";
  };

  const getSubtitle = () => {
    if (isLocationBased && !searchQuery) {
      return `${resultCount} pandals found near your location`;
    }
    
    if (searchType === 'district' && searchQuery) {
      return `${resultCount} popular pandals found in ${searchQuery}`;
    }
    
    if (searchType === 'pandal' && searchQuery) {
      return `${resultCount} results found - including nearby recommendations`;
    }
    
    return `${resultCount} pandal${resultCount !== 1 ? 's' : ''} available`;
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center md:text-left">
        {getTitle()}
      </h2>
      {resultCount > 0 && (
        <p className="text-white/70 text-sm md:text-base text-center md:text-left">
          {getSubtitle()}
        </p>
      )}
    </div>
  );
};

export default SearchResultHeader;
