import React from 'react';
import { Star, Calendar } from 'lucide-react';
import { Review } from '../../interface/main';

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  onReply?: (reviewId: string) => void;
  showActions?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  // onHelpful, 
  // onReply, 
  // showActions = true 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:bg-white/70 transition-all duration-200">
      {/* Review Header */}
      <div className="flex items-start space-x-3 mb-3">
        {/* Reviewer Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
          {review.reviewerAvatar ? (
            <img
              src={review.reviewerAvatar}
              alt={review.reviewerName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <span className={`text-white font-semibold text-sm ${review.reviewerAvatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
            {getAvatarInitials(review.reviewerName)}
          </span>
        </div>

        {/* Review Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-800 text-sm truncate">
              {review.reviewerName}
            </h4>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-500">{formatDate(review.date)}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
          </div>

          {/* Review Title */}
          {review.title && (
            <h5 className="font-medium text-gray-800 text-sm mb-2">
              {review.title}
            </h5>
          )}
        </div>
      </div>

      {/* Review Body */}
      <div className="mb-3">
        <p className="text-gray-700 text-sm leading-relaxed">
          {review.body}
        </p>
      </div>

      {/* Review Actions */}
      {/* {showActions && (
        <div className="flex items-center space-x-4 pt-2 border-t border-gray-200/50">
          <button
            onClick={() => onHelpful?.(review.id)}
            className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors text-xs"
          >
            <ThumbsUp className="h-3 w-3" />
            <span>Helpful</span>
          </button>
          
          <button
            onClick={() => onReply?.(review.id)}
            className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors text-xs"
          >
            <MessageCircle className="h-3 w-3" />
            <span>Reply</span>
          </button>
        </div>
      )} */}
    </div>
  );
};

export default ReviewCard;
