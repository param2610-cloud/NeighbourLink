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
import { Textarea } from "@/components/ui/textarea";

interface UpdateFormProps {
  form: UseFormReturn<any>;
  currentStep: number;
}

const UpdateForm: React.FC<UpdateFormProps> = ({ form, currentStep }) => {
  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Update Information</h2>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Update Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a title for your update" {...field} />
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
                <FormLabel>Update Content</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the update content" 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    
    case 2:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Update Details</h2>
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Update</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    
    // More steps as needed...
    
    default:
      return <div>Update form step {currentStep}</div>;
  }
};

export default UpdateForm;