import React from 'react';
import { X, MapPin, Star, Calendar, Clock, Users } from 'lucide-react';
import { Pandal } from './data/pandalData';

interface PandalDetailsPanelProps {
  pandal: Pandal | null;
  isOpen: boolean;
  onClose: () => void;
}

const PandalDetailsPanel: React.FC<PandalDetailsPanelProps> = ({ pandal, isOpen, onClose }) => {
  if (!pandal) return null;

  const mockReviews = [
    { id: 1, name: "Rahul S.", rating: 5, comment: "Amazing decorations and peaceful atmosphere!", date: "2 days ago" },
    { id: 2, name: "Priya M.", rating: 4, comment: "Beautiful pandal with traditional touch.", date: "1 week ago" },
    { id: 3, name: "Amit K.", rating: 5, comment: "Must visit! Great cultural programs.", date: "1 week ago" }
  ];

  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length;

  return (
    <>
      {/* Sliding Panel - No overlay */}
      <div className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white/95 backdrop-blur-lg border-l border-white/30 shadow-2xl z-50 transform transition-transform duration-500 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Panel Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-gray-800">Pandal Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Pandal Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
              <span className="text-white font-bold text-2xl">
                {pandal.avatar}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{pandal.name}</h3>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{pandal.location}</span>
            </div>
          </div>

          {/* Rating Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Rating & Reviews</h4>
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                <span className="text-gray-600 text-sm">({mockReviews.length} reviews)</span>
              </div>
            </div>
            <div className="flex space-x-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">About</h4>
            <p className="text-gray-700 leading-relaxed text-sm">
              {pandal.description}
            </p>
          </div>

          {/* Map Section */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Location</h4>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-48 flex items-center justify-center border border-gray-300">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Map view coming soon</p>
                <p className="text-xs text-gray-400">{pandal.location}</p>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Timing</span>
              </div>
              <p className="text-sm text-blue-700">6 AM - 10 PM</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">Duration</span>
              </div>
              <p className="text-sm text-green-700">5 Days</p>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Recent Reviews</h4>
            <div className="space-y-4">
              {mockReviews.map((review) => (
                <div key={review.id} className="bg-white/60 rounded-lg p-4 border border-white/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{review.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                  <span className="text-gray-500 text-xs">{review.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 -mx-6 -mb-6 border-t border-white/30">
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Get Directions</span>
              </button>
              <button className="w-full bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-600 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Join Community</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PandalDetailsPanel;
