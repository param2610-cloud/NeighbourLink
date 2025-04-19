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
    postType: 'resource' | 'event' | 'promotion' | 'update' | null;
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
    type: 'offer' | 'need';
    category: 'food' | 'shelter' | 'medical' | 'transportation' | 'other';
    title: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
    duration: string;
    useProfileLocation: boolean;
    location?: Location;
    visibilityRadius: string;
    images?: string[];
}

export interface EventFormData {
    title: string;
    description: string;
    eventType: 'cultural' | 'technical' | 'sports' | 'workshop' | 'seminar' | 'other';
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
    useProfileLocation: boolean;
    location?: Location;
    visibilityRadius: string;
    images?: string[];
    videoUrl?: string;
    duration: string;
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
    parentId?: string;       // ID of the parent update (if this is a reply)
    childUpdates?: string[]; // Array of child update IDs (replies to this update)
    threadDepth: number;     // Depth in the thread (0 for original, increases for replies)
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