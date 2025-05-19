import { useEffect, useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Check, Clock, Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const RequestStatus = () => {
  const { currentRequest, requestSMS } = useSMS();
  const [smsCode, setSmsCode] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  
  useEffect(() => {
    if (currentRequest?.status === 'completed' && currentRequest.smsCode) {
      setSmsCode(currentRequest.smsCode);
    }
  }, [currentRequest]);

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
            <h3 className="text-xl font-medium mb-4">Nummer aktiviert</h3>
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
            <p className="text-gray-500">Vorgang abgeschlossen</p>
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
