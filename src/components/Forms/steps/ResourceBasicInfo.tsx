import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResourceBasicInfoProps {
  form: UseFormReturn<any>;
}

const ResourceBasicInfo: React.FC<ResourceBasicInfoProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Basic Information</h2>
      
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter a title for your resource" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Medical">Medical</SelectItem>
                <SelectItem value="Shelter">Shelter</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Tools">Tools</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {form.watch('category') === 'Other' && (
        <FormField
          control={form.control}
          name="customCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specify Category</FormLabel>
              <FormControl>
                <Input placeholder="Enter custom category" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default ResourceBasicInfo;