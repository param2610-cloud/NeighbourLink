import React, { useEffect, useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "motion/react";
import { ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageDisplay } from "../../utils/cloudinary/CloudinaryDisplay";

export interface ImageCarouselItem {
  publicId: string;
  title?: string;
  description?: string;
  id: number;
}

export interface ImageCarouselProps {
  images: string[];
  name: string;
  autoSlide?: boolean;
  autoSlideInterval?: number;
  className?: string;
  showIndicators?: boolean;
  showControls?: boolean;
  aspectRatio?: 'square' | 'wide' | 'tall';
  baseWidth?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

const DRAG_BUFFER = 50;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 };

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  name,
  autoSlide = true,
  autoSlideInterval = 3000,
  className = '',
  showIndicators = true,
  showControls = true,
  aspectRatio = 'wide',
  baseWidth = 300,
  pauseOnHover = true,
  loop = true,
  round = false
}) => {
  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  // Process images to create carousel items
  const processedImages = images.length > 0 
    ? images.filter(img => img && img.trim() !== '') // Filter out empty/null images
    : ['l47920220926121122.jpeg']; // fallback

  const carouselItems: ImageCarouselItem[] = processedImages.map((img, index) => ({
    publicId: img,
    title: `${name} - Image ${index + 1}`,
    description: '',
    id: index
  }));

  const displayItems = loop ? [...carouselItems, carouselItems[0]] : carouselItems;
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse enter/leave handlers for pause on hover
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  // Auto slide functionality
  useEffect(() => {
    if (autoSlide && (!pauseOnHover || !isHovered) && displayItems.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev === carouselItems.length - 1 && loop) {
            return prev + 1; // Go to the duplicate first item
          }
          if (prev === displayItems.length - 1) {
            return loop ? 0 : prev;
          }
          return prev + 1;
        });
      }, autoSlideInterval);
      return () => clearInterval(timer);
    }
  }, [
    autoSlide,
    autoSlideInterval,
    isHovered,
    loop,
    carouselItems.length,
    displayItems.length,
    pauseOnHover,
  ]);

  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (loop && currentIndex === displayItems.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      if (loop && currentIndex === carouselItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex((prev) => Math.min(prev + 1, displayItems.length - 1));
      }
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      if (loop && currentIndex === 0) {
        setCurrentIndex(carouselItems.length - 1);
      } else {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (displayItems.length - 1),
          right: 0,
        },
      };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'tall': return 'aspect-[3/4]';
      default: return 'aspect-[16/9]';
    }
  };

  const getImageUrl = (publicId: string) => {
    // If already a full URL, return as is
    if (publicId.startsWith('http')) return publicId;
    
    // If it's a Cloudinary public_id from the backend, use ImageDisplay component
    if (publicId && !publicId.includes('/')) {
        console.log(`https://res.cloudinary.com/dqdc9ioah/image/upload/v1734876088/${publicId}.jpg`);
      return `https://res.cloudinary.com/dqd7ywrxm/image/upload/${publicId}.jpg`;
    }
    
    // Legacy format for geobums
    return `https://geobums.com/photos/thumbs/${publicId}.jpg`;
  };

  const goToPrevious = () => {
    if (loop && currentIndex === 0) {
      setCurrentIndex(carouselItems.length - 1);
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const goToNext = () => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, displayItems.length - 1));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${
        round
          ? "rounded-full border border-white/20"
          : "rounded-xl border border-white/10"
      } ${getAspectRatioClass()} ${className}`}
      style={{
        width: `${baseWidth}px`,
        ...(round && { height: `${baseWidth}px` }),
      }}
    >
      <motion.div
        className="flex h-full"
        drag="x"
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {displayItems.map((item, index) => {
          const range = [
            -(index + 1) * trackItemOffset,
            -index * trackItemOffset,
            -(index - 1) * trackItemOffset,
          ];
          const outputRange = [10, 0, -10]; // Reduced rotation for better image viewing
          const rotateY = useTransform(x, range, outputRange, { clamp: false });
          
          return (
            <motion.div
              key={`${item.id}-${index}`}
              className={`relative shrink-0 flex overflow-hidden cursor-grab active:cursor-grabbing ${
                round ? "rounded-full" : "rounded-lg"
              }`}
              style={{
                width: itemWidth,
                height: round ? itemWidth : "100%",
                rotateY: rotateY,
              }}
              transition={effectiveTransition}
            >
              {/* Check if it's a Cloudinary public_id */}
              {item.publicId && !item.publicId.includes('/') && !item.publicId.startsWith('http') ? (
                <ImageDisplay 
                  publicId={item.publicId} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={getImageUrl(item.publicId)}
                  alt={item.title || `${name} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://i.cdn.newsbytesapp.com/images/l47920220926121122.jpeg';
                  }}
                  loading="lazy"
                />
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Image Counter */}
      {displayItems.length > 1 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="flex items-center space-x-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            <ImageIcon className="h-3 w-3" />
            <span>{(currentIndex % carouselItems.length) + 1}/{carouselItems.length}</span>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      {showControls && displayItems.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm opacity-0 group-hover:opacity-100 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showIndicators && displayItems.length > 1 && (
        <div className={`flex justify-center z-10 ${
          round ? "absolute bottom-4 left-1/2 -translate-x-1/2" : "absolute bottom-2 left-1/2 -translate-x-1/2"
        }`}>
          <div className="flex space-x-1">
            {carouselItems.map((_, index) => (
              <motion.button
                key={index}
                className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-200 ${
                  (currentIndex % carouselItems.length) === index
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                animate={{
                  scale: (currentIndex % carouselItems.length) === index ? 1.2 : 1,
                }}
                onClick={() => setCurrentIndex(index)}
                transition={{ duration: 0.15 }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-200/20 backdrop-blur-sm opacity-0 transition-opacity duration-200 pointer-events-none">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    </div>
  );
};

export default ImageCarousel;
