import { useState, useEffect, useCallback } from 'react';
import { BusinessInteractionService } from '../utils/businessInteractions';
import { UserInteraction, BusinessStats } from '../types';
import { toast } from 'react-toastify';

interface UseBusinessInteractionsProps {
  businessId: string;
  currentUserId?: string;
}

interface UseBusinessInteractionsReturn {
  stats: BusinessStats | undefined;
  userInteractions: UserInteraction[];
  userHasLiked: boolean;
  userRating: number | null;
  loading: boolean;
  handleLike: () => Promise<void>;
  handleRate: (rating: number) => Promise<void>;
  handleFeedback: (feedback: string) => Promise<void>;
  incrementViews: () => Promise<void>;
}

export const useBusinessInteractions = ({
  businessId,
  currentUserId,
}: UseBusinessInteractionsProps): UseBusinessInteractionsReturn => {
  const [stats, setStats] = useState<BusinessStats | undefined>(undefined);
  const [userInteractions, setUserInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState(false);

  // Get user-specific states
  const userLike = userInteractions.find(
    (interaction) => interaction.userId === currentUserId && interaction.type === 'like'
  );
  const userRatingInteraction = userInteractions.find(
    (interaction) => interaction.userId === currentUserId && interaction.type === 'rating'
  );

  const userHasLiked = !!userLike;
  const userRating = userRatingInteraction?.value || null;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await BusinessInteractionService.initializeStats(businessId);
        const interactions = await BusinessInteractionService.getUserInteractions(businessId);
        setUserInteractions(interactions);
      } catch (error) {
        console.error('Error loading business interactions:', error);
        toast.error('Failed to load business data');
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadData();
    }
  }, [businessId]);

  // Handle like toggle
  const handleLike = useCallback(async () => {
    if (!currentUserId) {
      toast.error('Please sign in to like this business');
      return;
    }

    try {
      setLoading(true);
      const isLiked = await BusinessInteractionService.toggleLike(businessId, currentUserId);
      
      // Update local state
      if (isLiked) {
        const newInteraction: UserInteraction = {
          userId: currentUserId,
          type: 'like',
          timestamp: new Date(),
        };
        setUserInteractions(prev => [...prev, newInteraction]);
        setStats(prev => prev ? { ...prev, totalLikes: prev.totalLikes + 1 } : undefined);
        toast.success('Business liked!');
      } else {
        setUserInteractions(prev => 
          prev.filter(i => !(i.userId === currentUserId && i.type === 'like'))
        );
        setStats(prev => prev ? { ...prev, totalLikes: Math.max(0, prev.totalLikes - 1) } : undefined);
        toast.success('Like removed');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  }, [businessId, currentUserId]);

  // Handle rating
  const handleRate = useCallback(async (rating: number) => {
    if (!currentUserId) {
      toast.error('Please sign in to rate this business');
      return;
    }

    try {
      setLoading(true);
      await BusinessInteractionService.addRating(businessId, currentUserId, rating);
      
      // Update local state
      const newInteraction: UserInteraction = {
        userId: currentUserId,
        type: 'rating',
        value: rating,
        timestamp: new Date(),
      };

      setUserInteractions(prev => {
        const filtered = prev.filter(i => !(i.userId === currentUserId && i.type === 'rating'));
        return [...filtered, newInteraction];
      });

      // Update stats (simplified calculation for immediate feedback)
      setStats(prev => {
        if (!prev) return undefined;
        const isNewRating = !userRatingInteraction;
        const newTotalRatings = isNewRating ? prev.totalRatings + 1 : prev.totalRatings;
        const newAverage = isNewRating 
          ? ((prev.averageRating * prev.totalRatings) + rating) / newTotalRatings
          : prev.averageRating; // Simplified - in reality we'd recalculate properly
        
        return {
          ...prev,
          totalRatings: newTotalRatings,
          averageRating: newAverage,
        };
      });

      toast.success('Rating submitted!');
    } catch (error) {
      console.error('Error adding rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  }, [businessId, currentUserId, userRatingInteraction]);

  // Handle feedback
  const handleFeedback = useCallback(async (feedback: string) => {
    if (!currentUserId) {
      toast.error('Please sign in to provide feedback');
      return;
    }

    try {
      setLoading(true);
      await BusinessInteractionService.addFeedback(businessId, currentUserId, feedback);
      
      // Update local state
      const newInteraction: UserInteraction = {
        userId: currentUserId,
        type: 'feedback',
        comment: feedback,
        timestamp: new Date(),
      };

      setUserInteractions(prev => [...prev, newInteraction]);
      setStats(prev => prev ? { ...prev, totalFeedbacks: prev.totalFeedbacks + 1 } : undefined);
      
      toast.success('Feedback submitted!');
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  }, [businessId, currentUserId]);

  // Handle view increment
  const incrementViews = useCallback(async () => {
    try {
      await BusinessInteractionService.incrementViews(businessId);
      setStats(prev => prev ? { 
        ...prev, 
        totalViews: prev.totalViews + 1,
        monthlyViews: prev.monthlyViews + 1,
      } : undefined);
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't show error toast for views - it's not critical for user experience
    }
  }, [businessId]);

  return {
    stats,
    userInteractions,
    userHasLiked,
    userRating,
    loading,
    handleLike,
    handleRate,
    handleFeedback,
    incrementViews,
  };
};
