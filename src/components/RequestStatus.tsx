
import { useState, useEffect } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageSquare, Clock, Loader, RefreshCw, Timer, Check } from 'lucide-react';

const RequestStatus = () => {
  const { currentRequest, markSMSSent, requestSMS, completeRequest, isLoading } = useSMS();
  const [hasSentSMS, setHasSentSMS] = useState(false);
  const [smsClickTimestamp, setSmsClickTimestamp] = useState<string>('');

  // Log the current request status whenever it changes for debugging
  useEffect(() => {
    if (currentRequest) {
      console.log('🔍 RequestStatus - Current request status:', currentRequest.status);
      console.log('🔍 RequestStatus - Current request details:', currentRequest);
    }
  }, [currentRequest]);

  if (!currentRequest) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Keine aktive Anfrage gefunden.</p>
      </div>
    );
  }

  const handleSendSMS = async () => {
    try {
      console.log('🚀 RequestStatus - handleSendSMS called for request:', currentRequest.id);
      console.log('🚀 RequestStatus - Current status before calling markSMSSent:', currentRequest.status);
      
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
      
      console.log('📱 RequestStatus - About to call markSMSSent with requestId:', currentRequest.id);
      const result = await markSMSSent(currentRequest.id);
      console.log('📱 RequestStatus - markSMSSent returned:', result);
      
      if (result) {
        console.log('✅ RequestStatus - markSMSSent was successful');
      } else {
        console.error('❌ RequestStatus - markSMSSent failed');
      }
      
    } catch (error) {
      console.error('💥 RequestStatus - Error in handleSendSMS:', error);
    }
  };

  const handleRequestNewSMS = () => {
    console.log('🔄 RequestStatus - handleRequestNewSMS called for request:', currentRequest.id);
    requestSMS(currentRequest.id);
  };

  const handleCompleteProcess = () => {
    console.log('✅ RequestStatus - handleCompleteProcess called for request:', currentRequest.id);
    completeRequest(currentRequest.id);
  };

  const getStatusDisplay = () => {
    console.log('🎨 RequestStatus - getStatusDisplay called with status:', currentRequest.status);
    
    switch (currentRequest.status) {
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-orange mx-auto mb-4" />,
          title: 'Anfrage wird bearbeitet',
          description: 'Ihre Anfrage wird gerade verarbeitet. Bitte warten Sie einen Moment.',
          showButton: false
        };
      
      case 'activated':
        // Check if SMS code exists for activated status
        if (currentRequest.smsCode) {
          return {
            icon: <MessageSquare className="h-12 w-12 text-green-500 mx-auto mb-4" />,
            title: 'SMS Code empfangen!',
            description: 'Ihr SMS Code wurde erfolgreich empfangen.',
            showButton: false,
            smsCode: currentRequest.smsCode,
            showActionButtons: true
          };
        } else {
          return {
            icon: <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />,
            title: 'Nummer aktiviert!',
            description: `Ihre Nummer ${currentRequest.phone} wurde erfolgreich aktiviert.`,
            showButton: true,
            buttonText: 'SMS versendet',
            buttonAction: handleSendSMS
          };
        }
      
      case 'sms_requested':
        return {
          icon: <Loader className="h-12 w-12 text-orange animate-spin mx-auto mb-4" />,
          title: 'SMS Code angefordert',
          description: 'Ihr SMS Code wurde angefordert und wird vom Admin bearbeitet. Bitte warten Sie einen Moment.',
          showButton: false
        };
      
      case 'sms_sent':
        return {
          icon: <Loader className="h-12 w-12 text-orange animate-spin mx-auto mb-4" />,
          title: 'Warten auf SMS Code',
          description: 'Ihr SMS Code wird gerade verarbeitet. Dies kann einige Sekunden dauern.',
          showButton: false
        };
      
      case 'waiting_for_additional_sms':
        return {
          icon: <Timer className="h-12 w-12 text-blue-500 mx-auto mb-4" />,
          title: 'SMS Code empfangen!',
          description: 'Ihr SMS Code wurde empfangen. Sie haben 5 Minuten Zeit, eine weitere SMS anzufordern.',
          showButton: false,
          smsCode: currentRequest.smsCode,
          showActionButtons: true,
          showTimeLimit: true
        };
      
      case 'completed':
        return {
          icon: <MessageSquare className="h-12 w-12 text-green-500 mx-auto mb-4" />,
          title: 'SMS Code empfangen!',
          description: 'Ihr SMS Code wurde erfolgreich empfangen.',
          showButton: false,
          smsCode: currentRequest.smsCode,
          showActionButtons: true
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

      {statusInfo.smsCode && (
        <div className={`${currentRequest.status === 'waiting_for_additional_sms' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-lg p-6 mt-6`}>
          <h4 className={`text-lg font-semibold ${currentRequest.status === 'waiting_for_additional_sms' ? 'text-blue-800' : 'text-green-800'} mb-2`}>
            Ihr SMS Code:
          </h4>
          <div className={`text-3xl font-mono font-bold ${currentRequest.status === 'waiting_for_additional_sms' ? 'text-blue-700 bg-white border-2 border-blue-300' : 'text-green-700 bg-white border-2 border-green-300'} p-4 rounded`}>
            {statusInfo.smsCode}
          </div>
          <p className={`text-sm ${currentRequest.status === 'waiting_for_additional_sms' ? 'text-blue-600' : 'text-green-600'} mt-2`}>
            Verwenden Sie diesen Code für Ihre Verifikation.
          </p>

          {statusInfo.showTimeLimit && (
            <div className="mt-4 py-2 px-4 bg-blue-100 rounded-md border border-blue-300">
              <p className="text-blue-800 text-sm">
                <Timer className="h-4 w-4 inline-block mr-1" />
                <strong>Zeitlimit:</strong> Sie haben 5 Minuten Zeit, eine weitere SMS anzufordern.
              </p>
            </div>
          )}
        </div>
      )}

      {hasSentSMS && smsClickTimestamp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-blue-800 text-sm">
            <strong>SMS versendet:</strong> {smsClickTimestamp}
          </p>
        </div>
      )}

      {statusInfo.showActionButtons && (
        <div className="flex justify-center gap-4 mt-6">
          <Button 
            onClick={handleRequestNewSMS}
            variant="outline"
            className={`flex items-center gap-2 ${currentRequest.status === 'waiting_for_additional_sms' ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : ''}`}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            {currentRequest.status === 'waiting_for_additional_sms' ? 'Weitere SMS anfordern' : 'Weiteren Code anfordern'}
          </Button>
          <Button 
            onClick={handleCompleteProcess}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading}
          >
            <Check className="h-4 w-4" />
            Vorgang abgeschlossen
          </Button>
        </div>
      )}
    </div>
  );
};

export default RequestStatus;
