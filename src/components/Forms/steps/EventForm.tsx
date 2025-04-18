import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import FileUpload from "../../Forms/FileUpload";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import MapContainer, { useOlaMaps } from '@/components/MapContainer';
import { auth } from '@/firebase';

interface EventFormProps {
  form: UseFormReturn<any>;
  currentStep: number;
  uploadedFiles?: File[];
  setUploadedFiles?: React.Dispatch<React.SetStateAction<File[]>>;
}

const EventForm: React.FC<EventFormProps> = ({ 
  form, 
  currentStep,
  uploadedFiles = [],
  setUploadedFiles = () => {}
}) => {
  
  const { ref: mapRef, data: mapData } = useOlaMaps();

  
  useEffect(() => {
    if (mapData?.selectedLocations && mapData.selectedLocations.length > 0) {
      const location = mapData.selectedLocations[0];
      form.setValue('locationType', 'custom');
      form.setValue('latitude', location.latitude.toString());
      form.setValue('longitude', location.longitude.toString());
      
      
      if (location.address) {
        form.setValue('address', location.address);
      }
    }
  }, [mapData?.selectedLocations, form]);

  
  useEffect(() => {
    if (mapData?.currentLocation && form.watch('locationType') === 'custom') {
      const { latitude, longitude } = mapData.currentLocation;
      form.setValue('latitude', latitude.toString());
      form.setValue('longitude', longitude.toString());
      
      if (mapData.currentAddress) {
        form.setValue('address', mapData.currentAddress);
      }
    }
  }, [mapData?.currentLocation, mapData?.currentAddress, form.watch('locationType')]);

  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue('locationType', 'custom');
          form.setValue('latitude', latitude.toString());
          form.setValue('longitude', longitude.toString());
          toast.success("Location detected successfully!");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to retrieve your location. Please enable location access.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  
  const getMapCenter = () => {
    if (form.watch('latitude') && form.watch('longitude')) {
      return [
        parseFloat(form.watch('longitude')), 
        parseFloat(form.watch('latitude'))  
      ] as [number, number];
    }
    return undefined;
  };

  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Event Details</h2>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a title for your event" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your event" 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Seminar">Seminar</SelectItem>
                    <SelectItem value="Educational">Educational</SelectItem>
                    <SelectItem value="Recreational">Recreational</SelectItem>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    
    case 2:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Event Schedule</h2>
          
          <FormField
            control={form.control}
            name="eventDateTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date & Time</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value instanceof Date ? field.value : null}
                    onChange={(date) => field.onChange(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholderText="Select event date and time"
                  />
                </FormControl>
                <FormDescription>
                  Select the start date and time for your event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Duration</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1 hour">1 hour</SelectItem>
                    <SelectItem value="2 hours">2 hours</SelectItem>
                    <SelectItem value="3 hours">3 hours</SelectItem>
                    <SelectItem value="Half day">Half day</SelectItem>
                    <SelectItem value="1 day">1 day</SelectItem>
                    <SelectItem value="2 days">2 days</SelectItem>
                    <SelectItem value="3 days">3 days</SelectItem>
                    <SelectItem value="1 week">1 week</SelectItem>
                    <SelectItem value="2 weeks">2 weeks</SelectItem>
                    <SelectItem value="1 month">1 month</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How long will your event last?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Post Visibility Duration</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select how long to keep this post active" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1 week">1 week</SelectItem>
                    <SelectItem value="2 weeks">2 weeks</SelectItem>
                    <SelectItem value="1 month">1 month</SelectItem>
                    <SelectItem value="Until event date">Until event date</SelectItem>
                    <SelectItem value="1 day after event">1 day after event</SelectItem>
                    <SelectItem value="1 week after event">1 week after event</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How long should this event post remain visible?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Event Location</h2>
          
          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Type</FormLabel>
                <FormControl>
                  <RadioGroup 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="default-location" />
                      <Label htmlFor="default-location">Use Profile Location</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom-location" />
                      <Label htmlFor="custom-location">Custom Location</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch('locationType') === 'custom' && (
            <>
              {/* Map Component */}
              <div className="w-full h-[300px] mb-4 rounded-md overflow-hidden border">
                <MapContainer
                  center={getMapCenter()}
                  ref={mapRef}
                  showCurrentLocation={true}
                  zoom={13}
                  scrollWheelZoom={true}
                  isSelectable={true}
                  maximumSelection={1}
                />
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                {mapData?.selectedLocations && mapData.selectedLocations.length > 0 ? 
                  <p>Selected location: {mapData.selectedLocations[0].address}</p> :
                  <p>Click on the map to select a location or use the button below to get your current location</p>
                }
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter latitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter longitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={getCurrentLocation}
                className="flex items-center gap-2"
              >
                <FaMapMarkerAlt /> Get Current Location
              </Button>
            </>
          )}
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Display Text</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter location address or description" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  How should the location be displayed to viewers?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="visibilityRadius"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility Radius: {field.value} km</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={50}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={([value]) => field.onChange(value)}
                    className="py-4"
                  />
                </FormControl>
                <FormDescription>
                  Set how far your event can be seen from the location
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Registration Details</h2>
          
          <FormField
            control={form.control}
            name="registrationRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="registration"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="registration">
                    Registration Required
                  </FormLabel>
                  <FormDescription>
                    Do attendees need to register for this event?
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {form.watch('registrationRequired') && (
            <FormField
              control={form.control}
              name="registrationLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Link</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter registration URL" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="organizerDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organizer Details</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter information about the event organizers" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Contact info will be visible to event attendees
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoFillOrganizer"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) {
                        
                        const currentUser = auth.currentUser;
                        if (currentUser) {
                          form.setValue('organizerDetails', 
                            `Contact: ${currentUser.displayName || 'Event Organizer'}\nEmail: ${currentUser.email || 'Not provided'}`
                          );
                        }
                      }
                    }}
                    id="auto-fill"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="auto-fill">
                    Use my profile info
                  </FormLabel>
                  <FormDescription>
                    Automatically fill organizer details from your profile
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      );

    case 5:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Images & Preview</h2>
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <FormLabel className="block mb-2">Event Images</FormLabel>
            <FileUpload 
              files={uploadedFiles}
              setFiles={setUploadedFiles}
              maxFiles={5}
            />
            <FormDescription className="mt-2">
              Upload up to 5 images. The first image will be used as the banner.
            </FormDescription>
          </div>

          {uploadedFiles.length > 0 && (
            <FormField
              control={form.control}
              name="bannerImageIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Banner Image</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString() || "0"}
                      className="grid grid-cols-5 gap-2"
                    >
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative h-20">
                          <RadioGroupItem
                            value={index.toString()}
                            id={`banner-${index}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`banner-${index}`}
                            className="cursor-pointer h-full w-full rounded-md overflow-hidden flex items-center justify-center border-2"
                            data-selected={field.value === index ? "true" : "false"}
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index}`}
                              className="object-cover h-full w-full"
                            />
                            {field.value === index && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="bg-primary text-white text-xs px-2 py-1 rounded">
                                  Banner
                                </div>
                              </div>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Choose which image to use as the main event banner
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <div className="mt-8 bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Event Preview</h3>
            <div className="bg-background p-4 rounded-md border">
              <h4 className="text-lg font-semibold">{form.watch('title') || 'Event Title'}</h4>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                  {form.watch('eventType') || 'Event Type'}
                </span>
                <span className="mx-2">•</span>
                <span>
                  {form.watch('eventDateTime') instanceof Date
                    ? form.watch('eventDateTime').toLocaleDateString()
                    : 'Date not set'}
                </span>
                <span className="mx-2">•</span>
                <span>{form.watch('duration') || 'Duration not set'}</span>
              </div>
              <p className="mt-2 text-sm">
                {form.watch('description') || 'Event description will appear here'}
              </p>
              <div className="mt-3 text-sm">
                <p>Location: {form.watch('address') || (form.watch('latitude') && form.watch('longitude') 
                  ? `${form.watch('latitude')}, ${form.watch('longitude')}`
                  : 'Location not set')}</p>
                <p>Organized by: {form.watch('organizerDetails')?.split('\n')[0] || 'Organizer details not set'}</p>
                {form.watch('registrationRequired') && (
                  <p>Registration required: {form.watch('registrationLink') || 'Link not provided'}</p>
                )}
                <p>Visibility: {form.watch('visibilityRadius')} km radius</p>
              </div>
            </div>
          </div>
        </div>
      );
    
    default:
      return <div>Event form step {currentStep}</div>;
  }
};

export default EventForm;