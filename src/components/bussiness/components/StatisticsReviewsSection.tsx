import React from 'react';
import { Review } from '../types';
import StarRating from './StarRating';

interface StatisticsReviewsSectionProps {
  reviews: Review[];
}

const StatisticsReviewsSection: React.FC<StatisticsReviewsSectionProps> = ({
  reviews,
}) => {
  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center mb-6">
        <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
          Customer Reviews
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
          >
            <StarRating rating={review.rating} className="mb-2" />
            <h4 className="font-medium text-gray-800 dark:text-white mb-1">
              {review.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {review.body}
            </p>
            <div className="flex items-center gap-2">
              <img
                src={review.reviewerAvatar || "/api/placeholder/32/32"}
                alt={review.reviewerName}
                className="w-6 h-6 rounded-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div className="font-medium">{review.reviewerName}</div>
                <div>{new Date(review.date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <StarRating rating={0} className="justify-center mb-2" />
          </div>
          <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
            No Reviews Yet
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Customer reviews will appear here once you start receiving feedback.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatisticsReviewsSection;
