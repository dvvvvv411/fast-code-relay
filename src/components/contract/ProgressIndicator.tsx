
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const ProgressIndicator = ({ currentStep, totalSteps, steps }: ProgressIndicatorProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                    {
                      "bg-green-500 text-white": isCompleted,
                      "bg-orange text-white": isCurrent,
                      "bg-gray-200 text-gray-600": !isCompleted && !isCurrent,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs text-center max-w-20 transition-colors duration-300",
                    {
                      "text-green-600 font-medium": isCompleted,
                      "text-orange font-medium": isCurrent,
                      "text-gray-500": !isCompleted && !isCurrent,
                    }
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors duration-300",
                    {
                      "bg-green-500": stepNumber < currentStep,
                      "bg-orange": stepNumber === currentStep,
                      "bg-gray-200": stepNumber > currentStep,
                    }
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
