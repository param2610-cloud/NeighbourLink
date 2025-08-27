import React, { useEffect, useState } from 'react';
import { MapPin, Star, Calendar, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription
} from '@/components/ui/sheet';
import { Pandal } from './data/pandalData';
import { Review } from '../../interface/main';
import { AddressManager } from '../../services/addressManager';
// import { ReviewService } from '../../services/reviewService';
import ImageCarousel from './ImageCarousel';
import ReviewSection from './ReviewSection';

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  // Update address and reviews when pandal changes
  useEffect(() => {
    const updateData = async () => {
      if (!pandal || !isOpen) return;

      // Update address
      const displayAddress = pandal.address || pandal.location;
      setCurrentAddress(displayAddress || '');

      // Initialize reviews and rating
      const initialReviews: Review[] = pandal.reviews && pandal.reviews.length > 0 
        ? pandal.reviews 
        : [
            { 
              id: "1", 
              title: "Amazing decorations!", 
              body: "The decorations were absolutely stunning and the atmosphere was very peaceful. Great cultural programs too.",
              reviewerName: "Rahul S.", 
              rating: 5, 
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            { 
              id: "2", 
              title: "Beautiful traditional pandal", 
              body: "Loved the traditional touch and authentic Bengali decorations. The daily aarti was very spiritual.",
              reviewerName: "Priya M.", 
              rating: 4, 
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            { 
              id: "3", 
              title: "Must visit for culture lovers", 
              body: "Great cultural programs and community feeling. The volunteer service was excellent.",
              reviewerName: "Amit K.", 
              rating: 5, 
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];

      setReviews(initialReviews);
      
      const calculatedRating = pandal.average_rating || 
        (initialReviews.length > 0 ? initialReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / initialReviews.length : pandal.popularity || 5);
      
      setAverageRating(calculatedRating);

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

    updateData();
  }, [pandal, isOpen]);

  if (!pandal) return null;

  // Get images array for carousel
  const getImagesArray = () => {
    const images: string[] = [];
    
    // Add gallery images (Cloudinary) first
    if (pandal.images && pandal.images.length > 0) {
      pandal.images.forEach((img: string) => {
        // Only add if it's not a placeholder or invalid image
        if (img && !images.includes(img) && img !== 'pandal_1_gallery_1' && img !== 'pandal_2_gallery_1') {
          images.push(img);
        }
      });
    }
    
    // Add banner image (geobums) if available
    if (pandal.banner_image && !images.includes(pandal.banner_image)) {
      images.push(pandal.banner_image);
    }
    
    // Add avatar image (geobums) if available and different from banner
    if (pandal.avatar_image && pandal.avatar_image !== pandal.banner_image && !images.includes(pandal.avatar_image)) {
      images.push(pandal.avatar_image);
    }
    
    // If no images found, add default
    if (images.length === 0) {
      images.push('l47920220926121122');
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

  if (!pandal) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[480px] md:w-[520px] p-0 bg-white/95 backdrop-blur-lg border-l border-white/30"
      >
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-white/20 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-bold text-gray-800">
                  Pandal Details
                </SheetTitle>
                <SheetDescription className="text-gray-600 mt-1">
                  {pandal?.name || 'Explore pandal information'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {pandal && (
                <motion.div
                  key={pandal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="p-6 space-y-6"
                >
                  
                  {/* Pandal Header */}
                  <div className="text-center">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3 overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <img
                        src={`https://geobums.com/photos/thumbs/${pandal.avatar_image || pandal.banner_image || 'l47920220926121122'}.jpg`}
                        alt={pandal.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to letter avatar if image fails
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                      <span className="text-white font-bold text-xl hidden items-center justify-center w-full h-full">
                        {pandal.avatar || pandal.name?.charAt(0) || 'P'}
                      </span>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{pandal.name}</h3>
                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {isLoadingAddress ? 'Loading address...' : (currentAddress || pandal.location)}
                      </span>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <motion.div 
                    className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Rating & Reviews</h4>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-800 text-lg">{averageRating.toFixed(1)}</span>
                        <span className="text-gray-600 text-sm">({reviews.length})</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.div
                          key={star}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + star * 0.1 }}
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Image Gallery Carousel */}
                  {imagesArray.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h4 className="font-semibold text-gray-800 mb-3">Gallery</h4>
                      <div className="w-full h-64 rounded-xl overflow-hidden shadow-lg">
                        <ImageCarousel
                          images={imagesArray}
                          name={pandal.name}
                          autoSlide={true}
                          autoSlideInterval={5000}
                          className="w-full h-full"
                          showIndicators={imagesArray.length > 1}
                          showControls={imagesArray.length > 1}
                          aspectRatio="wide"
                          baseWidth={480}
                          pauseOnHover={true}
                          loop={true}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h4 className="font-semibold text-gray-800 mb-3">About</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {pandal.description}
                    </p>
                  </motion.div>

                  {/* Location Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h4 className="font-semibold text-gray-800 mb-3">Location</h4>
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-40 flex items-center justify-center border border-gray-300 relative overflow-hidden">
                      <div className="text-center text-gray-500">
                        <MapPin className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Coordinates: {pandal.coordinates.lat.toFixed(4)}, {pandal.coordinates.lng.toFixed(4)}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {isLoadingAddress ? 'Loading address...' : (currentAddress || pandal.location)}
                        </p>
                      </div>
                      {/* Overlay button for opening maps */}
                      <motion.button
                        onClick={handleGetDirections}
                        className="absolute inset-0 hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center opacity-0 hover:opacity-100"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                          Open in Maps
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Quick Info */}
                  <motion.div 
                    className="grid grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Timing</span>
                      </div>
                      <p className="text-sm text-blue-700">6 AM - 10 PM</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Duration</span>
                      </div>
                      <p className="text-sm text-green-700">5 Days</p>
                    </div>
                  </motion.div>

                  {/* Recent Reviews */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h4 className="font-semibold text-gray-800 mb-4">Recent Reviews</h4>
                    <div className="space-y-3">
                      {reviews.slice(0, 3).map((review, index) => (
                        <motion.div 
                          key={review.id} 
                          className="bg-white/80 rounded-xl p-4 border border-white/40 shadow-sm"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                  {review.reviewerName?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <span className="font-medium text-gray-800">{review.reviewerName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-gray-700">{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{review.body}</p>
                          <span className="text-gray-500 text-xs">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Reviews Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <ReviewSection
                      reviews={reviews}
                      pandalName={pandal.name}
                      averageRating={averageRating}
                      onAddReview={async (reviewData) => {
                        try {
                          // In a real app, this would make an API call
                          const newReview: Review = {
                            id: Date.now().toString(),
                            title: reviewData.title,
                            body: reviewData.body,
                            reviewerName: reviewData.reviewerName,
                            date: new Date().toISOString(),
                            rating: reviewData.rating
                          };

                          // Update local state
                          const updatedReviews = [...reviews, newReview];
                          setReviews(updatedReviews);
                          
                          // Recalculate average rating
                          const newAverageRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0) / updatedReviews.length;
                          setAverageRating(newAverageRating);

                          console.log('Review added successfully:', newReview);
                          
                          // TODO: Implement actual API call using ReviewService
                          // await ReviewService.addReview(pandal.id, reviewData);
                        } catch (error) {
                          console.error('Error adding review:', error);
                          throw error;
                        }
                      }}
                    />
                  </motion.div>

                  {/* Nearby Pandals */}
                  {nearbyPandals.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <span>Nearby Pandals</span>
                      </h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Other pandals you can visit nearby
                      </p>
                      <div className="space-y-3">
                        {nearbyPandals.slice(0, 4).map((nearbyPandal, index) => (
                          <motion.div 
                            key={nearbyPandal.id} 
                            onClick={() => onPandalSelect(nearbyPandal)}
                            className="bg-white/80 rounded-xl p-4 border border-white/40 cursor-pointer hover:bg-white/90 hover:border-purple-300 transition-all duration-200 shadow-sm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 + index * 0.1 }}
                            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <img
                                  src={`https://geobums.com/photos/thumbs/${nearbyPandal.avatar_image || nearbyPandal.banner_image || 'l47920220926121122'}.jpg`}
                                  alt={nearbyPandal.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to letter avatar if image fails
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextElementSibling) {
                                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                    }
                                  }}
                                />
                                <span className="text-white font-semibold hidden items-center justify-center w-full h-full">
                                  {nearbyPandal.avatar || nearbyPandal.name?.charAt(0) || 'P'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-800 text-base truncate">
                                  {nearbyPandal.name}
                                </h5>
                                <div className="flex items-center space-x-1 text-gray-600 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-sm">{nearbyPandal.location}</span>
                                </div>
                                <div className="flex items-center space-x-3 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
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
                                    <span className="text-sm text-gray-600">{nearbyPandal.popularity}/10</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div 
                    className="sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 -mx-6 -mb-6 border-t border-white/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                  >
                    <div className="space-y-3">
                      <motion.button 
                        onClick={handleGetDirections}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MapPin className="h-5 w-5" />
                        <span>Get Directions</span>
                      </motion.button>
                      <motion.button 
                        className="w-full bg-white/90 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-600 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Users className="h-5 w-5" />
                        <span>Join Community</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};

export default PandalDetailsPanel;
