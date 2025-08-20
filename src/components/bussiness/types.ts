export interface Review {
  id: string;
  title: string;
  body: string;
  reviewerName: string;
  date: string;
  rating: number;
  reviewerAvatar?: string;
}

export interface PromotionFormData {
  title: string;
  description: string;
  contactInfo: {
    name: string;
    contact: string;
    email: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  visibilityRadius: string;
  images?: string[];
  videoUrl?: string;
  duration: string;
  isPromoted: boolean;
}

export interface UserInteraction {
  userId: string;
  type: 'like' | 'rating' | 'feedback';
  value?: number; // for ratings (1-5)
  comment?: string; // for feedback
  timestamp: Date;
}

export interface BusinessStats {
  totalViews: number;
  totalLikes: number;
  averageRating: number;
  totalRatings: number;
  totalFeedbacks: number;
  monthlyViews: number;
  monthlyLikes: number;
}

export interface BusinessCollection {
  id: string;
  businessName: string;
  businessBio: string;
  ownerId: string;
  isActive: boolean;
  isVerified: boolean;
  verificationDocUrl?: string;
  businessType: string;
  createdAt?: Date;

  contact: {
    phone: string;
    verified: boolean;
  };
  gallery: string[];
  businessProfileImage: string;
  coverImage: string;
  deliverySupport: boolean;
  paymentSupport?: {
    accountDetails?: string;
    qrCodeUrl?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  services: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    duration?: string;
    imageUrl?: string[];
  }[];

  products: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string[];
  }[];

  faq?: {
    question: string;
    answer: string;
  }[];

  // Add promoted items tracking
  promotedItems?: {
    serviceIds: string[];
    productIds: string[];
  };

  // User interactions
  userInteractions?: UserInteraction[];
  stats?: BusinessStats;
}
