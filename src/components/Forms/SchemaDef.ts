import * as z from 'zod';

// Define post types
export type PostType = 'resource' | 'event' | 'promotion' | 'update';

// Resource form schema
export const resourceSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  customCategory: z.string().optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  urgency: z.number().min(1).max(3),
  duration: z.string().min(1, { message: "Please specify duration" }),
  locationType: z.enum(['default', 'custom']),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  address: z.string().optional(),
  visibilityRadius: z.number().min(1).max(100),
  resourceType: z.enum(['need', 'offer']),
  isAnonymous: z.boolean().default(false),
  photos: z.array(z.any()).optional(),
});

// Event form schema
export const eventSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  eventType: z.string().min(1, { message: "Please select an event type" }),
  organizerDetails: z.string(),
  locationType: z.enum(['default', 'custom']),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  address: z.string().optional(),
  eventDate: z.string().min(1, { message: "Please specify event date" }),
  eventTime: z.string().min(1, { message: "Please specify event time" }),
  registrationRequired: z.boolean().default(false),
  registrationLink: z.string().optional(),
  visibilityRadius: z.number().min(1).max(100),
  duration: z.string().min(1, { message: "Please specify duration" }),
  photos: z.array(z.any()).optional(),
});

// Promotion form schema
export const promotionSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  contactDetails: z.string(),
  locationType: z.enum(['default', 'custom']),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  address: z.string().optional(),
  visibilityRadius: z.number().min(1).max(100),
  duration: z.string().min(1, { message: "Please specify duration" }),
  photos: z.array(z.any()).optional(),
});

// Update form schema
export const updateSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  locationType: z.enum(['default', 'custom']),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  address: z.string().optional(),
  date: z.string().min(1, { message: "Please specify date" }),
  visibilityRadius: z.number().min(1).max(100),
  duration: z.string().min(1, { message: "Please specify duration" }),
  photos: z.array(z.any()).optional(),
});

// Get schema based on post type
export const getSchemaForType = (type: PostType) => {
  switch (type) {
    case 'resource': return resourceSchema;
    case 'event': return eventSchema;
    case 'promotion': return promotionSchema;
    case 'update': return updateSchema;
    default: return resourceSchema;
  }
};