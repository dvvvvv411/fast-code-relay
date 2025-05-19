
import { useEffect, useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const RequestStatus = () => {
  const { currentRequest, requestSMS } = useSMS();
  const [smsCode, setSmsCode] = useState<string | null>(null);
  
  useEffect(() => {
    if (currentRequest?.status === 'completed' && currentRequest.smsCode) {
      setSmsCode(currentRequest.smsCode);
    }
  }, [currentRequest]);

  if (!currentRequest) {
    return null;
  }

  const renderStatus = () => {
    switch (currentRequest.status) {
      case 'pending':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-400 animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">In Bearbeitung</h3>
            <p className="text-gray-500">Ihre Anfrage wird überprüft...</p>
          </div>
        );
      
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
              SMS wurde gesendet
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
