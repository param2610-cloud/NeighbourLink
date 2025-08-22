import { Review } from '../interface/main';

const API_BASE_URL = 'http://localhost:8000'; // Adjust this to match your backend URL

export class ReviewService {
  static async addReview(pandalId: string, reviewData: {
    title: string;
    body: string;
    reviewerName: string;
    rating: number;
  }): Promise<Review> {
    try {
      const response = await fetch(`${API_BASE_URL}/pandel/${pandalId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          date: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add review: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  static async getReviews(pandalId: string): Promise<Review[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/pandel/${pandalId}/reviews`);

      if (!response.ok) {
        throw new Error(`Failed to get reviews: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting reviews:', error);
      throw error;
    }
  }

  static async deleteReview(pandalId: string, reviewId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/pandel/${pandalId}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete review: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  // Calculate local average rating from reviews array
  static calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }

  // Format review date for display
  static formatReviewDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  // Validate review data before submission
  static validateReviewData(reviewData: {
    title: string;
    body: string;
    reviewerName: string;
    rating: number;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!reviewData.reviewerName.trim()) {
      errors.reviewerName = 'Name is required';
    }

    if (!reviewData.title.trim()) {
      errors.title = 'Review title is required';
    }

    if (!reviewData.body.trim()) {
      errors.body = 'Review description is required';
    } else if (reviewData.body.trim().length < 10) {
      errors.body = 'Review description must be at least 10 characters';
    }

    if (reviewData.rating < 1 || reviewData.rating > 5) {
      errors.rating = 'Rating must be between 1 and 5';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default ReviewService;
