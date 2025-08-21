import React from 'react';
import { MapPin, Eye, MessageCircle, MoreVertical, Star } from 'lucide-react';
import { Pandal } from './data/pandalData';
import ImageCarousel from './ImageCarousel';

interface PandalCardProps {
  pandal: Pandal;
  onContactClick?: (pandal: Pandal) => void;
}

const PandalCard: React.FC<PandalCardProps> = ({ pandal, onContactClick }) => {

  // Get images array for carousel
  const getImagesArray = () => {
    const images: string[] = [];
    
    if (pandal.images && pandal.images.length > 0) {
      pandal.images.forEach(img => {
        console.log(img);

        if (!images.includes(img)) images.push(img);
      });
    }
    // Add all available images to the array
    // if (pandal.banner_image) images.push(pandal.banner_image);
    // if (pandal.avatar && pandal.avatar !== pandal.banner_image) images.push(pandal.avatar);
    // if (pandal.image && pandal.image !== pandal.banner_image && pandal.image !== pandal.avatar) images.push(pandal.image);
    
    // If no images found, add default
    // if (images.length === 0) {
    //   images.push('l47920220926121122.jpeg');
    // }
    
    return images;
  };

  const imagesArray = getImagesArray();

  // Get the image to display with fallback hierarchy
  const getImageSrc = () => {
    let imageId = '';
    console.log(pandal);

    // Priority: avatar > image > first image from images array > default
    if (pandal.avatar) imageId = pandal.avatar;
    else if (pandal.image) imageId = pandal.image;
    else if (pandal.images && pandal.images.length > 0) imageId = pandal.images[0];
    else imageId = 'l47920220926121122.jpeg';

    return `https://geobums.com/photos/thumbs/${imageId}.jpg`;
  };



  // Get the location text with fallback
  const getLocationText = () => {
    if (pandal.address) return pandal.address;
    if (pandal.location) return pandal.location;
    return `${pandal.coordinates.lat.toFixed(4)}, ${pandal.coordinates.lng.toFixed(4)}`;
  };

  // Get rating with fallback
  const getRating = () => {
    if (pandal.average_rating) return pandal.average_rating;
    return pandal.popularity || 5;
  };

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
                <img
            src={getImageSrc()}
            alt={pandal.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src = 'https://i.cdn.newsbytesapp.com/images/l47920220926121122.jpeg';
            }}
          />
              </span>
            </div>
            {/* Name and Rating */}
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg leading-tight">
                {pandal.name}
              </h3>
              {/* Rating Display */}
              <div className="flex items-center space-x-1 mt-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white/80 text-sm">
                  {getRating().toFixed(1)}
                </span>
                {pandal.reviews && pandal.reviews.length > 0 && (
                  <span className="text-white/60 text-xs">
                    ({pandal.reviews.length} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Optional Menu Button */}
          <button className="text-white/60 hover:text-white/80 p-2 rounded-full hover:bg-white/10 transition-all">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Pandal Image Carousel */}
        <div className="w-full h-48 rounded-xl mb-4 overflow-hidden border border-white/10 relative group">
          <ImageCarousel
            images={imagesArray}
            name={pandal.name}
            autoSlide={true}
            autoSlideInterval={4000}
            className="w-full h-full"
            showIndicators={imagesArray.length > 1}
            showControls={imagesArray.length > 1}
            aspectRatio="wide"
            baseWidth={350}
            pauseOnHover={true}
            loop={true}
          />
          {/* Category Badge */}
          {pandal.category && (
            <div className="absolute top-2 right-2 z-10">
              <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${
                pandal.category === 'heritage' 
                  ? 'bg-amber-500/80'
                  : pandal.category === 'modern'
                  ? 'bg-blue-500/80'
                  : pandal.category === 'traditional'
                  ? 'bg-green-500/80'
                  : 'bg-purple-500/80'
              }`}>
                {pandal.category}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3 overflow-hidden">
            {pandal.description}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-start text-white/80 mb-4">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-sm leading-relaxed">
            {getLocationText()}
          </span>
        </div>

        {/* Additional Info Row */}
        <div className="flex items-center justify-between text-white/70 text-xs mb-6">
          <div className="flex items-center space-x-4">
            {/* Distance if available */}
            {(pandal as any).distance && (
              <span>
                📍 {((pandal as any).distance).toFixed(1)} km away
              </span>
            )}
            {/* Created/Updated date if available */}
            {pandal.created_at && (
              <span>
                📅 {new Date(pandal.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {/* Popularity indicator */}
          <span className="text-white/60">
            ⭐ {(pandal.popularity || getRating()).toFixed(1)}/10
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button 
            className="flex-1 backdrop-blur-sm hover:cursor-pointer bg-white/20 border border-white/30 hover:border-white/40 text-white text-sm font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            onClick={() => onContactClick?.(pandal)}
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </button>
          
          <button 
            className="flex-1 backdrop-blur-sm bg-purple-500/90 hover:cursor-pointer hover:bg-purple-500 border border-purple-400/30 hover:border-purple-400/40 text-white text-sm font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            onClick={() => {
              // Open Google Maps with coordinates
              const lat = pandal.coordinates.lat;
              const lng = pandal.coordinates.lng;
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
              window.open(mapsUrl, '_blank');
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PandalCard;
