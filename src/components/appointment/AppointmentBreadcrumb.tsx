
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentBreadcrumbProps {
  currentStep: 'date' | 'time' | 'confirm' | 'success';
}

const AppointmentBreadcrumb = ({ currentStep }: AppointmentBreadcrumbProps) => {
  const breadcrumbs = [
    { key: 'home', label: 'Startseite', icon: Home },
    { key: 'booking', label: 'Terminbuchung' },
  ];

  const stepLabels = {
    date: 'Datum auswählen',
    time: 'Uhrzeit auswählen', 
    confirm: 'Bestätigung',
    success: 'Erfolgreich gebucht'
  };

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.key} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          <div className="flex items-center gap-1">
            {crumb.icon && <crumb.icon className="h-4 w-4" />}
            <span className={cn(
              index === breadcrumbs.length - 1 ? "text-gray-700" : "hover:text-gray-700 cursor-pointer"
            )}>
              {crumb.label}
            </span>
          </div>
        </div>
      ))}
      
      <ChevronRight className="h-4 w-4 mx-2" />
      <span className="text-orange font-medium">
        {stepLabels[currentStep]}
      </span>
    </nav>
  );
};

export default AppointmentBreadcrumb;
