import React, { useState } from 'react';
import { Heart, Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { UserInteraction, BusinessStats } from '../types';

interface UserInteractionCardProps {
  businessId: string;
  currentUserId?: string;
  stats?: BusinessStats;
  userInteractions?: UserInteraction[];
  onLike?: () => void;
  onRate?: (rating: number) => void;
  onFeedback?: (feedback: string) => void;
  className?: string;
}

const UserInteractionCard: React.FC<UserInteractionCardProps> = ({
  businessId,
  currentUserId,
  stats,
  userInteractions = [],
  onLike,
  onRate,
  onFeedback,
  className = '',
}) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Check if current user has already liked/rated
  const userLike = userInteractions.find(
    (interaction) => interaction.userId === currentUserId && interaction.type === 'like'
  );
  const userRating = userInteractions.find(
    (interaction) => interaction.userId === currentUserId && interaction.type === 'rating'
  );

  const handleLike = () => {
    if (onLike && currentUserId) {
      onLike();
    }
  };

  const handleRatingSubmit = () => {
    if (onRate && currentUserId && selectedRating > 0) {
      onRate(selectedRating);
      setShowRatingModal(false);
      setSelectedRating(0);
    }
  };

  const handleFeedbackSubmit = () => {
    if (onFeedback && currentUserId && feedbackText.trim()) {
      onFeedback(feedbackText.trim());
      setShowFeedbackModal(false);
      setFeedbackText('');
    }
  };

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Support this business
        </h4>
        
        <div className="flex items-center justify-between gap-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={!currentUserId}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              userLike 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Heart className={`w-5 h-5 ${userLike ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">{stats?.totalLikes || 0}</span>
          </button>

          {/* Rating Button */}
          <button
            onClick={() => setShowRatingModal(true)}
            disabled={!currentUserId}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              userRating 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' 
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Star className={`w-5 h-5 ${userRating ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">
              {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
          </button>

          {/* Feedback Button */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            disabled={!currentUserId}
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">{stats?.totalFeedbacks || 0}</span>
          </button>

          {/* Views */}
          <div className="flex flex-col items-center gap-1 p-2">
            <ThumbsUp className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {stats?.totalViews || 0}
            </span>
          </div>
        </div>

        {!currentUserId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Sign in to interact with this business
          </p>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Rate this business
            </h3>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className={`p-1 rounded transition-colors ${
                    star <= selectedRating 
                      ? 'text-yellow-400' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className={`w-8 h-8 ${star <= selectedRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={selectedRating === 0}
                className="flex-1 py-2 px-4 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Share your feedback
            </h3>
            
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={500}
            />
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-right">
              {feedbackText.length}/500
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim()}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserInteractionCard;
