import React from 'react';
// import PandalCard from './PandalCard';
import { Pandal } from './data/pandalData';
import PandalCard from './PandalCard';

interface PandalGridProps {
  pandals: Pandal[];
  onPandalSelect?: (pandal: Pandal) => void;
  isPanelOpen?: boolean;
}

const PandalGrid: React.FC<PandalGridProps> = ({ pandals, onPandalSelect, isPanelOpen }) => {
  return (
    <div className="mb-8">
      {/* <h2 className="text-xl md:text-2xl font-semibold text-white mb-6 drop-shadow-lg px-2">
        Pandals near you
      </h2> */}
      
      {pandals.length === 0 ? (
        <div className="text-center py-12">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-8 max-w-md mx-auto">
            <p className="text-white/80 text-lg">No pandals found matching your search.</p>
            <p className="text-white/60 text-sm mt-2">Try searching with different keywords.</p>
          </div>
        </div>
      ) : (
        <div className={`grid gap-4 md:gap-6 transition-all duration-500 ease-out ${
          isPanelOpen 
            ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 px-14' 
            : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
        }`}>
          {pandals.map((pandal, index) => (
            <PandalCard key={index} pandal={pandal} onContactClick={onPandalSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PandalGrid;
