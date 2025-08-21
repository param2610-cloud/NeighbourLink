export interface S3UploadParams {
  Bucket: string;
  Key: string;
  Body: File;
  ContentType: string;
}

export interface S3UploadResponse {
  Location: string;
  [key: string]: any;
}
export interface PostFormState {
  postType: "resource" | "event" | "promotion" | "update" | null;
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  uploadingImages: boolean;
  uploadedImages: string[];
  uploadedVideo: string | null;
  errors: Record<string, string>;
}

export interface ResourceFormData {
  type: "offer" | "need";
  category: "food" | "shelter" | "medical" | "transportation" | "other";
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  duration: string;
  useProfileLocation: boolean;
  location?: Location;
  visibilityRadius: string;
  images?: string[];
}

export interface EventFormData {
  title: string;
  description: string;
  eventType:
    | "cultural"
    | "technical"
    | "sports"
    | "workshop"
    | "seminar"
    | "other";
  organizerDetails: {
    name: string;
    contact: string;
    email: string;
  };
  useProfileLocation: boolean;
  location?: Location;
  timingInfo: {
    date: string;
    time: string;
    duration: string;
  };
  isRegistrationRequired: boolean;
  registrationLink?: string;
  visibilityRadius: string;
  images?: string[];
  bannerImageIndex?: number;
  duration: string;
}

export interface PromotionFormData {
  title: string;
  description: string;
  contactInfo: {
    name: string;
    contact: string;
    email: string;
  };
  location?: Location;
  visibilityRadius: string;
  images?: string[];
  videoUrl?: string;
  duration: string;
  isPromoted: boolean;
}

export interface UpdateFormData {
  title: string;
  description: string;
  useProfileLocation: boolean;
  location?: Location;
  date: string;
  visibilityRadius: string;
  images?: string[];
  duration: string;
  parentId?: string; // ID of the parent update (if this is a reply)
  childUpdates?: string[]; // Array of child update IDs (replies to this update)
  threadDepth: number; // Depth in the thread (0 for original, increases for replies)
}

export interface UpdateWithUserData extends UpdateFormData {
  id: string;
  userId: string;
  createdAt: any;
  userData?: {
    firstName?: string;
    lastName?: string;
    photoURL?: string;
  };
  replyCount?: number;
}

export interface Review {
  id: string;
  title: string;
  body: string;
  reviewerName: string;
  date: string;
  rating: number;
  reviewerAvatar?: string;
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
    mode?: "upi" | "bank" | null;
    upi?: {
      qrCodeUrl?: string;
    };
    bank?: {
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    };
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


export interface Pandel {
  id: number;
  name: string;
  description: string;
  average_rating: number;
  coordinates: {
    lat: number;
    long: number;
  };
  banner_image: string;
  created_at: string;
  updated_at: string;
  images: string[];
  category: string;
  popularity: number;
  avatar_image: string;
  address: string;
  reviews: Review[];
}

// Legacy interface for backward compatibility
export interface Pandal {
  id: string;
  name: string;
  description: string;
  location: string;
  district?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image?: string;
  avatar: string;
  popularity: number;
  category: 'traditional' | 'modern' | 'heritage' | 'community';
  // Additional fields from backend
  average_rating?: number;
  banner_image?: string;
  created_at?: string;
  updated_at?: string;
  images?: string[];
  avatar_image?: string;
  address?: string;
  reviews?: Review[];
}

