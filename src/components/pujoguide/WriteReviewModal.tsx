import React, { useState } from 'react';
import { Star, X, User, MessageSquare } from 'lucide-react';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: {
    rating: number;
    title: string;
    body: string;
    reviewerName: string;
  }) => void;
  pandalName: string;
  isLoading?: boolean;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pandalName,
  isLoading = false
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setTitle('');
    setBody('');
    setReviewerName('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!reviewerName.trim()) {
      newErrors.reviewerName = 'Name is required';
    }

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!title.trim()) {
      newErrors.title = 'Review title is required';
    }

    if (!body.trim()) {
      newErrors.body = 'Review description is required';
    } else if (body.trim().length < 10) {
      newErrors.body = 'Review description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      rating,
      title: title.trim(),
      body: body.trim(),
      reviewerName: reviewerName.trim()
    });

    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Write a Review</h2>
            <p className="text-sm text-gray-600 mt-1">Share your experience at {pandalName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100/50 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reviewer Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Your Name *
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Enter your name"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.reviewerName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white/50'
              } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm`}
              disabled={isLoading}
            />
            {errors.reviewerName && (
              <p className="text-red-500 text-xs mt-1">{errors.reviewerName}</p>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rating *
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 rounded transition-transform hover:scale-110"
                    disabled={isLoading}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {getRatingText(hoveredRating || rating)}
              </p>
            </div>
            {errors.rating && (
              <p className="text-red-500 text-xs mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your visit in a few words"
              maxLength={100}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white/50'
              } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm`}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title && (
                <p className="text-red-500 text-xs">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">{title.length}/100</p>
            </div>
          </div>

          {/* Review Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Your Review *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell others about your experience at this pandal..."
              maxLength={500}
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.body ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white/50'
              } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm resize-none`}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.body && (
                <p className="text-red-500 text-xs">{errors.body}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">{body.length}/500</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
