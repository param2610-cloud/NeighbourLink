import React, { useEffect, useState } from 'react';
import { X, MapPin, Star, Calendar, Clock, Users, Navigation } from 'lucide-react';
import { Pandal } from './data/pandalData';
import { AddressManager } from '../../services/addressManager';
import ImageCarousel from './ImageCarousel';

interface PandalDetailsPanelProps {
  pandal: Pandal | null;
  isOpen: boolean;
  onClose: () => void;
  nearbyPandals?: Pandal[];
  onPandalSelect: (pandal: Pandal) => void;
}

const PandalDetailsPanel: React.FC<PandalDetailsPanelProps> = ({ 
  pandal, 
  isOpen, 
  onClose, 
  nearbyPandals = [], 
  onPandalSelect 
}) => {
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Update address when pandal changes
  useEffect(() => {
    const updateAddressIfNeeded = async () => {
      if (!pandal || !isOpen) return;

      const displayAddress = pandal.address || pandal.location;
      setCurrentAddress(displayAddress || '');

      // Only fetch address if we don't have a detailed one and we have coordinates
      if (!displayAddress || displayAddress.length < 20) {
        setIsLoadingAddress(true);
        try {
          const result = await AddressManager.getAndUpdateAddress(
            parseInt(pandal.id),
            pandal.coordinates.lat,
            pandal.coordinates.lng,
            displayAddress
          );
          
          if (result.success && result.address) {
            setCurrentAddress(result.address);
          }
        } catch (error) {
          console.error('Error updating address:', error);
        } finally {
          setIsLoadingAddress(false);
        }
      }
    };

    updateAddressIfNeeded();
  }, [pandal, isOpen]);

  if (!pandal) return null;

  // Use reviews from pandal or create mock reviews
  const reviews = pandal.reviews || [
    { id: 1, name: "Rahul S.", rating: 5, comment: "Amazing decorations and peaceful atmosphere!", date: "2 days ago" },
    { id: 2, name: "Priya M.", rating: 4, comment: "Beautiful pandal with traditional touch.", date: "1 week ago" },
    { id: 3, name: "Amit K.", rating: 5, comment: "Must visit! Great cultural programs.", date: "1 week ago" }
  ];

  const averageRating = pandal.average_rating || 
    (reviews.length > 0 ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length : pandal.popularity || 5);

  // Get images array for carousel
  const getImagesArray = () => {
    const images: string[] = [];
    
    // Add all available images to the array
    if (pandal.banner_image) images.push(pandal.banner_image);
    if (pandal.avatar && pandal.avatar !== pandal.banner_image) images.push(pandal.avatar);
    if (pandal.image && pandal.image !== pandal.banner_image && pandal.image !== pandal.avatar) images.push(pandal.image);
    if (pandal.images && pandal.images.length > 0) {
      pandal.images.forEach(img => {
        if (!images.includes(img)) images.push(img);
      });
    }
    
    // If no images found, add default
    if (images.length === 0) {
      images.push('l47920220926121122.jpeg');
    }
    
    return images;
  };

  const imagesArray = getImagesArray();

  const handleGetDirections = () => {
    const lat = pandal.coordinates.lat;
    const lng = pandal.coordinates.lng;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <>
      {/* Sliding Panel - No overlay */}
      <div className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white/95 backdrop-blur-lg border-l border-white/30 shadow-2xl z-50 transform transition-transform duration-500 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}>
        
        {/* Compact Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Pandal Details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Compact Pandal Header */}
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-2">
              <span className="text-white font-bold text-lg">
                {pandal.avatar}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{pandal.name}</h3>
            <div className="flex items-center justify-center space-x-1 text-gray-600">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">
                {isLoadingAddress ? 'Loading address...' : (currentAddress || pandal.location)}
              </span>
            </div>
          </div>

          {/* Compact Rating Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 text-sm">Rating & Reviews</h4>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-bold text-gray-800 text-sm">{averageRating.toFixed(1)}</span>
                <span className="text-gray-600 text-xs">({reviews.length})</span>
              </div>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Image Gallery Carousel */}
          {imagesArray.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Gallery</h4>
              <div className="w-full h-48 rounded-lg overflow-hidden">
                <ImageCarousel
                  images={imagesArray}
                  name={pandal.name}
                  autoSlide={true}
                  autoSlideInterval={5000}
                  className="w-full h-full"
                  showIndicators={imagesArray.length > 1}
                  showControls={imagesArray.length > 1}
                  aspectRatio="wide"
                  baseWidth={320}
                  pauseOnHover={true}
                  loop={true}
                />
              </div>
            </div>
          )}

          {/* Compact Description */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">About</h4>
            <p className="text-gray-700 leading-relaxed text-xs">
              {pandal.description}
            </p>
          </div>

          {/* Compact Map Section */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Location</h4>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-32 flex items-center justify-center border border-gray-300 relative">
              <div className="text-center text-gray-500">
                <MapPin className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs">Coordinates: {pandal.coordinates.lat.toFixed(4)}, {pandal.coordinates.lng.toFixed(4)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isLoadingAddress ? 'Loading address...' : (currentAddress || pandal.location)}
                </p>
              </div>
              {/* Overlay button for opening maps */}
              <button
                onClick={handleGetDirections}
                className="absolute inset-0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100"
              >
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Open in Maps
                </div>
              </button>
            </div>
          </div>

          {/* Compact Quick Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="flex items-center space-x-1 mb-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Timing</span>
              </div>
              <p className="text-xs text-blue-700">6 AM - 10 PM</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="flex items-center space-x-1 mb-1">
                <Calendar className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-green-800">Duration</span>
              </div>
              <p className="text-xs text-green-700">5 Days</p>
            </div>
          </div>

          {/* Compact Reviews */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Recent Reviews</h4>
            <div className="space-y-2">
              {reviews.slice(0, 2).map((review: any) => (
                <div key={review.id} className="bg-white/60 rounded-lg p-2 border border-white/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800 text-xs">{review.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium text-gray-700">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-xs mb-1">{review.comment}</p>
                  <span className="text-gray-500 text-xs">{review.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compact Nearby Pandals */}
          {nearbyPandals.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-1 text-sm">
                <MapPin className="h-4 w-4 text-purple-600" />
                <span>Nearby Pandals</span>
              </h4>
              <p className="text-gray-600 text-xs mb-2">
                Other pandals you can visit nearby
              </p>
              <div className="space-y-2">
                {nearbyPandals.slice(0, 3).map((nearbyPandal) => (
                  <div 
                    key={nearbyPandal.id} 
                    onClick={() => onPandalSelect(nearbyPandal)}
                    className="bg-white/60 rounded-lg p-2 border border-white/40 cursor-pointer hover:bg-white/80 hover:border-purple-300 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs">
                          {nearbyPandal.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-800 text-xs truncate">
                          {nearbyPandal.name}
                        </h5>
                        <div className="flex items-center space-x-1 text-gray-600 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{nearbyPandal.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-1 py-0.5 rounded ${
                            nearbyPandal.category === 'heritage' 
                              ? 'bg-amber-100 text-amber-800'
                              : nearbyPandal.category === 'modern'
                              ? 'bg-blue-100 text-blue-800'
                              : nearbyPandal.category === 'traditional'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {nearbyPandal.category}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">{nearbyPandal.popularity}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compact Action Buttons */}
          <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm p-2 -mx-4 -mb-4 border-t border-white/30">
            <div className="space-y-2">
              <button 
                onClick={handleGetDirections}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1"
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Get Directions</span>
              </button>
              <button className="w-full bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-600 font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Join Community</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PandalDetailsPanel;
