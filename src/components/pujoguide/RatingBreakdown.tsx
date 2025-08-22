import React from 'react';
import { Star } from 'lucide-react';

interface RatingBreakdownProps {
  reviews: Array<{ rating: number }>;
  totalReviews: number;
  averageRating: number;
  className?: string;
}

const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  reviews,
  totalReviews,
  averageRating,
  className = ''
}) => {
  // Calculate rating distribution
  const ratingCounts = [1, 2, 3, 4, 5].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );

  const getRatingPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };



  return (
    <div className={`bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 ${className}`}>
      {/* Overall Rating */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Overall Rating</h3>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-gray-800">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600 text-sm">
              out of 5
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Large Rating Display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            {averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">
            / 5.0
          </div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingCounts[rating - 1];
          const percentage = getRatingPercentage(count);
          
          return (
            <div key={rating} className="flex items-center space-x-3 text-sm">
              {/* Rating Label */}
              <div className="flex items-center space-x-1 w-20">
                <span className="text-gray-700 font-medium">{rating}</span>
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
              </div>

              {/* Progress Bar */}
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count and Percentage */}
              <div className="text-gray-600 text-xs w-16 text-right">
                {count} ({percentage.toFixed(0)}%)
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-purple-600">
              {ratingCounts[4] + ratingCounts[3]}
            </div>
            <div className="text-xs text-gray-600">
              Positive Reviews
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-green-600">
              {totalReviews > 0 ? Math.round(((ratingCounts[4] + ratingCounts[3]) / totalReviews) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-600">
              Satisfaction Rate
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-blue-600">
              {ratingCounts[4]}
            </div>
            <div className="text-xs text-gray-600">
              5-Star Reviews
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingBreakdown;
