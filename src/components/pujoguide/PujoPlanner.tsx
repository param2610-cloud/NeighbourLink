import React, { useState, useEffect } from 'react';
import { Pandal } from './data/pandalData';
import { PandelService } from '../../services/pandelService';
import SearchBar, { SearchType } from './SearchBar';
import PandalGrid from './PandalGrid';
import PandalDetailsPanel from './PandalDetailsPanel';
import SearchResultHeader from './SearchResultHeader';

import {
    getCurrentLocation,
    sortByDistance,
    sortByPopularity,
    filterByDistrict,
    findNearbyPandals,
    getAvailableDistricts
} from './utils/locationUtils';
import SplashCursor from '../ui/SplashCursor';
import { FaArrowAltCircleLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const PujoPlanner: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('all');
    const [filteredPandals, setFilteredPandals] = useState<Pandal[]>([]);
    const [selectedPandal, setSelectedPandal] = useState<Pandal | null>(null);
    const [nearbyPandals, setNearbyPandals] = useState<Pandal[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isLocationBased, setIsLocationBased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [allPandals, setAllPandals] = useState<Pandal[]>([]); // Store all pandals data
    // Poster modal state (opens on page visit)
    const [isPosterOpen, setIsPosterOpen] = useState(false);
    const [isPosterMinimized, setIsPosterMinimized] = useState(false);

    const availableDistricts = getAvailableDistricts(allPandals);
      const navigate = useNavigate();

    // Initialize with backend data and user's location
    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                
                // Get user location
                const location = await getCurrentLocation();
                setUserLocation(location);

                // Fetch pandals from backend based on location
                let pandals: Pandal[] = [];
                
                if (location) {
                    // Get pandals near user location (5km radius)
                    const nearbyPandelsData = await PandelService.getPandelsByLocation(
                        location.lat, 
                        location.lng, 
                        4
                    );
                    
                    // Convert backend format to frontend format
                    console.log(nearbyPandelsData);
                    
                    pandals = nearbyPandelsData.map(PandelService.convertToLegacyFormat);
                    setIsLocationBased(true);
                } else {
                    // Fallback: get all pandals
                    const allPandelsData = await PandelService.getAllPandels();
                    pandals = allPandelsData.map(PandelService.convertToLegacyFormat);
                    setIsLocationBased(false);
                }

                // Store all pandals and set filtered results
                setAllPandals(pandals);
                
                if (location && pandals.length > 0) {
                    // Sort by distance if we have location
                    const sortedPandals = sortByDistance(location.lat, location.lng, pandals);
                    setFilteredPandals(sortedPandals);
                } else {
                    // Sort by popularity as fallback
                    setFilteredPandals(sortByPopularity(pandals));
                }

            } catch (error) {
                console.error('Error initializing data:', error);
                // Fallback to empty array
                setFilteredPandals([]);
                setAllPandals([]);
                setIsLocationBased(false);
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
        // open the greeting poster when the page mounts
        setTimeout(() => setIsPosterOpen(true), 300);
    }, []);

    const handleSearch = async (query: string, type: SearchType) => {
        setSearchQuery(query);
        setSearchType(type);
        setIsLocationBased(false);

        if (!query.trim()) {
            // If no query, show location-based results or all pandals
            if (userLocation && allPandals.length > 0) {
                const nearestPandals = sortByDistance(userLocation.lat, userLocation.lng, allPandals);
                setFilteredPandals(nearestPandals);
                setIsLocationBased(true);
            } else {
                setFilteredPandals(sortByPopularity(allPandals));
            }
            return;
        }

        try {
            let results: Pandal[] = [];

            switch (type) {
                case 'district':
                    // Use backend API for district search
                    const districtPandals = await PandelService.getPandelsByDistrict(query);
                    results = districtPandals.map(PandelService.convertToLegacyFormat);
                    results = sortByPopularity(results);
                    break;

                case 'pandal':
                    // Use backend API for name search
                    const searchResults = await PandelService.searchPandels(query);
                    const exactMatches = searchResults.map(PandelService.convertToLegacyFormat);
                    
                    // Sort exact matches by popularity, then add location-based suggestions
                    const sortedExactMatches = sortByPopularity(exactMatches);

                    if (sortedExactMatches.length > 0 && userLocation) {
                        // Find nearby pandals to the first search result
                        const targetPandal = sortedExactMatches[0];
                        const nearby = findNearbyPandals(targetPandal, allPandals, 15);
                        // Combine exact matches with nearby suggestions, avoiding duplicates
                        const nearbyFiltered = nearby.filter(np =>
                            !sortedExactMatches.some(em => em.id === np.id)
                        );
                        results = [...sortedExactMatches, ...nearbyFiltered];
                    } else {
                        results = sortedExactMatches;
                    }
                    break;

                default:
                    // Use backend API for general search
                    const generalSearchResults = await PandelService.searchPandels(query);
                    results = generalSearchResults.map(PandelService.convertToLegacyFormat);
                    results = sortByPopularity(results);
                    break;
            }

            setFilteredPandals(results);
        } catch (error) {
            console.error('Error searching pandals:', error);
            // Fallback to client-side search on cached data
            const clientResults = allPandals.filter(pandal =>
                pandal.name.toLowerCase().includes(query.toLowerCase()) ||
                (pandal.location && pandal.location.toLowerCase().includes(query.toLowerCase())) ||
                (pandal.district && pandal.district.toLowerCase().includes(query.toLowerCase())) ||
                pandal.description.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredPandals(sortByPopularity(clientResults));
        }
    };

    const handlePandalSelect = (pandal: Pandal) => {
        setSelectedPandal(pandal);
        setIsPanelOpen(true);

        // Find nearby pandals for the selected pandal
        const nearby = findNearbyPandals(pandal, allPandals, 12);
        setNearbyPandals(nearby);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => {
            setSelectedPandal(null);
            setNearbyPandals([]);
        }, 300);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen relative">
                {/* Fixed Background Image */}
                <div
                    className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
                    style={{
                        backgroundImage: 'url(/assets/pujo-bg.jpg)',
                    }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                {/* Loading Content */}
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white text-lg">Finding nearest pandals...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            
            {/* Fixed Background Image */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
                style={{
                    backgroundImage: 'url(/assets/pujo-bg2.jpg)',
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Greeting Poster Modal (opens on page load) */}
            {isPosterOpen && !isPosterMinimized && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"  >
                    <div className="bg-white/95 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 sm:mx-8 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex justify-end p-3 flex-shrink-0">
                            <button
                                onClick={() => setIsPosterMinimized(true)}
                                className="mr-2 bg-orange-500 text-white px-3 py-1 rounded-md text-sm"
                            >
                                Minimize
                            </button>
                            <button
                                onClick={() => setIsPosterOpen(false)}
                                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm"
                            >
                                Close
                            </button>
                        </div>
                        <div className="p-4 bg-white overflow-auto flex-1 flex items-center justify-center">
                            <img
                                src="/assets/subho-saradiya.jpg"
                                alt="Subho Saradiya"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                            />
                        </div>
                    </div>
                    {/* <SplashCursor /> */}
                </div>
            )}

            {/* Minimized poster thumbnail (click to restore) */}
            {isPosterOpen && isPosterMinimized && (
                <button
                    onClick={() => setIsPosterMinimized(false)}
                    className="fixed bottom-6 right-6 z-50 w-20 h-28 bg-white/90 rounded-lg shadow-lg p-1 overflow-hidden flex items-center justify-center"
                    title="Restore poster"
                    style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}
                >
                    <img src="/assets/subho-saradiya.jpg" alt="poster" className="w-full h-full object-cover rounded-sm" />
                </button>
            )}

            {/* Scrollable Content */}
            <div className={`relative z-10 min-h-screen transition-all duration-500 ease-out ${isPanelOpen ? 'pr-80 md:pr-96' : 'pr-0'
                }`}>
                    <button
                    className="absolute flex justify-center items-center gap-3 top-6 left-6 px-4 py-2 text-white font-medium rounded-md shadow-sm focus:outline-none hover:bg-black/20 transition-colors"
                    onClick={() => navigate("/")}
                  >
                    <FaArrowAltCircleLeft size={22} /> Back to Home
                  </button>
                <div className={`mx-auto px-2 py-4 transition-all duration-500 ease-out ${isPanelOpen ? 'max-w-none ml-2' : 'max-w-6xl mx-auto'
                    }`}>
                    {/* Compact Header */}
                    <div className="text-center mb-5 mt-4">
                        <div className='flex justify-center items-center gap-2'>
                            <div className='flex justify-center items-center h-16 w-16'>
                                <img
                                    src="./assets/dhaki.png"
                                    alt="dhaki"
                                    height={100}
                                    width={100}
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            </div>
                            <h1
                                className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg"
                                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)' }}
                            >
                                NeighbourLink | <span  className="text-3xl md:text-5xl font-bold text-yellow-300"> PujoGuide</span>
                            </h1>
                            <div className='flex justify-center items-center h-16 w-16'>
                                <img src="./assets/dhaki.png" alt="dhaki" height={100} width={100} />
                            </div>
                        </div>
                        <div className="w-full max-w-md mx-auto h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent mb-4"></div>
                    </div>

                    {/* Compact Search Section */}
                    <div className="mb-4">
                        <SearchBar
                            onSearch={handleSearch}
                            searchQuery={searchQuery}
                            availableDistricts={availableDistricts}
                            currentSearchType={searchType}
                        />
                    </div>

                    {/* Search Result Header */}
                    <SearchResultHeader
                        searchQuery={searchQuery}
                        searchType={searchType}
                        resultCount={filteredPandals.length}
                        isLocationBased={isLocationBased}
                    />

                    {/* Pandals Grid */}
                    <PandalGrid
                        pandals={filteredPandals}
                        onPandalSelect={handlePandalSelect}
                        isPanelOpen={isPanelOpen}
                    />

                    {filteredPandals.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                            <div className="backdrop-blur-lg bg-white/20 rounded-2xl border border-white/30 shadow-xl p-8 max-w-md mx-auto">
                                <h3 className="text-xl font-semibold text-white mb-2">No pandals found</h3>
                                <p className="text-white/80">
                                    Try searching with different terms or explore pandals by district.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Panel */}
            <PandalDetailsPanel
                pandal={selectedPandal}
                isOpen={isPanelOpen}
                onClose={handleClosePanel}
                nearbyPandals={nearbyPandals}
                onPandalSelect={handlePandalSelect}
            />
        </div>
    );
};

export default PujoPlanner;
