
import { useEffect, useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Check, Clock, Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const RequestStatus = () => {
  const { currentRequest, requestSMS, resetSMSCode } = useSMS();
  const [smsCode, setSmsCode] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  
  useEffect(() => {
    if (currentRequest?.status === 'completed' && currentRequest.smsCode) {
      setSmsCode(currentRequest.smsCode);
    }
  }, [currentRequest]);

  // Track status changes to trigger sounds and notifications
  useEffect(() => {
    if (currentRequest?.status && prevStatus !== currentRequest.status) {
      if (currentRequest.status === 'activated') {
        // Play activation sound
        const activationSound = new Audio('/activation-complete.mp3');
        activationSound.play().catch(error => console.error('Failed to play sound:', error));
        
        // Show activation notification
        toast({
          title: "Nummer aktiviert",
          description: "Ihre Nummer wurde erfolgreich aktiviert.",
        });
      }
      
      if (currentRequest.status === 'completed') {
        // Play SMS received sound
        const smsSound = new Audio('/sms-received.mp3');
        smsSound.play().catch(error => console.error('Failed to play sound:', error));
        
        // Show SMS notification
        toast({
          title: "SMS Code erhalten",
          description: "Der angeforderte SMS Code ist eingetroffen.",
        });
      }
      
      setPrevStatus(currentRequest.status);
    }
  }, [currentRequest?.status, prevStatus]);

  // Animation effect for the progress bar
  useEffect(() => {
    if (currentRequest?.status === 'pending') {
      const interval = setInterval(() => {
        setProgressValue((prev) => {
          // Keep progress between 10-90% during pending state to show activity
          // but avoid looking complete
          const newValue = prev + (Math.random() * 5);
          return newValue > 90 ? 10 : newValue;
        });
      }, 2000);
      
      return () => clearInterval(interval);
    }
    
    if (currentRequest?.status === 'activated') {
      setProgressValue(100);
    }
  }, [currentRequest?.status]);

  if (!currentRequest) {
    return null;
  }

  const renderActivationLoading = () => {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-orange-light/20 flex items-center justify-center animate-pulse">
            <Clock className="w-10 h-10 text-orange animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Nummer wird aktiviert...</h3>
        <p className="text-gray-500 mb-8">Dies kann bis zu 5 Minuten dauern</p>
        
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
              onClick={() => requestSMS(currentRequest.phone)}
              className="bg-orange hover:bg-orange-dark"
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
              <p className="text-2xl font-bold text-orange">{smsCode}</p>
            </div>
            <p className="text-gray-500 mb-4">Vorgang abgeschlossen. Sie können die Seite nun verlassen</p>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => requestSMS(currentRequest.phone)}
                className="bg-orange hover:bg-orange-dark"
              >
                Neue SMS anfordern
              </Button>
              <Button 
                onClick={() => resetSMSCode(currentRequest.phone)}
                variant="outline" 
                className="border-orange text-orange hover:bg-orange-50"
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
    <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-white">
      {renderStatus()}
    </div>
  );
};

export default RequestStatus;
