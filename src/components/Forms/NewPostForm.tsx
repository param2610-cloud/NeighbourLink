import React, { useState, useEffect } from 'react';
import { uploadFileToS3 } from '@/utils/aws/aws';

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

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import MapContainer, { useOlaMaps } from '../MapContainer';
import { ImageDisplay } from '../AWS/UploadFile';
import { auth, db } from '@/firebase';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
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
}

interface NewPostFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialPostType?: 'resource' | 'event' | 'promotion' | 'update' | null;
  onSuccess?: () => void;
}

const NewPostForm: React.FC<NewPostFormProps> = ({ 
  isOpen = false, 
  onClose = () => {}, 
  initialPostType = null,
  onSuccess = () => {} 
}) => {
  const { ref: mapRef, data: mapData } = useOlaMaps();
  const [currentUser, setUser] = useState<any>(null);

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
  };

  const [resourceForm, setResourceForm] = useState<ResourceFormData>(initialResourceForm);
  const [eventForm, setEventForm] = useState<EventFormData>(initialEventForm);
  const [promotionForm, setPromotionForm] = useState<PromotionFormData>(initialPromotionForm);
  const [updateForm, setUpdateForm] = useState<UpdateFormData>(initialUpdateForm);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (initialPostType && ['resource', 'event', 'promotion', 'update'].includes(initialPostType)) {
      setFormState(prev => ({
        ...prev,
        postType: initialPostType,
      }));
    }
  }, [initialPostType]);

  useEffect(() => {
    if (mapData && mapData.selectedLocations.length > 0) {
      const selectedLocation = mapData.selectedLocations[0];
      const location = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.address,
      };

      switch (formState.postType) {
        case 'resource':
          setResourceForm(prev => ({ ...prev, location }));
          break;
        case 'event':
          setEventForm(prev => ({ ...prev, location }));
          break;
        case 'promotion':
          setPromotionForm(prev => ({ ...prev, location }));
          break;
        case 'update':
          setUpdateForm(prev => ({ ...prev, location }));
          break;
      }
    }
  }, [mapData, formState.postType]);

  const resetAllForms = () => {
    setFormState({...initialFormState, postType: null});
    setResourceForm(initialResourceForm);
    setEventForm(initialEventForm);
    setPromotionForm(initialPromotionForm);
    setUpdateForm(initialUpdateForm);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setFormState(prev => ({ ...prev, uploadingImages: true }));

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;
        return await uploadFileToS3(file, fileName);
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
      const videoUrl = await uploadFileToS3(file, fileName);

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
    
    // Reset form after 3.5 seconds
    setTimeout(() => {
      onSuccess();
      resetAllForms();
    }, 3500);
  };

  const handleSubmit = async () => {
    if (!currentUser || !formState.postType) {
      setFormState(prev => ({
        ...prev,
        error: "Authentication error. Please sign in again."
      }));
      return;
    }

    if (!validateCurrentStep()) {
      setFormState(prev => ({
        ...prev,
        error: "Please fix all errors before submitting."
      }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const commonData = {
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        responders: [],
        images: formState.uploadedImages,
      };

      let postData: Record<string, any> = { ...commonData };

      switch (formState.postType) {
        case 'resource':
          postData = { ...resourceForm, ...postData };
          break;
        case 'event':
          postData = { ...eventForm, ...postData };
          break;
        case 'promotion':
          postData = { ...promotionForm, ...postData, videoUrl: formState.uploadedVideo };
          break;
        case 'update':
          postData = { ...updateForm, ...postData };
          break;
      }

      const collectionRef = collection(db, `${formState.postType}s`);

      await addDoc(collectionRef, postData);

      handleSubmitSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormState(prev => ({
        ...prev,
        error: "Failed to submit form. Please try again."
      }));
    } finally {
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
                  <ImageDisplay objectKey={image} className="w-full aspect-square object-cover rounded-md" />
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
                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <MapContainer
                    ref={mapRef}
                    showCurrentLocation={true}
                    zoom={13}
                    isSelectable={true}
                    maximumSelection={1}
                    scrollWheelZoom={true}
                  />
                </div>
                {mapData?.selectedLocations && mapData?.selectedLocations?.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Selected: {mapData.selectedLocations[0].address}
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
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
                <label className="block text-sm font-medium mb-2 text-foreground">Select Location</label>
                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <MapContainer
                    ref={mapRef}
                    showCurrentLocation={true}
                    zoom={13}
                    isSelectable={true}
                    maximumSelection={1}
                    scrollWheelZoom={true}
                  />
                </div>
                {mapData?.selectedLocations && mapData?.selectedLocations?.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Selected: {mapData.selectedLocations[0].address}
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
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
                <label className="block text-sm font-medium mb-2 text-foreground">Select Location</label>
                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <MapContainer
                    ref={mapRef}
                    showCurrentLocation={true}
                    zoom={13}
                    isSelectable={true}
                    maximumSelection={1}
                    scrollWheelZoom={true}
                  />
                </div>
                {mapData?.selectedLocations && mapData?.selectedLocations?.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Selected: {mapData.selectedLocations[0].address}
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
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
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Update Title</label>
              <Input
                placeholder="Enter update title"
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
                <label className="block text-sm font-medium mb-2 text-foreground">Select Location</label>
                <div className="h-64 border rounded-md overflow-hidden mt-2">
                  <MapContainer
                    ref={mapRef}
                    showCurrentLocation={true}
                    zoom={13}
                    isSelectable={true}
                    maximumSelection={1}
                    scrollWheelZoom={true}
                  />
                </div>
                {mapData?.selectedLocations && mapData?.selectedLocations?.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Selected: {mapData.selectedLocations[0].address}
                  </div>
                )}
                {formState.errors.location && <p className="text-sm text-destructive mt-1">{formState.errors.location}</p>}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
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