import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Calendar, Users } from 'lucide-react';
import { Pandal, Review } from '@/interface/main';
import { PandelService } from '@/services/pandelService';
import ImageCarousel from '@/components/pujoguide/ImageCarousel';
import ReviewSection from '@/components/pujoguide/ReviewSection';

const PandalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [pandal, setPandal] = useState<Pandal | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [nearbyPandals, setNearbyPandals] = useState<Pandal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPandalDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch pandal details from backend
        const pandalData = await PandelService.getPandelById(parseInt(id));
        if (!pandalData) {
          navigate('/pujo-planner');
          return;
        }
        
        const convertedPandal = PandelService.convertToLegacyFormat(pandalData);
        setPandal(convertedPandal);
        
        // Update address and reviews
        await updatePandalData(convertedPandal);
        
        // Get nearby pandals
        const nearby = await PandelService.getPandelsByLocation(
          convertedPandal.coordinates.lat,
          convertedPandal.coordinates.lng,
          5
        );
        const convertedNearby = nearby
          .map(PandelService.convertToLegacyFormat)
          .filter(p => p.id !== convertedPandal.id)
          .slice(0, 5);
        setNearbyPandals(convertedNearby);
        
      } catch (error) {
        console.error('Error loading pandal details:', error);
        // Redirect back if pandal not found
        navigate('/pujo-planner');
      } finally {
        setIsLoading(false);
      }
    };

    loadPandalDetails();
  }, [id, navigate]);

  const updatePandalData = async (pandalData: Pandal) => {
    // Update address
    const displayAddress = pandalData.address || pandalData.location;
    setCurrentAddress(displayAddress || '');

    // Initialize reviews and rating
    const initialReviews: Review[] = pandalData.reviews && pandalData.reviews.length > 0 
      ? pandalData.reviews 
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
    
    const calculatedRating = pandalData.average_rating || 
      (initialReviews.length > 0 ? initialReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / initialReviews.length : pandalData.popularity || 5);
    
    setAverageRating(calculatedRating);

    // Only fetch address if we don't have a detailed one and we have coordinates
    if (!displayAddress || displayAddress.length < 20) {
      setIsLoadingAddress(true);
      try {
        // For now, just use the existing address since AddressManager is not available
        // TODO: Implement address fetching from coordinates if needed
        setCurrentAddress(displayAddress || pandalData.location || 'Address not available');
      } catch (error) {
        console.error('Error updating address:', error);
      } finally {
        setIsLoadingAddress(false);
      }
    }
  };

  const getImagesArray = () => {
    if (!pandal) return [];
    
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

  const handleGetDirections = () => {
    if (!pandal) return;
    const lat = pandal.coordinates.lat;
    const lng = pandal.coordinates.lng;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
  };

  const handleNearbyPandalClick = (nearbyPandal: Pandal) => {
    navigate(`/pujo-planner/pandal/${nearbyPandal.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(/assets/pujo-bg2.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading pandal details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pandal) {
    return (
      <div className="min-h-screen relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(/assets/pujo-bg2.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-white text-lg">Pandal not found</p>
            <button
              onClick={() => navigate('/pujo-planner')}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Pujo Planner
            </button>
          </div>
        </div>
      </div>
    );
  }

  const imagesArray = getImagesArray();

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: 'url(/assets/pujo-bg2.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header with back button */}
        <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-lg border-b border-white/20">
          <button
            onClick={() => navigate('/pujo-planner')}
            className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Pujo Planner</span>
          </button>
          <h1 className="text-xl font-bold text-white">Pandal Details</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          
          {/* Pandal Header */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 overflow-hidden">
                <img
                  src={`https://geobums.com/photos/thumbs/${pandal.avatar_image || pandal.banner_image || 'l47920220926121122'}.jpg`}
                  alt={pandal.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <span className="text-white font-bold text-2xl hidden items-center justify-center w-full h-full">
                  {pandal.avatar || pandal.name?.charAt(0) || 'P'}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{pandal.name}</h2>
              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                <MapPin className="h-4 w-4" />
                <span>
                  {isLoadingAddress ? 'Loading address...' : (currentAddress || pandal.location)}
                </span>
              </div>
              
              {/* Rating */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                <span className="text-gray-600">({reviews.length} reviews)</span>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          {imagesArray.length > 0 && (
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Gallery</h3>
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <ImageCarousel
                  images={imagesArray}
                  name={pandal.name}
                  autoSlide={true}
                  autoSlideInterval={5000}
                  className="w-full h-full"
                  showIndicators={imagesArray.length > 1}
                  showControls={imagesArray.length > 1}
                  aspectRatio="wide"
                  baseWidth={800}
                  pauseOnHover={true}
                  loop={true}
                />
              </div>
            </div>
          )}

          {/* Description and Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Description */}
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">About</h3>
              <p className="text-gray-700 leading-relaxed">
                {pandal.description}
              </p>
            </div>

            {/* Quick Info */}
            <div className="space-y-4">
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-800">Timing:</span>
                      <span className="text-gray-600 ml-2">6 AM - 10 PM</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-medium text-gray-800">Duration:</span>
                      <span className="text-gray-600 ml-2">5 Days</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <div>
                      <span className="font-medium text-gray-800">Location:</span>
                      <span className="text-gray-600 ml-2">{pandal.coordinates.lat.toFixed(4)}, {pandal.coordinates.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={handleGetDirections}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Get Directions</span>
                </button>
                <button className="w-full bg-white/80 hover:bg-white border border-purple-200 hover:border-purple-300 text-purple-600 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Join Community</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl p-6">
            <ReviewSection
              reviews={reviews}
              pandalName={pandal.name}
              averageRating={averageRating}
              onAddReview={async (reviewData) => {
                try {
                  const newReview: Review = {
                    id: Date.now().toString(),
                    title: reviewData.title,
                    body: reviewData.body,
                    reviewerName: reviewData.reviewerName,
                    date: new Date().toISOString(),
                    rating: reviewData.rating
                  };

                  const updatedReviews = [...reviews, newReview];
                  setReviews(updatedReviews);
                  
                  const newAverageRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0) / updatedReviews.length;
                  setAverageRating(newAverageRating);

                  console.log('Review added successfully:', newReview);
                } catch (error) {
                  console.error('Error adding review:', error);
                  throw error;
                }
              }}
            />
          </div>

          {/* Nearby Pandals */}
          {nearbyPandals.length > 0 && (
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/30 shadow-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span>Nearby Pandals</span>
              </h3>
              <p className="text-gray-600 mb-4">
                Other pandals you can visit nearby
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyPandals.map((nearbyPandal) => (
                  <div 
                    key={nearbyPandal.id} 
                    onClick={() => handleNearbyPandalClick(nearbyPandal)}
                    className="bg-white/60 rounded-lg p-4 border border-white/40 cursor-pointer hover:bg-white/80 hover:border-purple-300 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src={`https://geobums.com/photos/thumbs/${nearbyPandal.avatar_image || nearbyPandal.banner_image || 'l47920220926121122'}.jpg`}
                          alt={nearbyPandal.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
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
                        <h4 className="font-medium text-gray-800 truncate">
                          {nearbyPandal.name}
                        </h4>
                        <div className="flex items-center space-x-1 text-gray-600 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm truncate">{nearbyPandal.location}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-700">
                            {nearbyPandal.average_rating?.toFixed(1) || nearbyPandal.popularity || 4.5}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PandalDetailsPage;
