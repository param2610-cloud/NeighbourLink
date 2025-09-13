import React, { useState } from 'react';
import { Star, Plus, Filter, Search, MessageSquare, TrendingUp } from 'lucide-react';
import { Review } from '../../interface/main';
import ReviewCard from './ReviewCard';
import WriteReviewModal from './WriteReviewModal';
import RatingBreakdown from './RatingBreakdown';

interface ReviewSectionProps {
  reviews: Review[];
  pandalName: string;
  averageRating: number;
  onAddReview: (review: {
    rating: number;
    title: string;
    body: string;
    reviewerName: string;
  }) => Promise<void>;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1';

const ReviewSection: React.FC<ReviewSectionProps> = ({
  reviews,
  pandalName,
  averageRating,
  onAddReview,
  className = ''
}) => {
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Filter and sort reviews
  const processedReviews = React.useMemo(() => {
    let filtered = [...reviews];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(review =>
        review.title.toLowerCase().includes(query) ||
        review.body.toLowerCase().includes(query) ||
        review.reviewerName.toLowerCase().includes(query)
      );
    }

    // Apply rating filter
    if (filterBy !== 'all') {
      const targetRating = parseInt(filterBy);
      filtered = filtered.filter(review => review.rating === targetRating);
    }

    // Sort reviews
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        // For now, maintain current order (could implement helpful count later)
        break;
      default:
        break;
    }

    return filtered;
  }, [reviews, searchQuery, filterBy, sortBy]);

  const handleSubmitReview = async (reviewData: {
    rating: number;
    title: string;
    body: string;
    reviewerName: string;
  }) => {
    setIsSubmittingReview(true);
    try {
      await onAddReview(reviewData);
      setIsWriteReviewOpen(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      // Handle error (could show error message)
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'highest': return 'Highest Rating';
      case 'lowest': return 'Lowest Rating';
      case 'helpful': return 'Most Helpful';
      default: return '';
    }
  };

  const getFilterLabel = (option: FilterOption) => {
    if (option === 'all') return 'All Ratings';
    return `${option} Stars`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-800">
            Reviews & Ratings
          </h2>
          <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2 py-1 rounded-full">
            {reviews.length}
          </span>
        </div>

        <button
          onClick={() => setIsWriteReviewOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Write Review</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
            <span className="text-lg font-bold text-gray-800">{averageRating.toFixed(1)}</span>
            <span className="text-gray-600">/ 5.0</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Average Rating</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-bold text-gray-800">{reviews.length}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Total Reviews</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-lg font-bold text-gray-800">
              {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Positive Reviews</p>
        </div>
      </div>

      {/* Rating Breakdown Toggle */}
      {reviews.length > 0 && (
        <div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
          >
            <span>{showBreakdown ? 'Hide' : 'Show'} Rating Breakdown</span>
            <div className={`transform transition-transform ${showBreakdown ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>

          {showBreakdown && (
            <div className="mt-4">
              <RatingBreakdown
                reviews={reviews}
                totalReviews={reviews.length}
                averageRating={averageRating}
              />
            </div>
          )}
        </div>
      )}

      {/* Filters and Search */}
      {reviews.length > 0 && (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70 text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              {/* Sort Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white/70 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {(['newest', 'oldest', 'highest', 'lowest', 'helpful'] as SortOption[]).map(option => (
                    <option key={option} value={option}>
                      {getSortLabel(option)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white/70 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {(['all', '5', '4', '3', '2', '1'] as FilterOption[]).map(option => (
                  <option key={option} value={option}>
                    {getFilterLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filterBy !== 'all') && (
            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200/50">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  Search: "{searchQuery}"
                </span>
              )}
              {filterBy !== 'all' && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {filterBy} stars
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                  setSortBy('newest');
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {processedReviews.length > 0 ? (
          <>
            {processedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpful={(reviewId) => {
                  console.log('Mark helpful:', reviewId);
                  // Implement helpful functionality
                }}
                onReply={(reviewId) => {
                  console.log('Reply to:', reviewId);
                  // Implement reply functionality
                }}
              />
            ))}

            {/* Show count */}
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">
                Showing {processedReviews.length} of {reviews.length} reviews
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white/30 rounded-xl border border-white/30">
            {reviews.length === 0 ? (
              <>
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No reviews yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to share your experience at {pandalName}!
                </p>
                <button
                  onClick={() => setIsWriteReviewOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                >
                  Write the First Review
                </button>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No reviews match your criteria
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter settings
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterBy('all');
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        onSubmit={handleSubmitReview}
        pandalName={pandalName}
        isLoading={isSubmittingReview}
      />
    </div>
  );
};

export default ReviewSection;
