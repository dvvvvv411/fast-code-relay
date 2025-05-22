import { useEffect, useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Check, Clock, Loader, Activity, Zap, Signal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const RequestStatus = () => {
  const { currentRequest, requestSMS, resetSMSCode, isLoading } = useSMS();
  const [progressValue, setProgressValue] = useState(0);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [activationStep, setActivationStep] = useState(0);
  const [activationMessages, setActivationMessages] = useState<string[]>([
    'Verbindung wird hergestellt...',
    'Nummer wird überprüft...',
    'Server wird kontaktiert...',
    'Aktivierung in Bearbeitung...',
    'Warte auf Bestätigung...'
  ]);
  
  // Track status changes to trigger sounds and notifications
  useEffect(() => {
    if (currentRequest?.status && prevStatus !== currentRequest.status) {
      if (currentRequest.status === 'activated') {
        // Play activation sound
        const activationSound = new Audio('/activation-complete.mp3');
        activationSound.play().catch(error => console.error('Failed to play sound:', error));
      }
      
      if (currentRequest.status === 'completed') {
        // Play SMS received sound
        const smsSound = new Audio('/sms-received.mp3');
        smsSound.play().catch(error => console.error('Failed to play sound:', error));
      }
      
      setPrevStatus(currentRequest.status);
    }
  }, [currentRequest?.status, prevStatus]);

  // Animation effect for the progress bar
  useEffect(() => {
    if (currentRequest?.status === 'pending') {
      // Reset progress value when entering pending state
      setProgressValue(10);
      
      // For progress bar animation
      const progressInterval = setInterval(() => {
        setProgressValue((prev) => {
          // Keep progress between 10-90% during pending state to show activity
          // but avoid looking complete
          const newValue = prev + (Math.random() * 3 + 0.5);
          return newValue > 90 ? 10 : newValue;
        });
      }, 800);
      
      // For cycling through activation messages
      const messageInterval = setInterval(() => {
        setActivationStep(prev => (prev + 1) % activationMessages.length);
      }, 3000);
      
      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    }
    
    if (currentRequest?.status === 'activated') {
      setProgressValue(100);
    }
  }, [currentRequest?.status, activationMessages.length]);

  if (!currentRequest) {
    return null;
  }

  const handleRequestSMS = () => {
    if (currentRequest) {
      requestSMS(currentRequest.id);
    }
  };

  const handleResetSMSCode = () => {
    if (currentRequest) {
      resetSMSCode(currentRequest.id);
    }
  };

  const renderActivationIcon = () => {
    const icons = [
      <Signal className="w-10 h-10 text-orange animate-pulse" key="signal" />,
      <Activity className="w-10 h-10 text-orange animate-pulse" key="activity" />,
      <Zap className="w-10 h-10 text-orange animate-pulse" key="zap" />,
      <Clock className="w-10 h-10 text-orange animate-pulse" key="clock" />,
      <Loader className="w-10 h-10 text-orange animate-spin" key="loader" />
    ];
    
    return icons[activationStep % icons.length];
  };

  const renderActivationLoading = () => {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-orange-light/20 flex items-center justify-center">
            {renderActivationIcon()}
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Nummer wird aktiviert...</h3>
        <p className="text-gray-500 mb-4">Dies kann bis zu 5 Minuten dauern</p>
        
        <div className="relative my-8 bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-700 animate-fade-in">{activationMessages[activationStep]}</p>
          <div className="absolute -bottom-1 left-0 w-full h-1 overflow-hidden">
            <div className="h-full bg-orange animate-pulse-slow" style={{ width: '30%' }}></div>
          </div>
        </div>
        
        <div className="w-full max-w-xs mx-auto mt-8">
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Aktivierung läuft</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStatus = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-60 mx-auto mb-4" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      );
    }
    
    switch (currentRequest.status) {
      case 'pending':
        return renderActivationLoading();
      
      case 'activated':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-green-400"></div>
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">Nummer aktiviert</h3>
            <p className="text-gray-500 mb-4">Sie können den SMS Code nun senden</p>
            <Button 
              onClick={handleRequestSMS}
              className="bg-orange hover:bg-orange-dark"
              disabled={isLoading}
            >
              SMS anfordern
            </Button>
          </div>
        );
      
      case 'sms_requested':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-orange animate-pulse-orange"></div>
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">SMS Code angefordert</h3>
            <p className="text-gray-500">Warten Sie auf den SMS Code...</p>
          </div>
        );
      
      case 'completed':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">SMS Code erhalten</h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-2xl font-bold text-orange">{currentRequest.smsCode}</p>
            </div>
            <p className="text-gray-500 mb-4">Vorgang abgeschlossen. Sie können die Seite nun verlassen</p>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleRequestSMS}
                className="bg-orange hover:bg-orange-dark"
                disabled={isLoading}
              >
                Neue SMS anfordern
              </Button>
              <Button 
                onClick={handleResetSMSCode}
                variant="outline" 
                className="border-orange text-orange hover:bg-orange-50"
                disabled={isLoading}
              >
                Falscher Code erhalten
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      {renderStatus()}
    </div>
  );
};

export default RequestStatus;
