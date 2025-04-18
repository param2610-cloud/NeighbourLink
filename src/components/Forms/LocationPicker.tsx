import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface LocationPickerProps {
  form: UseFormReturn<any>;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ form }) => {
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

  return (
    <>
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
              Set how far your post can be seen from the location
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default LocationPicker;