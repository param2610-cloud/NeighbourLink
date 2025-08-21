import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/firebase';
import { UserInteraction, BusinessStats } from '../types';

export class BusinessInteractionService {
  
  /**
   * Add or toggle a like for a business
   */
  static async toggleLike(businessId: string, userId: string): Promise<boolean> {
    try {
      const businessRef = doc(db, 'business', businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error('Business not found');
      }
      
      const businessData = businessDoc.data();
      const userInteractions = businessData.userInteractions || [];
      
      // Check if user already liked
      const existingLike = userInteractions.find(
        (interaction: UserInteraction) => 
          interaction.userId === userId && interaction.type === 'like'
      );
      
      const newInteraction: UserInteraction = {
        userId,
        type: 'like',
        timestamp: new Date(),
      };
      
      if (existingLike) {
        // Remove like
        await updateDoc(businessRef, {
          userInteractions: arrayRemove(existingLike),
          'stats.totalLikes': increment(-1),
        });
        return false; // unliked
      } else {
        // Add like
        await updateDoc(businessRef, {
          userInteractions: arrayUnion(newInteraction),
          'stats.totalLikes': increment(1),
        });
        return true; // liked
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Add or update a rating for a business
   */
  static async addRating(businessId: string, userId: string, rating: number): Promise<void> {
    try {
      const businessRef = doc(db, 'business', businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error('Business not found');
      }
      
      const businessData = businessDoc.data();
      const userInteractions = businessData.userInteractions || [];
      const stats = businessData.stats || {};
      
      // Check if user already rated
      const existingRating = userInteractions.find(
        (interaction: UserInteraction) => 
          interaction.userId === userId && interaction.type === 'rating'
      );
      
      const newInteraction: UserInteraction = {
        userId,
        type: 'rating',
        value: rating,
        timestamp: new Date(),
      };
      
      if (existingRating) {
        // Update existing rating
        const updatedInteractions = userInteractions.map((interaction: UserInteraction) =>
          interaction.userId === userId && interaction.type === 'rating'
            ? newInteraction
            : interaction
        );
        
        // Recalculate average rating
        const ratings = updatedInteractions
          .filter((i: UserInteraction) => i.type === 'rating')
          .map((i: UserInteraction) => i.value || 0);
        
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length 
          : 0;
        
        await updateDoc(businessRef, {
          userInteractions: updatedInteractions,
          'stats.averageRating': averageRating,
        });
      } else {
        // Add new rating
        const totalRatings = (stats.totalRatings || 0) + 1;
        const currentAverage = stats.averageRating || 0;
        const newAverage = ((currentAverage * (totalRatings - 1)) + rating) / totalRatings;
        
        await updateDoc(businessRef, {
          userInteractions: arrayUnion(newInteraction),
          'stats.totalRatings': increment(1),
          'stats.averageRating': newAverage,
        });
      }
    } catch (error) {
      console.error('Error adding rating:', error);
      throw error;
    }
  }

  /**
   * Add feedback for a business
   */
  static async addFeedback(businessId: string, userId: string, feedback: string): Promise<void> {
    try {
      const businessRef = doc(db, 'business', businessId);
      
      const newInteraction: UserInteraction = {
        userId,
        type: 'feedback',
        comment: feedback,
        timestamp: new Date(),
      };
      
      await updateDoc(businessRef, {
        userInteractions: arrayUnion(newInteraction),
        'stats.totalFeedbacks': increment(1),
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  }

  /**
   * Increment view count for a business
   */
  static async incrementViews(businessId: string): Promise<void> {
    try {
      const businessRef = doc(db, 'business', businessId);
      await updateDoc(businessRef, {
        'stats.totalViews': increment(1),
        'stats.monthlyViews': increment(1),
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  }

  /**
   * Initialize stats for a business (if they don't exist)
   */
  static async initializeStats(businessId: string): Promise<void> {
    try {
      const businessRef = doc(db, 'business', businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error('Business not found');
      }
      
      const businessData = businessDoc.data();
      
      if (!businessData.stats) {
        const initialStats: BusinessStats = {
          totalViews: 0,
          totalLikes: 0,
          averageRating: 0,
          totalRatings: 0,
          totalFeedbacks: 0,
          monthlyViews: 0,
          monthlyLikes: 0,
        };
        
        await updateDoc(businessRef, {
          stats: initialStats,
          userInteractions: [],
        });
      }
    } catch (error) {
      console.error('Error initializing stats:', error);
      throw error;
    }
  }

  /**
   * Get user interactions for a specific business
   */
  static async getUserInteractions(businessId: string): Promise<UserInteraction[]> {
    try {
      const businessRef = doc(db, 'business', businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error('Business not found');
      }
      
      const businessData = businessDoc.data();
      return businessData.userInteractions || [];
    } catch (error) {
      console.error('Error getting user interactions:', error);
      throw error;
    }
  }
}
