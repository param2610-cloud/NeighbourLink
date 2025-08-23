/**
 * Example component showing how to use the enhanced location utilities
 * with Google Maps reverse geocoding for district filtering
 */

import React, { useState, useEffect } from 'react';
import { Pandal, pandalData } from '../data/pandalData';
import {
//   filterByDistrictWithGeocoding,
  getAvailableDistrictsWithGeocoding,
  smartDistrictFilter,
  getDistrictFromCoordinates,
  enrichPandalsWithDistricts
} from './locationUtils';

interface LocationUtilsExampleProps {
  pandals?: Pandal[];
}

export const LocationUtilsExample: React.FC<LocationUtilsExampleProps> = ({ 
  pandals = pandalData 
}) => {
  const [filteredPandals, setFilteredPandals] = useState<Pandal[]>(pandals);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [useGeocoding, setUseGeocoding] = useState(true);

  // Load available districts on component mount
  useEffect(() => {
    loadAvailableDistricts();
  }, [useGeocoding]);

  const loadAvailableDistricts = async () => {
    setLoading(true);
    try {
      if (useGeocoding) {
        // Get districts using Google Maps reverse geocoding
        const districts = await getAvailableDistrictsWithGeocoding(pandals);
        setAvailableDistricts(districts);
      } else {
        // Use static district data from pandals
        const districts = [...new Set(
          pandals
            .map(pandal => pandal.district)
            .filter((district): district is string => Boolean(district))
        )];
        setAvailableDistricts(districts.sort());
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictFilter = async (district: string) => {
    setSelectedDistrict(district);
    setLoading(true);
    
    try {
      const filtered = await smartDistrictFilter(pandals, district, useGeocoding);
      setFilteredPandals(filtered);
    } catch (error) {
      console.error('Error filtering pandals:', error);
      setFilteredPandals([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilter = () => {
    setSelectedDistrict('');
    setFilteredPandals(pandals);
  };

  // Example function to get district info for a specific location
  const getLocationInfo = async (lat: number, lng: number) => {
    const districtInfo = await getDistrictFromCoordinates(lat, lng);
    console.log('District info:', districtInfo);
  };

  // Example function to enrich all pandals with district info
  const enrichAllPandals = async () => {
    setLoading(true);
    try {
      const enriched = await enrichPandalsWithDistricts(pandals);
      console.log('Enriched pandals:', enriched);
      
      // Show enriched pandals in console for debugging
      enriched.forEach(pandal => {
        console.log(`${pandal.name}: ${pandal.district} -> ${pandal.dynamicDistrict}`);
      });
    } catch (error) {
      console.error('Error enriching pandals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">District Filtering with Google Maps</h2>
      
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useGeocoding}
              onChange={(e) => setUseGeocoding(e.target.checked)}
              className="mr-2"
            />
            Use Google Maps Reverse Geocoding
          </label>
          
          <button
            onClick={enrichAllPandals}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Processing...' : 'Enrich All Pandals'}
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictFilter(e.target.value)}
            disabled={loading}
            className="px-3 py-2 border rounded"
          >
            <option value="">Select District</option>
            {availableDistricts.map(district => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          
          <button
            onClick={resetFilter}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      )}

      {/* Results */}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">
          {selectedDistrict ? `Pandals in ${selectedDistrict}` : 'All Pandals'} 
          ({filteredPandals.length})
        </h3>
        
        {filteredPandals.map(pandal => (
          <div key={pandal.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">{pandal.name}</h4>
                <p className="text-gray-600">{pandal.location}</p>
                <p className="text-sm text-gray-500">
                  District: {pandal.district} | 
                  Coordinates: {pandal.coordinates.lat.toFixed(4)}, {pandal.coordinates.lng.toFixed(4)}
                </p>
                <p className="text-sm mt-2">{pandal.description}</p>
              </div>
              
              <div className="text-right">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {pandal.category}
                </span>
                <p className="text-sm mt-1">Rating: {pandal.average_rating}/5</p>
                <button
                  onClick={() => getLocationInfo(pandal.coordinates.lat, pandal.coordinates.lng)}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1"
                >
                  Get Location Info
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* API Usage Examples */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">API Usage Examples:</h3>
        <div className="text-sm space-y-2">
          <div>
            <strong>Basic District Filter:</strong>
            <code className="block bg-white p-2 rounded mt-1">
              const filtered = await filterByDistrictWithGeocoding(pandals, "Kolkata");
            </code>
          </div>
          
          <div>
            <strong>Get District from Coordinates:</strong>
            <code className="block bg-white p-2 rounded mt-1">
              const info = await getDistrictFromCoordinates(22.5726, 88.3639);
            </code>
          </div>
          
          <div>
            <strong>Smart Filter (with fallback):</strong>
            <code className="block bg-white p-2 rounded mt-1">
              const filtered = await smartDistrictFilter(pandals, "Howrah", true);
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationUtilsExample;
