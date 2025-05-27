
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, CheckCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentProgressProps {
  currentStep: 'date' | 'time' | 'confirm' | 'success';
}

const AppointmentProgress = ({ currentStep }: AppointmentProgressProps) => {
  const steps = [
    { key: 'date', label: 'Datum wählen', icon: Calendar },
    { key: 'time', label: 'Uhrzeit wählen', icon: Clock },
    { key: 'confirm', label: 'Bestätigen', icon: CheckCircle },
  ];

  const getStepIndex = (step: string) => steps.findIndex(s => s.key === step);
  const currentIndex = getStepIndex(currentStep);
  const progressValue = currentStep === 'success' ? 100 : ((currentIndex + 1) / steps.length) * 100;

  const isStepCompleted = (stepKey: string) => {
    const stepIndex = getStepIndex(stepKey);
    return stepIndex < currentIndex || currentStep === 'success';
  };

  const isStepCurrent = (stepKey: string) => {
    return stepKey === currentStep && currentStep !== 'success';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Progress value={progressValue} className="h-2" />
      
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const completed = isStepCompleted(step.key);
          const current = isStepCurrent(step.key);
          
          return (
            <div key={step.key} className="flex flex-col items-center space-y-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                completed && "bg-green-500 border-green-500 text-white",
                current && "bg-orange border-orange text-white",
                !completed && !current && "bg-gray-100 border-gray-300 text-gray-400"
              )}>
                {completed ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium text-center max-w-20",
                completed && "text-green-600",
                current && "text-orange",
                !completed && !current && "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentProgress;
