import React from 'react';
import { MapPin, Eye, MessageCircle, MoreVertical } from 'lucide-react';
import { Pandal } from './data/pandalData';

interface PandalCardProps {
  pandal: Pandal;
  onContactClick?: (pandal: Pandal) => void;
}

const PandalCard: React.FC<PandalCardProps> = ({ pandal, onContactClick }) => {
  return (
    <div className="group">
      {/* Glassmorphism Card */}
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/20 hover:border-white/30">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {pandal.avatar}
              </span>
            </div>
            {/* Name */}
            <h3 className="text-white font-semibold text-lg leading-tight">
              {pandal.name}
            </h3>
          </div>
          {/* Optional Menu Button */}
          <button className="text-white/60 hover:text-white/80 p-2 rounded-full hover:bg-white/10 transition-all">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Pandal Image */}
        <div className="w-full h-48 rounded-xl mb-4 overflow-hidden border border-white/10">
          <img
            src={pandal.image ?? 'https://i.cdn.newsbytesapp.com/images/l47920220926121122.jpeg'}
            alt={pandal.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3 overflow-hidden">
            {pandal.description}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center text-white/80 mb-6">
          <MapPin className="h-4 w-4 mr-2" />
          <span className="text-sm truncate">{pandal.location}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button className="flex-1 backdrop-blur-sm hover:cursor-pointer bg-white/20 border border-white/30 hover:border-white/40 text-white text-sm font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
          onClick={() => onContactClick?.(pandal)}
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </button>
          
          <button 
            className="flex-1 backdrop-blur-sm bg-purple-500/90 hover:cursor-pointer hover:bg-purple-500 border border-purple-400/30 hover:border-purple-400/40 text-white text-sm font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            // onClick={() => onContactClick?.(pandal)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>View in map</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PandalCard;
