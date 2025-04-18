import { PostType } from './SchemaDef';

// Default values for resource form
export const defaultResourceValues = {
  title: "",
  category: "Medical",
  customCategory: "",
  description: "",
  urgency: 1,
  duration: "1 week",
  locationType: "default" as const,
  latitude: "",
  longitude: "",
  address: "",
  visibilityRadius: 3,
  resourceType: "need" as const,
  isAnonymous: false,
  photos: []
};

// Default values for event form
export const defaultEventValues = {
  title: "",
  description: "",
  eventType: "Cultural",
  organizerDetails: "",
  locationType: "default" as const,
  latitude: "",
  longitude: "",
  address: "",
  eventDate: "",
  eventTime: "",
  registrationRequired: false,
  registrationLink: "",
  visibilityRadius: 5,
  duration: "1 day",
  photos: []
};

// Default values for promotion form
export const defaultPromotionValues = {
  title: "",
  description: "",
  contactDetails: "",
  locationType: "default" as const,
  latitude: "",
  longitude: "",
  address: "",
  visibilityRadius: 5,
  duration: "1 week",
  photos: []
};

// Default values for update form
export const defaultUpdateValues = {
  title: "",
  description: "",
  locationType: "default" as const,
  latitude: "",
  longitude: "",
  address: "",
  date: "",
  visibilityRadius: 5,
  duration: "1 week",
  photos: []
};

// Get default values based on post type
export const getDefaultValues = (postType: PostType) => {
  switch (postType) {
    case 'resource': return defaultResourceValues;
    case 'event': return defaultEventValues;
    case 'promotion': return defaultPromotionValues;
    case 'update': return defaultUpdateValues;
    default: return defaultResourceValues;
  }
};