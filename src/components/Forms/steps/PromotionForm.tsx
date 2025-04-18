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

interface PromotionFormProps {
  form: UseFormReturn<any>;
  currentStep: number;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ form, currentStep }) => {
  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Promotion Details</h2>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promotion Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a title for your promotion" {...field} />
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
                <FormLabel>Promotion Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your promotion" 
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
          <h2 className="text-2xl font-bold">Contact Information</h2>
          
          <FormField
            control={form.control}
            name="contactDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Details</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter contact details for this promotion" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    
    // More steps as needed...
    
    default:
      return <div>Promotion form step {currentStep}</div>;
  }
};

export default PromotionForm;