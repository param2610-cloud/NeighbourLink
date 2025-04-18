import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from "../../firebase";
import { toast } from 'react-toastify';
import { uploadFileToS3 } from '@/utils/aws/aws';

// Import schemas and default values
import { PostType, getSchemaForType } from './SchemaDef';
import { getDefaultValues } from './DefaultValues';

// Import components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import FormProgress from './components/FormProgress';
import ResourceBasicInfo from './steps/ResourceBasicInfo';
import ResourceDetails from './steps/ResourceDetails';
import ResourceLocation from './steps/ResourceLocation';
import ResourceUpload from './steps/ResourceUpload';
import EventForm from './steps/EventForm';
import PromotionForm from './steps/PromotionForm';
import UpdateForm from './steps/UpdateForm';

const NewPostForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(4);
  const [postType, setPostType] = useState<PostType>('resource');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Extract query parameters and set post type
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const typeParam = queryParams.get('type') as PostType;
    if (typeParam && ['resource', 'event', 'promotion', 'update'].includes(typeParam)) {
      setPostType(typeParam);
      
      // Set total steps based on post type
      switch (typeParam) {
        case 'resource': setTotalSteps(4); break;
        case 'event': setTotalSteps(5); break;
        case 'promotion': setTotalSteps(4); break;
        case 'update': setTotalSteps(3); break;
      }
    }
  }, [location]);

  // Initialize form with the right schema and default values
  // Use a more generic typing approach to avoid type errors
  const form = useForm({
    // @ts-ignore - The schema types are compatible at runtime, even if TypeScript doesn't see it
    resolver: zodResolver(getSchemaForType(postType)),
    defaultValues: getDefaultValues(postType),
  });

  // Update form when post type changes
  useEffect(() => {
    form.reset(getDefaultValues(postType));
  }, [postType, form]);

  // Update form values from query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const formValues: Record<string, any> = {};
    
    if (postType === 'resource') {
      if (queryParams.get('resourceType')) formValues.resourceType = queryParams.get('resourceType');
      if (queryParams.get('urgency')) formValues.urgency = Number(queryParams.get('urgency'));
      if (queryParams.get('duration')) formValues.duration = queryParams.get('duration');
      if (queryParams.get('description')) formValues.description = queryParams.get('description');
      if (queryParams.get('visibilityRadius')) formValues.visibilityRadius = Number(queryParams.get('visibilityRadius'));
      
      if (queryParams.get('lat') && queryParams.get('lon')) {
        formValues.locationType = 'custom';
        formValues.latitude = queryParams.get('lat');
        formValues.longitude = queryParams.get('lon');
      }
    }
    
    // Apply values from query parameters
    if (Object.keys(formValues).length > 0) {
      form.reset({ ...getDefaultValues(postType), ...formValues });
    }
  }, [postType, location, form]);

  // Function to upload files to S3 and get URLs
  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return [];
    
    const urls = [];
    setLoading(true);
    
    try {
      for (const file of uploadedFiles) {
        // Add the filename as the second argument
        const url = await uploadFileToS3(file, file.name);
        urls.push(url);
      }
      
      setUploadedUrls(urls);
      return urls;
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error uploading files. Please try again.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Submit handler
  const onSubmit = async (data: any) => {
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to create a post");
        return;
      }
      
      // Upload files and get URLs
      const urls = await uploadFiles();
      
      // Prepare data for Firestore
      const postData = {
        ...data,
        photos: urls,
        createdAt: Timestamp.now(),
        userId: user.uid,
        responders: [],
      };
      
      // Add to appropriate collection
      const docRef = await addDoc(collection(db, `${postType}s`), postData);
      
      toast.success("Post created successfully!");
      navigate(`/post/${docRef.id}`);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Error creating post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation between steps
  const nextStep = () => {
    // Validate current step fields
    const fieldsToValidate = getFieldsForStep(currentStep);
    
    // @ts-ignore - TS doesn't understand that the string array is valid for form.trigger
    form.trigger(fieldsToValidate).then(isValid => {
      if (isValid) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      }
    });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Fields to validate per step (for resource form)
  const getFieldsForStep = (step: number): string[] => {
    if (postType === 'resource') {
      switch (step) {
        case 1: return ['title', 'category', 'customCategory'];
        case 2: return ['description', 'resourceType', 'urgency', 'duration'];
        case 3: return ['locationType', 'visibilityRadius'];
        default: return [];
      }
    }
    return [];
  };

  // Render resource form steps
  const renderResourceForm = () => {
    switch (currentStep) {
      case 1:
        return <ResourceBasicInfo form={form} />;
      case 2:
        return <ResourceDetails form={form} />;
      case 3:
        return <ResourceLocation form={form} />;
      case 4:
        return (
          <ResourceUpload 
            form={form} 
            uploadedFiles={uploadedFiles} 
            setUploadedFiles={setUploadedFiles} 
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // Render form content based on post type
  const renderFormContent = () => {
    switch (postType) {
      case 'resource': return renderResourceForm();
      case 'event': return <EventForm form={form} currentStep={currentStep} />;
      case 'promotion': return <PromotionForm form={form} currentStep={currentStep} />;
      case 'update': return <UpdateForm form={form} currentStep={currentStep} />;
      default: return renderResourceForm();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">
        {postType === 'resource' && 'Create Resource Post'}
        {postType === 'event' && 'Create Event Post'}
        {postType === 'promotion' && 'Create Promotion Post'}
        {postType === 'update' && 'Create Update Post'}
      </h1>
      
      <FormProgress currentStep={currentStep} totalSteps={totalSteps} />
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {renderFormContent()}
              
              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="ml-auto">
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPostForm;