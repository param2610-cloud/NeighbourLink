import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import MapContainer, { useOlaMaps } from '@/components/MapContainer';

interface ResourceLocationProps {
  form: UseFormReturn<any>;
}

const ResourceLocation: React.FC<ResourceLocationProps> = ({ form }) => {
  // Use the OlaMaps hook
  const { ref: mapRef, data: mapData } = useOlaMaps();

  // Update form values when a location is selected on the map
  useEffect(() => {
    if (mapData?.selectedLocations && mapData.selectedLocations.length > 0) {
      const location = mapData.selectedLocations[0];
      form.setValue('locationType', 'custom');
      form.setValue('latitude', location.latitude.toString());
      form.setValue('longitude', location.longitude.toString());
      
      // Store the address if you want to save it
      if (location.address) {
        form.setValue('address', location.address);
      }
    }
  }, [mapData?.selectedLocations]);

  // Use current location from the map if available
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

  // Calculate initial map center based on form values
  const getMapCenter = (): [number, number] | undefined => {
    if (form.watch('locationType') === 'custom' && form.watch('latitude') && form.watch('longitude')) {
      return [
        parseFloat(form.watch('longitude')), 
        parseFloat(form.watch('latitude'))
      ];
    }
    return undefined;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Location Settings</h2>
      
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
      
      <FormField
        control={form.control}
        name="isAnonymous"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id="anonymous"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel htmlFor="anonymous">
                Post Anonymously
              </FormLabel>
              <FormDescription>
                Your name and profile information won't be visible
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default ResourceLocation;