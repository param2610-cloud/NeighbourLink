import React, { useState, useEffect } from 'react';
import { notifyNearbyUsersAboutResource, notifyNearbyUsersAboutEvent } from '@/utils/notification/NotificationHook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import GoogleMapsViewer from '@/utils/google_map/GoogleMapsViewer';
import { 
  geocodeAddress, 
  reverseGeocode, 
  getCurrentLocation
} from '@/utils/google_map/GoogleMapsUtils';

import { db } from '@/firebase';
import { useStateContext } from '@/contexts/StateContext';
import { uploadFileToCloudinary } from '@/utils/cloudinary/cloudinary';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface UserProfile {
  address?: string;
  firstName?: string;
  lastName?: string;
  location?: {
    latitude: string;
    longitude: string;
  };
  [key: string]: any; // Allow for other properties
}

interface PostFormState {
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

interface ResourceFormData {
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

interface EventFormData {
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

interface PromotionFormData {
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

interface UpdateFormData {
  title: string;
  description: string;
  useProfileLocation: boolean;
  location?: Location;
  date: string;
  visibilityRadius: string;
  images?: string[];
  duration: string;
  parentId?: string;
  childUpdates?: string[];
  threadDepth?: number;
}

interface NewPostFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialPostType?: 'resource' | 'event' | 'promotion' | 'update' | null;
  onSuccess?: () => void;
  userData?: UserProfile | null; // Accept user data from parent component
  parentUpdateId?: string; // Add this line to accept parent update ID for replies
  threadDepth?: number; // Add thread depth for nested updates
}

const NewPostForm: React.FC<NewPostFormProps> = ({ 
  isOpen = false, 
  onClose = () => {}, 
  initialPostType = null,
  onSuccess = () => {},
  userData = null,
  parentUpdateId = undefined,
  threadDepth = 0 
}) => {
  const { user: currentUser } = useStateContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(userData); // Initialize with passed data

  const initialFormState: PostFormState = {
    postType: initialPostType,
    currentStep: 1,
    totalSteps: 3,
    isSubmitting: false,
    isSuccess: false,
    error: null,
    uploadingImages: false,
    uploadedImages: [],
    uploadedVideo: null,
    errors: {},
  };

  const [formState, setFormState] = useState<PostFormState>(initialFormState);

  const initialResourceForm: ResourceFormData = {
    type: 'offer',
    category: 'food',
    title: '',
    description: '',
    urgency: 'medium',
    duration: '',
    useProfileLocation: true,
    visibilityRadius: '5',
  };

  const initialEventForm: EventFormData = {
    title: '',
    description: '',
    eventType: 'cultural',
    organizerDetails: {
      name: '',
      contact: '',
      email: '',
    },
    useProfileLocation: true,
    timingInfo: {
      date: '',
      time: '',
      duration: '',
    },
    isRegistrationRequired: false,
    visibilityRadius: '5',
    duration: '',
  };

  const initialPromotionForm: PromotionFormData = {
    title: '',
    description: '',
    contactInfo: {
      name: '',
      contact: '',
      email: '',
    },
    useProfileLocation: true,
    visibilityRadius: '5',
    duration: '',
  };

  const initialUpdateForm: UpdateFormData = {
    title: '',
    description: '',
    useProfileLocation: true,
    date: '',
    visibilityRadius: '5',
    duration: '',
    parentId: parentUpdateId, // Initialize with the parent ID if provided
    childUpdates: [], // Initialize empty array for child updates
    threadDepth: threadDepth // Set the thread depth
  };

  const [resourceForm, setResourceForm] = useState<ResourceFormData>(initialResourceForm);
  const [eventForm, setEventForm] = useState<EventFormData>(initialEventForm);
  const [promotionForm, setPromotionForm] = useState<PromotionFormData>(initialPromotionForm);
  const [updateForm, setUpdateForm] = useState<UpdateFormData>(initialUpdateForm);

  // Use userData directly if it's provided
  useEffect(() => {
    if (userData) {
      setUserProfile(userData);
    }
  }, [userData]);

  // Only fetch from Firestore if userData wasn't provided
  useEffect(() => {
    if (!userProfile && currentUser) {
      console.log("Fetching user profile data from Firestore");
      // No need to fetch if we already have the data from props
      import('@/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, getDoc }) => {
          const userRef = doc(db, 'Users', currentUser.uid);
          getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              console.log("Fetched user profile:", data);
              setUserProfile(data);
            }
          }).catch(err => console.error("Error fetching user profile:", err));
        });
      });
    }
  }, [currentUser, userProfile]);

  // Set default locations from user profile when it's loaded
  useEffect(() => {
    if (userProfile?.location) {
      console.log("Setting location from user profile", userProfile.location);
      const profileLocation = {
        latitude: parseFloat(userProfile.location.latitude),
        longitude: parseFloat(userProfile.location.longitude),
        address: userProfile.address || "Your location"
      };

      // Ensure the location is set for all form types
      setResourceForm(prev => ({ ...prev, location: profileLocation }));
      setEventForm(prev => ({ ...prev, location: profileLocation }));
      setPromotionForm(prev => ({ ...prev, location: profileLocation }));
      setUpdateForm(prev => ({ ...prev, location: profileLocation }));
    } else {
      console.log("User profile has no location data:", userProfile);
    }
  }, [userProfile]);

  useEffect(() => {
    if (initialPostType && ['resource', 'event', 'promotion', 'update'].includes(initialPostType)) {
      setFormState(prev => ({
        ...prev,
        postType: initialPostType,
      }));
    }
  }, [initialPostType]);

  // Helper function to handle map click and location selection
  const handleMapClick = async (coordinates: { lat: number; lng: number }) => {
    try {
      // Get the address from coordinates using reverse geocoding
      const address = await reverseGeocode(coordinates);
      
      const newLocation: Location = {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address: address || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
      };

      // Update the appropriate form based on current post type
      switch (formState.postType) {
        case 'resource':
          setResourceForm(prev => ({ ...prev, location: newLocation }));
          break;
        case 'event':
          setEventForm(prev => ({ ...prev, location: newLocation }));
          break;
        case 'promotion':
          setPromotionForm(prev => ({ ...prev, location: newLocation }));
          break;
        case 'update':
          setUpdateForm(prev => ({ ...prev, location: newLocation }));
          break;
      }
    } catch (error) {
      console.error('Error getting address:', error);
      // Fallback without address
      const newLocation: Location = {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address: `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
      };

      switch (formState.postType) {
        case 'resource':
          setResourceForm(prev => ({ ...prev, location: newLocation }));
          break;
        case 'event':
          setEventForm(prev => ({ ...prev, location: newLocation }));
          break;
        case 'promotion':
          setPromotionForm(prev => ({ ...prev, location: newLocation }));
          break;
        case 'update':
          setUpdateForm(prev => ({ ...prev, location: newLocation }));
          break;
      }
    }
  };

  const resetAllForms = () => {
    setFormState({...initialFormState, postType: null});
    setResourceForm(initialResourceForm);
    setEventForm(initialEventForm);
    setPromotionForm(initialPromotionForm);
    setUpdateForm(initialUpdateForm);
  };

  // Enhanced address search function
  const handleAddressSearch = async (address: string, formType: string) => {
    if (!address.trim()) return;
    
    try {
      const coordinates = await geocodeAddress(address);
      if (coordinates) {
        const newLocation: Location = {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          address: address
        };

        switch (formType) {
          case 'resource':
            setResourceForm(prev => ({ ...prev, location: newLocation }));
            break;
          case 'event':
            setEventForm(prev => ({ ...prev, location: newLocation }));
            break;
          case 'promotion':
            setPromotionForm(prev => ({ ...prev, location: newLocation }));
            break;
          case 'update':
            setUpdateForm(prev => ({ ...prev, location: newLocation }));
            break;
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setFormState(prev => ({
        ...prev,
        error: "Could not find the address. Please try a different location or click on the map."
      }));
    }
  };

  // Get current location function
  const handleGetCurrentLocation = async (formType: string) => {
    try {
      setFormState(prev => ({ ...prev, loading: true }));
      const currentLocation = await getCurrentLocation();
      
      if (currentLocation) {
        const address = await reverseGeocode(currentLocation);
        const newLocation: Location = {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          address: address || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
        };

        switch (formType) {
          case 'resource':
            setResourceForm(prev => ({ ...prev, location: newLocation }));
            break;
          case 'event':
            setEventForm(prev => ({ ...prev, location: newLocation }));
            break;
          case 'promotion':
            setPromotionForm(prev => ({ ...prev, location: newLocation }));
            break;
          case 'update':
            setUpdateForm(prev => ({ ...prev, location: newLocation }));
            break;
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setFormState(prev => ({
        ...prev,
        error: "Could not get your current location. Please enable location services or select manually."
      }));
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setFormState(prev => ({ ...prev, uploadingImages: true }));

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;
        return await uploadFileToCloudinary(file, fileName);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setFormState(prev => ({
        ...prev,
        uploadedImages: [...prev.uploadedImages, ...uploadedUrls],
      }));
    } catch (error) {
      console.error("Upload failed:", error);
      setFormState(prev => ({
        ...prev,
        error: "Failed to upload images. Please try again."
      }));
    } finally {
      setFormState(prev => ({ ...prev, uploadingImages: false }));
    }
  };

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return;

    setFormState(prev => ({ ...prev, uploadingImages: true }));

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const videoUrl = await uploadFileToCloudinary(file, fileName);

      setFormState(prev => ({
        ...prev,
        uploadedVideo: videoUrl,
      }));
    } catch (error) {
      console.error("Video upload failed:", error);
      setFormState(prev => ({
        ...prev,
        error: "Failed to upload video. Please try again."
      }));
    } finally {
      setFormState(prev => ({ ...prev, uploadingImages: false }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    switch (formState.postType) {
      case 'resource':
        switch (formState.currentStep) {
          case 1:
            if (!resourceForm.title || resourceForm.title.length < 3) {
              errors.title = "Title must be at least 3 characters";
              isValid = false;
            }
            if (!resourceForm.description || resourceForm.description.length < 10) {
              errors.description = "Description must be at least 10 characters";
              isValid = false;
            }
            break;
          case 2:
            if (!resourceForm.duration) {
              errors.duration = "Duration is required";
              isValid = false;
            }
            if (!resourceForm.visibilityRadius) {
              errors.visibilityRadius = "Visibility radius is required";
              isValid = false;
            }
            if (!resourceForm.useProfileLocation && !resourceForm.location) {
              errors.location = "Location is required";
              isValid = false;
            }
            break;
        }
        break;
      case 'event':
        switch (formState.currentStep) {
          case 1:
            if (!eventForm.title || eventForm.title.length < 3) {
              errors.title = "Title must be at least 3 characters";
              isValid = false;
            }
            if (!eventForm.description || eventForm.description.length < 10) {
              errors.description = "Description must be at least 10 characters";
              isValid = false;
            }
            if (!eventForm.organizerDetails.name) {
              errors['organizerDetails.name'] = "Organizer name is required";
              isValid = false;
            }
            if (!eventForm.organizerDetails.contact) {
              errors['organizerDetails.contact'] = "Contact is required";
              isValid = false;
            }
            if (!eventForm.organizerDetails.email || !/^\S+@\S+\.\S+$/.test(eventForm.organizerDetails.email)) {
              errors['organizerDetails.email'] = "Invalid email address";
              isValid = false;
            }
            break;
          case 2:
            if (!eventForm.timingInfo.date) {
              errors['timingInfo.date'] = "Date is required";
              isValid = false;
            }
            if (!eventForm.timingInfo.time) {
              errors['timingInfo.time'] = "Time is required";
              isValid = false;
            }
            if (!eventForm.timingInfo.duration) {
              errors['timingInfo.duration'] = "Duration is required";
              isValid = false;
            }
            if (!eventForm.visibilityRadius) {
              errors.visibilityRadius = "Visibility radius is required";
              isValid = false;
            }
            if (!eventForm.useProfileLocation && !eventForm.location) {
              errors.location = "Location is required";
              isValid = false;
            }
            if (!eventForm.duration) {
              errors.duration = "Duration is required";
              isValid = false;
            }
            if (eventForm.isRegistrationRequired && !eventForm.registrationLink) {
              errors.registrationLink = "Registration link is required when registration is needed";
              isValid = false;
            }
            break;
        }
        break;
      case 'promotion':
        switch (formState.currentStep) {
          case 1:
            if (!promotionForm.title || promotionForm.title.length < 3) {
              errors.title = "Title must be at least 3 characters";
              isValid = false;
            }
            if (!promotionForm.description || promotionForm.description.length < 10) {
              errors.description = "Description must be at least 10 characters";
              isValid = false;
            }
            if (!promotionForm.contactInfo.name) {
              errors['contactInfo.name'] = "Contact name is required";
              isValid = false;
            }
            if (!promotionForm.contactInfo.contact) {
              errors['contactInfo.contact'] = "Contact number is required";
              isValid = false;
            }
            if (!promotionForm.contactInfo.email || !/^\S+@\S+\.\S+$/.test(promotionForm.contactInfo.email)) {
              errors['contactInfo.email'] = "Invalid email address";
              isValid = false;
            }
            break;
          case 2:
            if (!promotionForm.visibilityRadius) {
              errors.visibilityRadius = "Visibility radius is required";
              isValid = false;
            }
            if (!promotionForm.useProfileLocation && !promotionForm.location) {
              errors.location = "Location is required";
              isValid = false;
            }
            if (!promotionForm.duration) {
              errors.duration = "Duration is required";
              isValid = false;
            }
            break;
        }
        break;
      case 'update':
        switch (formState.currentStep) {
          case 1:
            if (!updateForm.title || updateForm.title.length < 3) {
              errors.title = "Title must be at least 3 characters";
              isValid = false;
            }
            if (!updateForm.description || updateForm.description.length < 10) {
              errors.description = "Description must be at least 10 characters";
              isValid = false;
            }
            if (!updateForm.date) {
              errors.date = "Date is required";
              isValid = false;
            }
            break;
          case 2:
            if (!updateForm.visibilityRadius) {
              errors.visibilityRadius = "Visibility radius is required";
              isValid = false;
            }
            if (!updateForm.useProfileLocation && !updateForm.location) {
              errors.location = "Location is required";
              isValid = false;
            }
            if (!updateForm.duration) {
              errors.duration = "Duration is required";
              isValid = false;
            }
            break;
        }
        break;
    }

    setFormState(prev => ({ ...prev, errors }));
    return isValid;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setFormState(prev => ({
        ...prev,
        error: null,
        currentStep: Math.min(prev.currentStep + 1, prev.totalSteps),
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        error: "Please fill all required fields correctly before proceeding."
      }));
    }
  };

  const prevStep = () => {
    if (formState.currentStep > 1) {
      setFormState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const handleSubmitSuccess = () => {
    setFormState(prev => ({ ...prev, isSuccess: true }));
    
    // Reset form after 3.5 seconds and close the form
    setTimeout(() => {
      onSuccess();
      resetAllForms();
      onClose(); // Close the form modal
    }, 3500);
  };

  // Add this helper function to fetch user profile data
  const fetchUserProfileData = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log("Fetching user profile data on demand for location");
      const userDocRef = doc(db, 'Users', userId); // Note: Using 'Users' collection instead of 'users'
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserProfile;
        console.log("Fetched user profile for location:", data);
        return data;
      } else {
        console.error("User document not found");
        return null;
      }
    } catch (err) {
      console.error("Error fetching user profile data:", err);
      return null;
    }
  };

  const handleSubmit = async () => {
    console.log("Starting form submission process");
    
    if (!currentUser || !formState.postType) {
      console.error("Authentication error or missing post type:", { currentUser, postType: formState.postType });
      setFormState(prev => ({
        ...prev,
        error: "Authentication error. Please sign in again."
      }));
      return;
    }

    console.log("Validating form data before submission");
    if (!validateCurrentStep()) {
      console.error("Form validation failed", formState.errors);
      setFormState(prev => ({
        ...prev,
        error: "Please fix all errors before submitting."
      }));
      return;
    }

    console.log("Setting form to submitting state");
    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      console.log(`Creating ${formState.postType} post for user ${currentUser.uid}`);
      const commonData = {
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        responders: [],
        images: formState.uploadedImages,
      };
      console.log("Common post data:", commonData);

      let postData: Record<string, any> = { ...commonData };
      let locationData = null;
      
      // Ensure we have user profile data if useProfileLocation is true
      let profileDataForLocation = userProfile;
      
      // Fetch user profile data if needed
      if (!profileDataForLocation && currentUser.uid) {
        const needToFetchProfile = 
          (formState.postType === 'resource' && resourceForm.useProfileLocation) ||
          (formState.postType === 'event' && eventForm.useProfileLocation) ||
          (formState.postType === 'promotion' && promotionForm.useProfileLocation) ||
          (formState.postType === 'update' && updateForm.useProfileLocation);
          
        if (needToFetchProfile) {
          console.log("Profile data needed but not available, fetching now...");
          profileDataForLocation = await fetchUserProfileData(currentUser.uid);
          // Update state for future use
          setUserProfile(profileDataForLocation);
        }
      }

      // Handle location data based on useProfileLocation toggle
      console.log(`Processing ${formState.postType} form data with location handling`);
      switch (formState.postType) {
        case 'resource':
          console.log("Resource form data:", resourceForm);
          // Ensure we have valid location data
          locationData = resourceForm.useProfileLocation && profileDataForLocation?.location 
            ? {
                latitude: parseFloat(profileDataForLocation.location.latitude),
                longitude: parseFloat(profileDataForLocation.location.longitude),
                address: profileDataForLocation.address || "User location"
              }
            : resourceForm.location;
          
          console.log("Resource location data:", locationData);
          
          // Check if location data is valid
          if (!locationData) {
            console.error("Missing location data for resource post");
            throw new Error("Location data is missing. Please try again or select a custom location.");
          }

          postData = { 
            ...resourceForm, 
            ...postData,
            location: locationData
          };
          break;

        case 'event':
          console.log("Event form data:", eventForm);
          locationData = eventForm.useProfileLocation && profileDataForLocation?.location 
            ? {
                latitude: parseFloat(profileDataForLocation.location.latitude),
                longitude: parseFloat(profileDataForLocation.location.longitude),
                address: profileDataForLocation.address || "Event location"
              }
            : eventForm.location;
          
          console.log("Event location data:", locationData);
          
          if (!locationData) {
            console.error("Missing location data for event post");
            throw new Error("Location data is missing. Please try again or select a custom location.");
          }

          postData = { 
            ...eventForm, 
            ...postData,
            location: locationData
          };
          break;

        case 'promotion':
          console.log("Promotion form data:", promotionForm);
          locationData = promotionForm.useProfileLocation && profileDataForLocation?.location 
            ? {
                latitude: parseFloat(profileDataForLocation.location.latitude),
                longitude: parseFloat(profileDataForLocation.location.longitude),
                address: profileDataForLocation.address || "Promotion location"
              }
            : promotionForm.location;
          
          console.log("Promotion location data:", locationData);
          
          if (!locationData) {
            console.error("Missing location data for promotion post");
            throw new Error("Location data is missing. Please try again or select a custom location.");
          }

          postData = { 
            ...promotionForm, 
            ...postData, 
            videoUrl: formState.uploadedVideo,
            location: locationData
          };
          break;

        case 'update':
          console.log("Update form data:", updateForm);
          locationData = updateForm.useProfileLocation && profileDataForLocation?.location 
            ? {
                latitude: parseFloat(profileDataForLocation.location.latitude),
                longitude: parseFloat(profileDataForLocation.location.longitude),
                address: profileDataForLocation.address || "Update location"
              }
            : updateForm.location;
          
          console.log("Update location data:", locationData);
          console.log("Parent update ID:", updateForm.parentId);
          console.log("Thread depth:", updateForm.threadDepth);
          
          if (!locationData) {
            console.error("Missing location data for update post");
            throw new Error("Location data is missing. Please try again or select a custom location.");
          }

          postData = { 
            ...updateForm, 
            ...postData,
            location: locationData,
            parentId: updateForm.parentId || null, // Use null if parentId is not provided
            childUpdates: updateForm.childUpdates || [],
            threadDepth: updateForm.threadDepth || 0
          };
          break;
      }
      
      // Final check to ensure we have location data before submission
      if (!postData.location || !postData.location.latitude || !postData.location.longitude) {
        console.error("Invalid location data in final check:", postData.location);
        throw new Error("Invalid location data. Please check your profile settings or select a custom location.");
      }
      
      console.log("Final post data to be submitted:", postData);
      
      const collectionRef = collection(db, `${formState.postType}s`);
      console.log(`Submitting to Firestore collection: ${formState.postType}s`);
      
      const docRef = await addDoc(collectionRef, postData);
      console.log(`Document successfully added with ID: ${docRef.id}`);

      // Check if this is a high urgency resource post
      if (formState.postType === 'resource' && 
          resourceForm.type === 'need' && 
          resourceForm.urgency === 'high') {
        console.log("High urgency resource detected. Sending notifications to nearby users.");
        
        // Get the location data
        const postLocation = {
          latitude: postData.location.latitude,
          longitude: postData.location.longitude
        };
        
        // Notify nearby users (within 5km) about the high urgency resource
        await notifyNearbyUsersAboutResource(
          docRef.id,
          resourceForm.title,
          resourceForm.description,
          postLocation,
          5, // 5km radius
          currentUser.uid // Current user ID to avoid self-notification
        );
        
        console.log("Notifications sent for high urgency resource");
      }

      // Send notifications for event posts
      if (formState.postType === 'event') {
        console.log("Event created. Sending notifications to nearby users.");
        
        // Get the location data
        const eventLocation = {
          latitude: postData.location.latitude,
          longitude: postData.location.longitude
        };
        
        // Notify nearby users (within 10km) about the new event
        await notifyNearbyUsersAboutEvent(
          docRef.id,
          eventForm.title,
          eventForm.description,
          eventLocation,
          eventForm.timingInfo.date,
          10, // 10km radius
          currentUser.uid // Current user ID to avoid self-notification
        );
        
        console.log("Notifications sent for new event");
      }

      // If this is a reply (has a parentId), update the parent document to include this as a child
      if (formState.postType === 'update' && updateForm.parentId) {
        console.log(`Updating parent update ${updateForm.parentId} with new child ${docRef.id}`);
        const parentRef = doc(db, 'updates', updateForm.parentId);
        await updateDoc(parentRef, {
          childUpdates: arrayUnion(docRef.id)
        });
        console.log("Parent document updated successfully");
      }

      console.log("Post submission completed successfully");
      handleSubmitSuccess();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setFormState(prev => ({
        ...prev,
        error: error.message || "Failed to submit form. Please try again."
      }));
    } finally {
      console.log("Form submission process completed");
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (!isOpen) return null;

  const renderImageUploadSection = () => {
    return (
      <div className="bg-secondary/20 rounded-lg p-4 h-full flex flex-col">
        <h3 className="text-lg font-medium mb-4 text-foreground">Media</h3>
        
        {formState.uploadedImages.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto mb-4">
              {formState.uploadedImages.map((image, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
                  <ImageDisplay publicId={image} className="w-full aspect-square object-cover rounded-md" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <button
                      type="button"
                      className="bg-red-500 text-white rounded-full p-1 ml-auto"
                      onClick={() => {
                        const newImages = [...formState.uploadedImages];
                        newImages.splice(index, 1);
                        setFormState(prev => ({ ...prev, uploadedImages: newImages }));
                        
                        if (formState.postType === 'event' && eventForm.bannerImageIndex === index) {
                          setEventForm({ ...eventForm, bannerImageIndex: undefined });
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {formState.postType === 'event' && eventForm.bannerImageIndex === index && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                      Banner
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(`${formState.postType}-images`)?.click()}
                disabled={formState.uploadingImages}
                className="w-full flex items-center justify-center gap-2 border-dashed"
              >
                <Upload className="h-4 w-4" />
                {formState.uploadingImages ? 'Uploading...' : 'Add More Images'}
              </Button>
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center flex-1 flex flex-col items-center justify-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-base font-medium mb-2 text-foreground">Upload Images</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Drag and drop or click to upload
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => document.getElementById(`${formState.postType}-images`)?.click()}
              disabled={formState.uploadingImages}
              className="bg-secondary text-secondary-foreground hover:bg-accent"
            >
              {formState.uploadingImages ? 'Uploading...' : 'Select Files'}
            </Button>
          </div>
        )}
        
        <input
          id={`${formState.postType}-images`}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          disabled={formState.uploadingImages}
        />
        
        {formState.postType === 'promotion' && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-foreground">Promotional Video (Optional)</h4>
            {formState.uploadedVideo ? (
              <div className="relative group p-3 border rounded-md border-border">
                <p className="text-sm text-foreground truncate">{formState.uploadedVideo.split('/').pop()}</p>
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => setFormState(prev => ({ ...prev, uploadedVideo: null }))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('promotion-video')?.click()}
                disabled={formState.uploadingImages}
                className="w-full text-sm"
              >
                {formState.uploadingImages ? 'Uploading...' : 'Select Video'}
              </Button>
            )}
            <input
              id="promotion-video"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files && handleVideoUpload(e.target.files[0])}
              disabled={formState.uploadingImages}
            />
          </div>
        )}
        
        {formState.uploadingImages && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Uploading...</p>
            <Progress value={65} className="h-1 bg-accent" />
          </div>
        )}
      </div>
    );
  };

  const renderPostTypeForm = () => {
    switch (formState.postType) {
      case 'resource':
        return renderResourceForm();
      case 'event':
        return renderEventForm();
      case 'promotion':
        return renderPromotionForm();
      case 'update':
        return renderUpdateForm();
      default:
        return null;
    }
  };

  const renderResourceForm = () => {
    switch (formState.currentStep) {
      case 1:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Type</label>
              <RadioGroup
                value={resourceForm.type}
                onValueChange={(value) => setResourceForm({ ...resourceForm, type: value as 'offer' | 'need' })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offer" id="offer" />
                  <label htmlFor="offer" className="cursor-pointer text-foreground">I want to offer resources</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="need" id="need" />
                  <label htmlFor="need" className="cursor-pointer text-foreground">I need resources</label>
                </div>
              </RadioGroup>
              {formState.errors.type && <p className="text-sm text-destructive mt-1">{formState.errors.type}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Category</label>
              <Select
                value={resourceForm.category}
                onValueChange={(value) => setResourceForm({ ...resourceForm, category: value as any })}
              >
                <SelectTrigger className="border-input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="studybooks">Study Books</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formState.errors.category && <p className="text-sm text-destructive mt-1">{formState.errors.category}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Title</label>
              <Input
                placeholder="Enter a brief title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-destructive mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
              <Textarea
                placeholder="Describe your resource request or offer in detail"
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-destructive mt-1">{formState.errors.description}</p>}
            </div>
          </>
        );
      case 2:
        return (
          <>
            {resourceForm.type === 'need' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Urgency Level</label>
                <Select
                  value={resourceForm.urgency}
                  onValueChange={(value) => setResourceForm({ ...resourceForm, urgency: value as any })}
                >
                  <SelectTrigger className="border-input">
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high" className="text-urgent-text-light dark:text-urgent-text-dark">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                {formState.errors.urgency && <p className="text-sm text-destructive mt-1">{formState.errors.urgency}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Duration (How long this post will be active)</label>
              <Input
                placeholder="e.g., 7 days, until April 30th"
                value={resourceForm.duration}
                onChange={(e) => setResourceForm({ ...resourceForm, duration: e.target.value })}
              />
              {formState.errors.duration && <p className="text-sm text-destructive mt-1">{formState.errors.duration}</p>}
            </div>

            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium text-foreground">Use Profile Location</label>
                <p className="text-sm text-muted-foreground">
                  Toggle to use your profile location or select a custom location
                </p>
              </div>
              <Switch
                checked={resourceForm.useProfileLocation}
                onCheckedChange={(checked) => setResourceForm({ ...resourceForm, useProfileLocation: checked })}
              />
            </div>

            {!resourceForm.useProfileLocation && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select Location</label>
                
                {/* Address Search Input */}
                <div className="mb-3 space-y-2">
                  <Input
                    placeholder="Search for address (e.g., Times Square, New York)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleAddressSearch(target.value, 'resource');
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder*="Search for address"]') as HTMLInputElement;
                        if (input?.value) {
                          handleAddressSearch(input.value, 'resource');
                        }
                      }}
                    >
                      Search Address
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetCurrentLocation('resource')}
                    >
                      📍 Use Current Location
                    </Button>
                  </div>
                </div>

                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <GoogleMapsViewer
                    center={resourceForm.location ? 
                      { lat: resourceForm.location.latitude, lng: resourceForm.location.longitude } : 
                      { lat: 22.5726, lng: 88.3639 }
                    }
                    zoom={13}
                    height="256px"
                    onMapClick={handleMapClick}
                    showCurrentLocation={true}
                    enableGeolocation={true}
                    showDirectionsButton={false}
                    markers={resourceForm.location ? [{
                      position: { lat: resourceForm.location.latitude, lng: resourceForm.location.longitude },
                      title: "Selected Location",
                      color: "#4CAF50",
                      draggable: true
                    }] : []}
                    onMarkerDrag={(position) => {
                      handleMapClick(position);
                    }}
                  />
                </div>
                {resourceForm.location && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Selected:</strong> {resourceForm.location.address || `${resourceForm.location.latitude.toFixed(6)}, ${resourceForm.location.longitude.toFixed(6)}`}
                    </p>
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
              </div>
            )}

            {resourceForm.useProfileLocation && userProfile?.address && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Your Profile Location</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {userProfile.address}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Visibility Radius (km)</label>
              <Input
                type="number"
                placeholder="Enter visibility radius in km"
                value={resourceForm.visibilityRadius}
                onChange={(e) => setResourceForm({ ...resourceForm, visibilityRadius: e.target.value })}
              />
              {formState.errors.visibilityRadius && <p className="text-sm text-destructive mt-1">{formState.errors.visibilityRadius}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Add images to help others understand your resource better. You can add multiple images.
            </p>
            
            {formState.postType === 'event' && formState.uploadedImages.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select a Banner Image</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Click on an image on the left to set it as the event banner
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={formState.isSubmitting}
                className="nl-button-primary bg-button-blue hover:bg-button-blue-hover"
              >
                {formState.isSubmitting ? 'Submitting...' : 'Create Post'}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderEventForm = () => {
    switch (formState.currentStep) {
      case 1:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Event Title</label>
              <Input
                placeholder="Enter event title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-destructive mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Event Description</label>
              <Textarea
                placeholder="Describe the event in detail"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-destructive mt-1">{formState.errors.description}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Event Type</label>
              <Select
                value={eventForm.eventType}
                onValueChange={(value) => setEventForm({ ...eventForm, eventType: value as any })}
              >
                <SelectTrigger className="border-input">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formState.errors.eventType && <p className="text-sm text-destructive mt-1">{formState.errors.eventType}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Organizer Details</label>
              <Card className="mt-2 border-border">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1 text-foreground">Name</label>
                    <Input
                      placeholder="Organizer name"
                      value={eventForm.organizerDetails.name}
                      onChange={(e) => setEventForm({
                        ...eventForm,
                        organizerDetails: {
                          ...eventForm.organizerDetails,
                          name: e.target.value
                        }
                      })}
                    />
                    {formState.errors['organizerDetails.name'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['organizerDetails.name']}</p>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1 text-foreground">Contact</label>
                    <Input
                      placeholder="Contact number"
                      value={eventForm.organizerDetails.contact}
                      onChange={(e) => setEventForm({
                        ...eventForm,
                        organizerDetails: {
                          ...eventForm.organizerDetails,
                          contact: e.target.value
                        }
                      })}
                    />
                    {formState.errors['organizerDetails.contact'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['organizerDetails.contact']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
                    <Input
                      placeholder="Email address"
                      value={eventForm.organizerDetails.email}
                      onChange={(e) => setEventForm({
                        ...eventForm,
                        organizerDetails: {
                          ...eventForm.organizerDetails,
                          email: e.target.value
                        }
                      })}
                    />
                    {formState.errors['organizerDetails.email'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['organizerDetails.email']}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium text-foreground">Use Profile Location</label>
                <p className="text-sm text-muted-foreground">
                  Toggle to use your profile location or select a custom location
                </p>
              </div>
              <Switch
                checked={eventForm.useProfileLocation}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, useProfileLocation: checked })}
              />
            </div>

            {!eventForm.useProfileLocation && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select Event Location</label>
                
                {/* Address Search Input */}
                <div className="mb-3 space-y-2">
                  <Input
                    placeholder="Search for event venue or address"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleAddressSearch(target.value, 'event');
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const inputs = document.querySelectorAll('input[placeholder*="Search for event venue"]');
                        const input = inputs[inputs.length - 1] as HTMLInputElement;
                        if (input?.value) {
                          handleAddressSearch(input.value, 'event');
                        }
                      }}
                    >
                      Search Address
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetCurrentLocation('event')}
                    >
                      📍 Use Current Location
                    </Button>
                  </div>
                </div>

                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <GoogleMapsViewer
                    center={eventForm.location ? 
                      { lat: eventForm.location.latitude, lng: eventForm.location.longitude } : 
                      { lat: 22.5726, lng: 88.3639 }
                    }
                    zoom={13}
                    height="256px"
                    onMapClick={handleMapClick}
                    showCurrentLocation={true}
                    enableGeolocation={true}
                    showDirectionsButton={false}
                    markers={eventForm.location ? [{
                      position: { lat: eventForm.location.latitude, lng: eventForm.location.longitude },
                      title: "Event Location",
                      color: "#2196F3",
                      draggable: true
                    }] : []}
                    onMarkerDrag={(position) => {
                      handleMapClick(position);
                    }}
                  />
                </div>
                {eventForm.location && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Event Venue:</strong> {eventForm.location.address || `${eventForm.location.latitude.toFixed(6)}, ${eventForm.location.longitude.toFixed(6)}`}
                    </p>
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
              </div>
            )}

            {eventForm.useProfileLocation && userProfile?.address && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Your Profile Location</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {userProfile.address}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Event Timing</label>
              <Card className="mt-2 border-border">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1 text-foreground">Date</label>
                    <Input
                      type="date"
                      value={eventForm.timingInfo.date}
                      onChange={(e) => setEventForm({
                        ...eventForm,
                        timingInfo: {
                          ...eventForm.timingInfo,
                          date: e.target.value
                        }
                      })}
                    />
                    {formState.errors['timingInfo.date'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['timingInfo.date']}</p>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1 text-foreground">Time</label>
                    <Input
                      type="time"
                      value={eventForm.timingInfo.time}
                      onChange={(e) => setEventForm({
                        ...eventForm,
                        timingInfo: {
                          ...eventForm.timingInfo,
                          time: e.target.value
                        }
                      })}
                    />
                    {formState.errors['timingInfo.time'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['timingInfo.time']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Duration</label>
                    <Input
                      placeholder="e.g., 2 hours, All day"
                      value={eventForm.timingInfo.duration}
                      onChange={(e) => setEventForm({
                        ...eventForm,
                        timingInfo: {
                          ...eventForm.timingInfo,
                          duration: e.target.value
                        }
                      })}
                    />
                    {formState.errors['timingInfo.duration'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['timingInfo.duration']}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium text-foreground">Registration Required</label>
                <p className="text-sm text-muted-foreground">
                  Toggle if attendees need to register for the event
                </p>
              </div>
              <Switch
                checked={eventForm.isRegistrationRequired}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, isRegistrationRequired: checked })}
              />
            </div>

            {eventForm.isRegistrationRequired && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Registration Link</label>
                <Input
                  placeholder="Registration URL"
                  value={eventForm.registrationLink || ''}
                  onChange={(e) => setEventForm({ ...eventForm, registrationLink: e.target.value })}
                />
                {formState.errors.registrationLink && (
                  <p className="text-sm text-destructive mt-1">{formState.errors.registrationLink}</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Visibility Radius (km)</label>
              <Input
                type="number"
                placeholder="Enter visibility radius in km"
                value={eventForm.visibilityRadius}
                onChange={(e) => setEventForm({ ...eventForm, visibilityRadius: e.target.value })}
              />
              {formState.errors.visibilityRadius && (
                <p className="text-sm text-destructive mt-1">{formState.errors.visibilityRadius}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Post Duration (How long this event post will be active)</label>
              <Input
                placeholder="e.g., Until event date, 30 days"
                value={eventForm.duration}
                onChange={(e) => setEventForm({ ...eventForm, duration: e.target.value })}
              />
              {formState.errors.duration && <p className="text-sm text-destructive mt-1">{formState.errors.duration}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Add images to help others understand your event better. You can add multiple images.
            </p>
            
            {formState.postType === 'event' && formState.uploadedImages.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select a Banner Image</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Click on an image on the left to set it as the event banner
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={formState.isSubmitting}
                className="nl-button-primary bg-button-blue hover:bg-button-blue-hover"
              >
                {formState.isSubmitting ? 'Submitting...' : 'Create Post'}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPromotionForm = () => {
    switch (formState.currentStep) {
      case 1:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Promotion Title</label>
              <Input
                placeholder="Enter promotion title"
                value={promotionForm.title}
                onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-destructive mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Promotion Description</label>
              <Textarea
                placeholder="Describe what you're promoting"
                value={promotionForm.description}
                onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-destructive mt-1">{formState.errors.description}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Contact Information</label>
              <Card className="mt-2 border-border">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1 text-foreground">Name</label>
                    <Input
                      placeholder="Contact name"
                      value={promotionForm.contactInfo.name}
                      onChange={(e) => setPromotionForm({
                        ...promotionForm,
                        contactInfo: {
                          ...promotionForm.contactInfo,
                          name: e.target.value
                        }
                      })}
                    />
                    {formState.errors['contactInfo.name'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['contactInfo.name']}</p>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1 text-foreground">Contact Number</label>
                    <Input
                      placeholder="Phone number"
                      value={promotionForm.contactInfo.contact}
                      onChange={(e) => setPromotionForm({
                        ...promotionForm,
                        contactInfo: {
                          ...promotionForm.contactInfo,
                          contact: e.target.value
                        }
                      })}
                    />
                    {formState.errors['contactInfo.contact'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['contactInfo.contact']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
                    <Input
                      placeholder="Email address"
                      value={promotionForm.contactInfo.email}
                      onChange={(e) => setPromotionForm({
                        ...promotionForm,
                        contactInfo: {
                          ...promotionForm.contactInfo,
                          email: e.target.value
                        }
                      })}
                    />
                    {formState.errors['contactInfo.email'] && (
                      <p className="text-sm text-destructive mt-1">{formState.errors['contactInfo.email']}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium text-foreground">Use Profile Location</label>
                <p className="text-sm text-muted-foreground">
                  Toggle to use your profile location or select a custom location
                </p>
              </div>
              <Switch
                checked={promotionForm.useProfileLocation}
                onCheckedChange={(checked) => setPromotionForm({ ...promotionForm, useProfileLocation: checked })}
              />
            </div>

            {!promotionForm.useProfileLocation && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select Business/Promotion Location</label>
                
                {/* Address Search Input */}
                <div className="mb-3 space-y-2">
                  <Input
                    placeholder="Search for business address or location"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleAddressSearch(target.value, 'promotion');
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const inputs = document.querySelectorAll('input[placeholder*="Search for business"]');
                        const input = inputs[inputs.length - 1] as HTMLInputElement;
                        if (input?.value) {
                          handleAddressSearch(input.value, 'promotion');
                        }
                      }}
                    >
                      Search Address
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetCurrentLocation('promotion')}
                    >
                      📍 Use Current Location
                    </Button>
                  </div>
                </div>

                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <GoogleMapsViewer
                    center={promotionForm.location ? 
                      { lat: promotionForm.location.latitude, lng: promotionForm.location.longitude } : 
                      { lat: 22.5726, lng: 88.3639 }
                    }
                    zoom={13}
                    height="256px"
                    onMapClick={handleMapClick}
                    showCurrentLocation={true}
                    enableGeolocation={true}
                    showDirectionsButton={false}
                    markers={promotionForm.location ? [{
                      position: { lat: promotionForm.location.latitude, lng: promotionForm.location.longitude },
                      title: "Business Location",
                      color: "#FF9800",
                      draggable: true
                    }] : []}
                    onMarkerDrag={(position) => {
                      handleMapClick(position);
                    }}
                  />
                </div>
                {promotionForm.location && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Business Location:</strong> {promotionForm.location.address || `${promotionForm.location.latitude.toFixed(6)}, ${promotionForm.location.longitude.toFixed(6)}`}
                    </p>
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
              </div>
            )}

            {promotionForm.useProfileLocation && userProfile?.address && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Your Profile Location</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {userProfile.address}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Visibility Radius (km)</label>
              <Input
                type="number"
                placeholder="Enter visibility radius in km"
                value={promotionForm.visibilityRadius}
                onChange={(e) => setPromotionForm({ ...promotionForm, visibilityRadius: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Promotions with visibility under 5km are free. Larger radius may incur charges.
              </p>
              {formState.errors.visibilityRadius && (
                <p className="text-sm text-destructive mt-1">{formState.errors.visibilityRadius}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Promotion Duration</label>
              <Input
                placeholder="e.g., 7 days, 30 days"
                value={promotionForm.duration}
                onChange={(e) => setPromotionForm({ ...promotionForm, duration: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Longer duration promotions may incur additional charges.
              </p>
              {formState.errors.duration && <p className="text-sm text-destructive mt-1">{formState.errors.duration}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Add images to help others understand your promotion better. You can add multiple images.
            </p>
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={formState.isSubmitting}
                className="nl-button-primary bg-button-blue hover:bg-button-blue-hover"
              >
                {formState.isSubmitting ? 'Submitting...' : 'Create Post'}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderUpdateForm = () => {
    switch (formState.currentStep) {
      case 1:
        return (
          <>
            {parentUpdateId && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {threadDepth > 0 
                    ? `This is a reply to another update (Thread depth: ${threadDepth})` 
                    : "You're creating a new update"}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Update Title</label>
              <Input
                placeholder={parentUpdateId ? "Enter reply title" : "Enter update title"}
                value={updateForm.title}
                onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-destructive mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Update Description</label>
              <Textarea
                placeholder="Describe your update in detail"
                value={updateForm.description}
                onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-destructive mt-1">{formState.errors.description}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Update Date</label>
              <Input
                type="date"
                value={updateForm.date}
                onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })}
              />
              {formState.errors.date && <p className="text-sm text-destructive mt-1">{formState.errors.date}</p>}
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium text-foreground">Use Profile Location</label>
                <p className="text-sm text-muted-foreground">
                  Toggle to use your profile location or select a custom location
                </p>
              </div>
              <Switch
                checked={updateForm.useProfileLocation}
                onCheckedChange={(checked) => setUpdateForm({ ...updateForm, useProfileLocation: checked })}
              />
            </div>

            {!updateForm.useProfileLocation && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select Update Location</label>
                
                {/* Address Search Input */}
                <div className="mb-3 space-y-2">
                  <Input
                    placeholder="Search for location related to your update"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleAddressSearch(target.value, 'update');
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const inputs = document.querySelectorAll('input[placeholder*="Search for location related"]');
                        const input = inputs[inputs.length - 1] as HTMLInputElement;
                        if (input?.value) {
                          handleAddressSearch(input.value, 'update');
                        }
                      }}
                    >
                      Search Address
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetCurrentLocation('update')}
                    >
                      📍 Use Current Location
                    </Button>
                  </div>
                </div>

                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <GoogleMapsViewer
                    center={updateForm.location ? 
                      { lat: updateForm.location.latitude, lng: updateForm.location.longitude } : 
                      { lat: 22.5726, lng: 88.3639 }
                    }
                    zoom={13}
                    height="256px"
                    onMapClick={handleMapClick}
                    showCurrentLocation={true}
                    enableGeolocation={true}
                    showDirectionsButton={false}
                    markers={updateForm.location ? [{
                      position: { lat: updateForm.location.latitude, lng: updateForm.location.longitude },
                      title: "Update Location",
                      color: "#9C27B0",
                      draggable: true
                    }] : []}
                    onMarkerDrag={(position) => {
                      handleMapClick(position);
                    }}
                  />
                </div>
                {updateForm.location && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Update Location:</strong> {updateForm.location.address || `${updateForm.location.latitude.toFixed(6)}, ${updateForm.location.longitude.toFixed(6)}`}
                    </p>
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
              </div>
            )}

            {updateForm.useProfileLocation && userProfile?.address && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Your Profile Location</label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {userProfile.address}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Visibility Radius (km)</label>
              <Input
                type="number"
                placeholder="Enter visibility radius in km"
                value={updateForm.visibilityRadius}
                onChange={(e) => setUpdateForm({ ...updateForm, visibilityRadius: e.target.value })}
              />
              {formState.errors.visibilityRadius && (
                <p className="text-sm text-destructive mt-1">{formState.errors.visibilityRadius}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Update Duration (How long this update will be active)</label>
              <Input
                placeholder="e.g., 7 days, 30 days"
                value={updateForm.duration}
                onChange={(e) => setUpdateForm({ ...updateForm, duration: e.target.value })}
              />
              {formState.errors.duration && <p className="text-sm text-destructive mt-1">{formState.errors.duration}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Add images to help others understand your update better. You can add multiple images.
            </p>
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={formState.isSubmitting}
                className="nl-button-primary bg-button-blue hover:bg-button-blue-hover"
              >
                {formState.isSubmitting ? 'Submitting...' : 'Create Post'}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Success animation component
  const SuccessAnimation = () => {
    return (
      <Card className="w-full border-border">
        <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
          <div className="success-animation">
            <div className="success-circle">
              <Check className="success-check" strokeWidth={3} />
            </div>
          </div>
          <h2 className="text-xl font-medium mt-6 text-foreground transition-opacity animate-fadeIn">
            Post Created Successfully!
          </h2>
          <p className="text-muted-foreground mt-2 text-center animate-fadeIn">
            Your post has been published and will be visible to your community
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-100 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {!formState.postType ? (
          <Card className="w-full border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Create a New Post</CardTitle>
                <CardDescription className="text-muted-foreground">Select the type of post you want to create</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => setFormState(prev => ({ ...prev, postType: 'resource' }))}
                  className="h-24 flex flex-col gap-2 bg-background border-border hover:bg-accent text-foreground"
                  variant="outline"
                >
                  <span className="text-lg font-medium">Resource</span>
                  <span className="text-sm text-muted-foreground">Offer or request resources</span>
                </Button>
                <Button
                  onClick={() => setFormState(prev => ({ ...prev, postType: 'event' }))}
                  className="h-24 flex flex-col gap-2 bg-background border-border hover:bg-accent text-foreground"
                  variant="outline"
                >
                  <span className="text-lg font-medium">Event</span>
                  <span className="text-sm text-muted-foreground">Create a community event</span>
                </Button>
                <Button
                  onClick={() => setFormState(prev => ({ ...prev, postType: 'promotion' }))}
                  className="h-24 flex flex-col gap-2 bg-background border-border hover:bg-accent text-foreground"
                  variant="outline"
                >
                  <span className="text-lg font-medium">Promotion</span>
                  <span className="text-sm text-muted-foreground">Promote your business or service</span>
                </Button>
                <Button
                  onClick={() => setFormState(prev => ({ ...prev, postType: 'update' }))}
                  className="h-24 flex flex-col gap-2 bg-background border-border hover:bg-accent text-foreground"
                  variant="outline"
                >
                  <span className="text-lg font-medium">Update</span>
                  <span className="text-sm text-muted-foreground">Share news or updates</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : formState.isSuccess ? (
          <SuccessAnimation />
        ) : (
          <Card className="border-border bg-white dark:bg-gray-800 flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="capitalize text-foreground">
                  {formState.postType} Post
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create a new {formState.postType} post to share with your community
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <div>
              <Progress
                value={(formState.currentStep / formState.totalSteps) * 100}
                className="h-1 bg-accent"
              />
            </div>

            <CardContent className="pt-6">
              {formState.error && (
                <div className="bg-emergency-bg-light dark:bg-emergency-bg-dark p-4 rounded-md mb-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-emergency-text-light dark:text-emergency-text-dark mt-0.5" />
                  <p className="text-emergency-text-light dark:text-emergency-text-dark text-sm">{formState.error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  {renderImageUploadSection()}
                </div>
                
                <div className="md:col-span-2">
                  {renderPostTypeForm()}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={formState.currentStep === 1}
                className="border-border text-foreground hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {formState.currentStep < formState.totalSteps ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="nl-button-primary bg-button-blue hover:bg-button-blue-hover"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={formState.isSubmitting}
                  className="nl-button-primary bg-button-blue hover:bg-button-blue-hover"
                >
                  {formState.isSubmitting ? 'Submitting...' : 'Create Post'}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .success-animation {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 1rem;
        }
        
        .success-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: #4CAF50;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: scale(0);
          animation: scaleIn 0.5s ease-out forwards, pulse 2s infinite 0.5s;
        }
        
        .success-check {
          stroke: white;
          stroke-width: 3;
          width: 50px;
          height: 50px;
          opacity: 0;
          transform: scale(0.5);
          animation: checkIn 0.5s ease-out 0.3s forwards;
        }
        
        @keyframes scaleIn {
          0% { transform: scale(0); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes checkIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}} />
    </div>
  );
};

export default NewPostForm;