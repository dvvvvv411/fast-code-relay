
import { useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageSquare, Clock, Loader } from 'lucide-react';

const RequestStatus = () => {
  const { currentRequest, markSMSSent, isLoading } = useSMS();
  const [hasSentSMS, setHasSentSMS] = useState(false);
  const [smsClickTimestamp, setSmsClickTimestamp] = useState<string>('');

  if (!currentRequest) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Keine aktive Anfrage gefunden.</p>
      </div>
    );
  }

  const handleSendSMS = () => {
    markSMSSent(currentRequest.id);
    setHasSentSMS(true);
    
    // Zeitstempel erstellen
    const now = new Date();
    const timestamp = now.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setSmsClickTimestamp(timestamp);
  };

  const getStatusDisplay = () => {
    switch (currentRequest.status) {
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-orange mx-auto mb-4" />,
          title: 'Anfrage wird bearbeitet',
          description: 'Ihre Anfrage wird gerade verarbeitet. Bitte warten Sie einen Moment.',
          showButton: false
        };
      
      case 'activated':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />,
          title: 'Nummer aktiviert!',
          description: `Ihre Nummer ${currentRequest.phone} wurde erfolgreich aktiviert.`,
          showButton: true,
          buttonText: 'SMS versendet',
          buttonAction: handleSendSMS
        };
      
      case 'sms_sent':
      case 'sms_requested':
        return {
          icon: <Loader className="h-12 w-12 text-orange animate-spin mx-auto mb-4" />,
          title: 'Warten auf SMS Code',
          description: 'Ihr SMS Code wird gerade verarbeitet. Dies kann einige Sekunden dauern.',
          showButton: false
        };
      
      case 'completed':
        return {
          icon: <MessageSquare className="h-12 w-12 text-green-500 mx-auto mb-4" />,
          title: 'SMS Code empfangen!',
          description: 'Ihr SMS Code wurde erfolgreich empfangen.',
          showButton: false,
          smsCode: currentRequest.smsCode
        };
      
      default:
        return {
          icon: <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />,
          title: 'Status unbekannt',
          description: 'Der Status Ihrer Anfrage konnte nicht ermittelt werden.',
          showButton: false
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="text-center space-y-6">
      {statusInfo.icon}
      
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          {statusInfo.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {statusInfo.description}
        </p>
      </div>

      {statusInfo.showButton && (
        <div className="flex justify-center">
          <Button 
            onClick={statusInfo.buttonAction}
            className="bg-orange hover:bg-orange-dark text-white px-8 py-3 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Verarbeite...
              </>
            ) : (
              statusInfo.buttonText
            )}
          </Button>
        </div>
      )}

      {hasSentSMS && smsClickTimestamp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-blue-800 text-sm">
            <strong>SMS versendet:</strong> {smsClickTimestamp}
          </p>
        </div>
      )}

      {statusInfo.smsCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
          <h4 className="text-lg font-semibold text-green-800 mb-2">
            Ihr SMS Code:
          </h4>
          <div className="text-3xl font-mono font-bold text-green-700 bg-white p-4 rounded border-2 border-green-300">
            {statusInfo.smsCode}
          </div>
          <p className="text-sm text-green-600 mt-2">
            Verwenden Sie diesen Code für Ihre Verifikation.
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestStatus;
