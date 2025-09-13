import React, { useState } from 'react';
import { Plus, Star, MapPin } from 'lucide-react';
import CreatePandalForm from './CreatePandalForm';
import { Pandel } from '../../interface/main';

interface CreatePandalSectionProps {
  onPandalCreated: (newPandal: Pandel) => void;
}

const CreatePandalSection: React.FC<CreatePandalSectionProps> = ({ onPandalCreated }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSuccess = (newPandal: Pandel) => {
    onPandalCreated(newPandal);
    setIsFormOpen(false);
  };

  return (
    <>
      {/* Create Pandal Section */}
      <div className="mt-12 mb-8">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-xl p-8 max-w-2xl mx-auto text-center">
          {/* Icon and Title */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Don't see your pandal?
            </h3>
            <p className="text-white/80 text-lg">
              Help others discover your amazing pandal by adding it to PujoGuide
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <p className="text-white/90 text-sm font-medium">Location Sharing</p>
              <p className="text-white/70 text-xs mt-1">Help visitors find you easily</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-white" />
              </div>
              <p className="text-white/90 text-sm font-medium">Get Reviews</p>
              <p className="text-white/70 text-xs mt-1">Receive feedback from visitors</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <p className="text-white/90 text-sm font-medium">Free Listing</p>
              <p className="text-white/70 text-xs mt-1">No cost to add your pandal</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Your Pandal
          </button>

          {/* Additional Info */}
          <p className="text-white/60 text-sm mt-4">
            It's quick, easy, and helps the community discover your pandal
          </p>
        </div>
      </div>

      {/* Create Pandal Form Modal */}
      <CreatePandalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default CreatePandalSection;
