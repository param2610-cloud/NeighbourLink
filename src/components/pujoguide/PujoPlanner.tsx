import React, { useState } from 'react';
import { pandalData, Pandal } from './data/pandalData';
import SearchBar from './SearchBar';
import PandalGrid from './PandalGrid';
import PandalDetailsPanel from './PandalDetailsPanel';

const PujoPlanner: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPandals, setFilteredPandals] = useState(pandalData);
    const [selectedPandal, setSelectedPandal] = useState<Pandal | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        const filtered = pandalData.filter(
            (pandal) =>
                pandal.name.toLowerCase().includes(query.toLowerCase()) ||
                pandal.location.toLowerCase().includes(query.toLowerCase()) ||
                pandal.description.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredPandals(filtered);
    };

    const handlePandalSelect = (pandal: Pandal) => {
        setSelectedPandal(pandal);
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
        setTimeout(() => setSelectedPandal(null), 300);
    };

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

            {/* Scrollable Content */}
            <div className={`relative z-10 min-h-screen transition-all duration-500 ease-out ${isPanelOpen ? 'pr-80 md:pr-96' : 'pr-0'
                }`}>
                <div className={`mx-auto px-4 py-8 transition-all duration-500 ease-out ${isPanelOpen ? 'max-w-none ml-4' : 'max-w-7xl mx-auto'
                    }`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className='flex justify-center items-center gap-3  '>
                            <div className='flex justify-center items-center h-16 w-16'>
                                <img
                                    src="./assets/dhaki.png"
                                    alt="dhaki"
                                    height={100}
                                    width={100}
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                                NeighbourLink | PujoGuide
                            </h1>
                            <div className='flex justify-center items-center h-16 w-16'>
                                <img src="./assets/dhaki.png" alt="dhaki" height={100} width={100} />
                            </div>
                        </div>
                        <div className="w-full max-w-md mx-auto h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent mb-8"></div>
                    </div>

                    {/* Search Section */}
                    <div className="mb-8">
                        <SearchBar onSearch={handleSearch} searchQuery={searchQuery} />
                    </div>

                    {/* Pandals Grid */}
                    <PandalGrid
                        pandals={filteredPandals}
                        onPandalSelect={handlePandalSelect}
                        isPanelOpen={isPanelOpen}
                    />
                </div>
            </div>

            {/* Details Panel */}
            <PandalDetailsPanel
                pandal={selectedPandal}
                isOpen={isPanelOpen}
                onClose={handleClosePanel}
            />
        </div>
    );
};

export default PujoPlanner;
