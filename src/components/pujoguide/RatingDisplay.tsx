import React from 'react';
import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  showNumber?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  maxRating = 5,
  showNumber = true,
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          const isHalfFilled = starValue - 0.5 <= rating && rating < starValue;

          return (
            <div key={index} className="relative">
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-300'
                }`}
              />
              {isHalfFilled && (
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: '50%' }}
                >
                  <Star
                    className={`${sizeClasses[size]} text-yellow-500 fill-current`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {showNumber && (
        <span className={`font-medium text-gray-700 ${textSizeClasses[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
