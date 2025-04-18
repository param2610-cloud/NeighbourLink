import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { uploadFileToS3 } from '@/utils/aws/aws';

// Components
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

// Icons
import {
  MapPin,
  Calendar,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react';

// Firebase
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

// Resource form state
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

// Event form state
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

// Promotion form state
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

// Update form state
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

const NewPostForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentUser, setUser] = useState<any>(null);
  const { ref: mapRef, data: mapData } = useOlaMaps();

  const [formState, setFormState] = useState<PostFormState>({
    postType: null,
    currentStep: 1,
    totalSteps: 3,
    isSubmitting: false,
    isSuccess: false,
    error: null,
    uploadingImages: false,
    uploadedImages: [],
    uploadedVideo: null,
    errors: {},
  });

  const [resourceForm, setResourceForm] = useState<ResourceFormData>({
    type: 'offer',
    category: 'food',
    title: '',
    description: '',
    urgency: 'medium',
    duration: '',
    useProfileLocation: true,
    visibilityRadius: '5',
  });

  const [eventForm, setEventForm] = useState<EventFormData>({
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
  });

  const [promotionForm, setPromotionForm] = useState<PromotionFormData>({
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
  });

  const [updateForm, setUpdateForm] = useState<UpdateFormData>({
    title: '',
    description: '',
    useProfileLocation: true,
    date: '',
    visibilityRadius: '5',
    duration: '',
  });

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  // Initialize form based on URL params
  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['resource', 'event', 'promotion', 'update'].includes(type)) {
      setFormState(prev => ({
        ...prev,
        postType: type as PostFormState['postType'],
      }));
    }
  }, [searchParams]);

  // Update form location when map location changes
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
      // Prepare common data for all post types
      const commonData = {
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        responders: [],
        images: formState.uploadedImages,
      };

      // Add post type specific data
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

      // Add collection reference based on post type
      const collectionRef = collection(db, `${formState.postType}s`);

      // Add document to Firestore
      await addDoc(collectionRef, postData);

      setFormState(prev => ({ ...prev, isSuccess: true }));

      // Navigate to appropriate page after successful submission
      setTimeout(() => {
        navigate('/');
      }, 2000);
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

  if (!formState.postType) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Create a New Post</CardTitle>
          <CardDescription>Select the type of post you want to create</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={() => setFormState(prev => ({ ...prev, postType: 'resource' }))}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <span className="text-lg font-medium">Resource</span>
              <span className="text-sm text-muted-foreground">Offer or request resources</span>
            </Button>
            <Button
              onClick={() => setFormState(prev => ({ ...prev, postType: 'event' }))}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <span className="text-lg font-medium">Event</span>
              <span className="text-sm text-muted-foreground">Create a community event</span>
            </Button>
            <Button
              onClick={() => setFormState(prev => ({ ...prev, postType: 'promotion' }))}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <span className="text-lg font-medium">Promotion</span>
              <span className="text-sm text-muted-foreground">Promote your business or service</span>
            </Button>
            <Button
              onClick={() => setFormState(prev => ({ ...prev, postType: 'update' }))}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <span className="text-lg font-medium">Update</span>
              <span className="text-sm text-muted-foreground">Share news or updates</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (formState.isSuccess) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="w-6 h-6" />
            Post Created Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your post has been created and will be visible to others.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </CardFooter>
      </Card>
    );
  }

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
              <label className="block text-sm font-medium mb-2">Type</label>
              <RadioGroup
                value={resourceForm.type}
                onValueChange={(value) => setResourceForm({ ...resourceForm, type: value as 'offer' | 'need' })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offer" id="offer" />
                  <label htmlFor="offer" className="cursor-pointer">I want to offer resources</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="need" id="need" />
                  <label htmlFor="need" className="cursor-pointer">I need resources</label>
                </div>
              </RadioGroup>
              {formState.errors.type && <p className="text-sm text-red-500 mt-1">{formState.errors.type}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select
                value={resourceForm.category}
                onValueChange={(value) => setResourceForm({ ...resourceForm, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formState.errors.category && <p className="text-sm text-red-500 mt-1">{formState.errors.category}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="Enter a brief title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-red-500 mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                placeholder="Describe your resource request or offer in detail"
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-red-500 mt-1">{formState.errors.description}</p>}
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Urgency Level</label>
              <Select
                value={resourceForm.urgency}
                onValueChange={(value) => setResourceForm({ ...resourceForm, urgency: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              {formState.errors.urgency && <p className="text-sm text-red-500 mt-1">{formState.errors.urgency}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Duration (How long this post will be active)</label>
              <Input
                placeholder="e.g., 7 days, until April 30th"
                value={resourceForm.duration}
                onChange={(e) => setResourceForm({ ...resourceForm, duration: e.target.value })}
              />
              {formState.errors.duration && <p className="text-sm text-red-500 mt-1">{formState.errors.duration}</p>}
            </div>

            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium">Use Profile Location</label>
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
                <label className="block text-sm font-medium mb-2">Select Location</label>
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
                {formState.errors.location && <p className="text-sm text-red-500 mt-1">{formState.errors.location}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Visibility Radius (km)</label>
              <Input
                type="number"
                placeholder="Enter visibility radius in km"
                value={resourceForm.visibilityRadius}
                onChange={(e) => setResourceForm({ ...resourceForm, visibilityRadius: e.target.value })}
              />
              {formState.errors.visibilityRadius && <p className="text-sm text-red-500 mt-1">{formState.errors.visibilityRadius}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Photos</label>
              <div className="mt-2">
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('resource-images')?.click()}
                      disabled={formState.uploadingImages}
                    >
                      {formState.uploadingImages ? 'Uploading...' : 'Select Files'}
                    </Button>
                    <input
                      id="resource-images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={formState.uploadingImages}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag and drop or click to upload
                  </p>
                </div>
              </div>

              {formState.uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Images</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {formState.uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <ImageDisplay objectKey={image} className="w-full h-24 object-cover rounded-md" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={() => {
                            const newImages = [...formState.uploadedImages];
                            newImages.splice(index, 1);
                            setFormState(prev => ({ ...prev, uploadedImages: newImages }));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
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
              <label className="block text-sm font-medium mb-2">Event Title</label>
              <Input
                placeholder="Enter event title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-red-500 mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Event Description</label>
              <Textarea
                placeholder="Describe the event in detail"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-red-500 mt-1">{formState.errors.description}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Event Type</label>
              <Select
                value={eventForm.eventType}
                onValueChange={(value) => setEventForm({ ...eventForm, eventType: value as any })}
              >
                <SelectTrigger>
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
              {formState.errors.eventType && <p className="text-sm text-red-500 mt-1">{formState.errors.eventType}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Organizer Details</label>
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Name</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['organizerDetails.name']}</p>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Contact</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['organizerDetails.contact']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['organizerDetails.email']}</p>
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
                <label className="block text-sm font-medium">Use Profile Location</label>
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
                <label className="block text-sm font-medium mb-2">Select Location</label>
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
                {formState.errors.location && <p className="text-sm text-red-500 mt-1">{formState.errors.location}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Event Timing</label>
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Date</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['timingInfo.date']}</p>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Time</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['timingInfo.time']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['timingInfo.duration']}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium">Registration Required</label>
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
                <label className="block text-sm font-medium mb-2">Registration Link</label>
                <Input
                  placeholder="Registration URL"
                  value={eventForm.registrationLink || ''}
                  onChange={(e) => setEventForm({ ...eventForm, registrationLink: e.target.value })}
                />
                {formState.errors.registrationLink && (
                  <p className="text-sm text-red-500 mt-1">{formState.errors.registrationLink}</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Visibility Radius (km)</label>
              <Input
                type="number"
                placeholder="Enter visibility radius in km"
                value={eventForm.visibilityRadius}
                onChange={(e) => setEventForm({ ...eventForm, visibilityRadius: e.target.value })}
              />
              {formState.errors.visibilityRadius && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.visibilityRadius}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Post Duration (How long this event post will be active)</label>
              <Input
                placeholder="e.g., Until event date, 30 days"
                value={eventForm.duration}
                onChange={(e) => setEventForm({ ...eventForm, duration: e.target.value })}
              />
              {formState.errors.duration && <p className="text-sm text-red-500 mt-1">{formState.errors.duration}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Event Images</label>
              <div className="mt-2">
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('event-images')?.click()}
                      disabled={formState.uploadingImages}
                    >
                      {formState.uploadingImages ? 'Uploading...' : 'Select Files'}
                    </Button>
                    <input
                      id="event-images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={formState.uploadingImages}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag and drop or click to upload
                  </p>
                </div>
              </div>

              {formState.uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Images</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select an image to use as the event banner
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {formState.uploadedImages.map((image, index) => (
                      <div
                        key={index}
                        className={`relative group cursor-pointer ${eventForm.bannerImageIndex === index
                            ? 'ring-2 ring-primary ring-offset-2'
                            : ''
                          }`}
                        onClick={() => setEventForm({ ...eventForm, bannerImageIndex: index })}
                      >
                        <ImageDisplay objectKey={image} className="w-full h-24 object-cover rounded-md" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newImages = [...formState.uploadedImages];
                            newImages.splice(index, 1);
                            setFormState(prev => ({ ...prev, uploadedImages: newImages }));

                            // Reset banner image if it was deleted
                            if (eventForm.bannerImageIndex === index) {
                              setEventForm({ ...eventForm, bannerImageIndex: undefined });
                            }
                          }}
                        >
                          ×
                        </button>
                        {eventForm.bannerImageIndex === index && (
                          <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                            Banner
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
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
              <label className="block text-sm font-medium mb-2">Promotion Title</label>
              <Input
                placeholder="Enter promotion title"
                value={promotionForm.title}
                onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-red-500 mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Promotion Description</label>
              <Textarea
                placeholder="Describe what you're promoting"
                value={promotionForm.description}
                onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-red-500 mt-1">{formState.errors.description}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Contact Information</label>
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Name</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['contactInfo.name']}</p>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Contact Number</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['contactInfo.contact']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
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
                      <p className="text-sm text-red-500 mt-1">{formState.errors['contactInfo.email']}</p>
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
                <label className="block text-sm font-medium">Use Profile Location</label>
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
                <label className="block text-sm font-medium mb-2">Select Location</label>
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
                {formState.errors.location && <p className="text-sm text-red-500 mt-1">{formState.errors.location}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Visibility Radius (km)</label>
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
                <p className="text-sm text-red-500 mt-1">{formState.errors.visibilityRadius}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Promotion Duration</label>
              <Input
                placeholder="e.g., 7 days, 30 days"
                value={promotionForm.duration}
                onChange={(e) => setPromotionForm({ ...promotionForm, duration: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Longer duration promotions may incur additional charges.
              </p>
              {formState.errors.duration && <p className="text-sm text-red-500 mt-1">{formState.errors.duration}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Promotion Images</label>
              <div className="mt-2">
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('promotion-images')?.click()}
                      disabled={formState.uploadingImages}
                    >
                      {formState.uploadingImages ? 'Uploading...' : 'Select Files'}
                    </Button>
                    <input
                      id="promotion-images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={formState.uploadingImages}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag and drop or click to upload
                  </p>
                </div>
              </div>

              {formState.uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Images</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {formState.uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <ImageDisplay objectKey={image} className="w-full h-24 object-cover rounded-md" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={() => {
                            const newImages = [...formState.uploadedImages];
                            newImages.splice(index, 1);
                            setFormState(prev => ({ ...prev, uploadedImages: newImages }));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Promotional Video (Optional)</label>
              <div className="mt-2">
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('promotion-video')?.click()}
                      disabled={formState.uploadingImages}
                    >
                      {formState.uploadingImages ? 'Uploading...' : 'Select Video'}
                    </Button>
                    <input
                      id="promotion-video"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => e.target.files && handleVideoUpload(e.target.files[0])}
                      disabled={formState.uploadingImages}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload a single video file (max 50MB)
                  </p>
                </div>
              </div>

              {formState.uploadedVideo && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Video</h4>
                  <div className="relative group p-4 border rounded-md">
                    <p className="text-sm">{formState.uploadedVideo.split('/').pop()}</p>
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => {
                        setFormState(prev => ({ ...prev, uploadedVideo: null }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
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
              <label className="block text-sm font-medium mb-2">Update Title</label>
              <Input
                placeholder="Enter update title"
                value={updateForm.title}
                onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
              />
              {formState.errors.title && <p className="text-sm text-red-500 mt-1">{formState.errors.title}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Update Description</label>
              <Textarea
                placeholder="Describe your update in detail"
                value={updateForm.description}
                onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                className="min-h-32"
              />
              {formState.errors.description && <p className="text-sm text-red-500 mt-1">{formState.errors.description}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Update Date</label>
              <Input
                type="date"
                value={updateForm.date}
                onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })}
              />
              {formState.errors.date && <p className="text-sm text-red-500 mt-1">{formState.errors.date}</p>}
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex flex-row items-center justify-between mb-4">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium">Use Profile Location</label>
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
                <label className="block text-sm font-medium mb-2">Select Location</label>
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
                {formState.errors.location && <p className="text-sm text-red-500 mt-1">{formState.errors.location}</p>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Visibility Radius (km)</label>
              <Input
                type="number"
                placeholder="Enter visibility radius in km"
                value={updateForm.visibilityRadius}
                onChange={(e) => setUpdateForm({ ...updateForm, visibilityRadius: e.target.value })}
              />
              {formState.errors.visibilityRadius && (
                <p className="text-sm text-red-500 mt-1">{formState.errors.visibilityRadius}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Update Duration (How long this update will be active)</label>
              <Input
                placeholder="e.g., 7 days, 30 days"
                value={updateForm.duration}
                onChange={(e) => setUpdateForm({ ...updateForm, duration: e.target.value })}
              />
              {formState.errors.duration && <p className="text-sm text-red-500 mt-1">{formState.errors.duration}</p>}
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Update Images</label>
              <div className="mt-2">
                <div className="border border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('update-images')?.click()}
                      disabled={formState.uploadingImages}
                    >
                      {formState.uploadingImages ? 'Uploading...' : 'Select Files'}
                    </Button>
                    <input
                      id="update-images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      disabled={formState.uploadingImages}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag and drop or click to upload
                  </p>
                </div>
              </div>

              {formState.uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Images</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {formState.uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <ImageDisplay objectKey={image} className="w-full h-24 object-cover rounded-md" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={() => {
                            const newImages = [...formState.uploadedImages];
                            newImages.splice(index, 1);
                            setFormState(prev => ({ ...prev, uploadedImages: newImages }));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">
            {formState.postType} Post
          </CardTitle>
          <CardDescription>
            Create a new {formState.postType} post to share with your community
          </CardDescription>
          <Progress
            value={(formState.currentStep / formState.totalSteps) * 100}
            className="h-1 mt-2"
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {formState.error && (
            <div className="bg-red-50 p-4 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-red-500 text-sm">{formState.error}</p>
            </div>
          )}

          {renderPostTypeForm()}
        </CardContent>

        <CardFooter className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={formState.currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {formState.currentStep < formState.totalSteps ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? 'Submitting...' : 'Create Post'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewPostForm;