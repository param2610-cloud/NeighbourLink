import React from 'react';
import { Progress } from "@/components/ui/progress";

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
}

const FormProgress: React.FC<FormProgressProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="mb-6">
      <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      <div className="flex justify-between mt-2 text-sm text-gray-500">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`${i + 1 <= currentStep ? 'text-primary font-medium' : ''}`}>
            Step {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormProgress;