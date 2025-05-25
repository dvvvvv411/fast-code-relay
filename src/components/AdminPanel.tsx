import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSMS } from '../context/SMSContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneNumberManager from './PhoneNumberManager';
import { List, Phone, MessageSquare, Loader, AlertTriangle, Send, Timer } from 'lucide-react';
import SupportTickets from './SupportTickets';
import { Skeleton } from '@/components/ui/skeleton';

const AdminPanel = () => {
  const { requests, activateRequest, submitSMSCode, isLoading } = useSMS();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [smsCode, setSmsCode] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  
  const handleActivate = (requestId: string) => {
    console.log('🎯 Admin activating request:', requestId);
    activateRequest(requestId);
  };
  
  const handleSendSMS = (requestId: string) => {
    console.log('📝 Admin preparing to send SMS for request:', requestId);
    setSelectedRequest(requestId);
  };
  
  const submitSMS = () => {
    if (selectedRequest && smsCode) {
      console.log('📨 Admin submitting SMS code for request:', selectedRequest, 'Code:', smsCode);
      submitSMSCode(selectedRequest, smsCode);
      setSmsCode('');
      setSelectedRequest(null);
    }
  };

  const handleCancelSMS = () => {
    setSmsCode('');
    setSelectedRequest(null);
  };
  
  const requestsList = Object.values(requests);
  
  // Enhanced logging for admin panel updates with real-time tracking
  useEffect(() => {
    console.log('🔄 Admin Panel requests updated:', requestsList.length, 'total requests');
    requestsList.forEach(request => {
      console.log(`📊 Request ${request.id}: ${request.status} - Phone: ${request.phone} - Updated: ${request.updatedAt.toISOString()}`);
      
      // Special logging for additional SMS requests
      if (request.status === 'additional_sms_requested') {
        console.log(`🔔 ADMIN ALERT: Request ${request.id} has requested additional SMS code!`);
      }
      
      // Special logging for waiting for additional SMS requests
      if (request.status === 'waiting_for_additional_sms') {
        console.log(`⏰ ADMIN ALERT: Request ${request.id} is waiting for additional SMS code!`);
      }
    });
  }, [requests]);
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-orange mx-auto mb-4" />
          <p className="text-gray-500">Lade Admin-Bereich...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isAdmin) {
    return (
      <div className="text-center p-12">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-orange" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Zugriff verweigert</h2>
        <p className="text-gray-600 mb-6">Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen.</p>
        <Button onClick={() => window.location.href = "/"}>Zurück zur Startseite</Button>
      </div>
    );
  }
  
  const renderRequests = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-md shadow-sm">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      );
    }
    
    if (requestsList.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Keine Anfragen vorhanden</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zugangscode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Letzte Aktualisierung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktion
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requestsList.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{request.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{request.accessCode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-all ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'activated' ? 'bg-green-100 text-green-800' :
                    request.status === 'sms_requested' ? 'bg-red-100 text-red-800 animate-pulse ring-2 ring-red-300' :
                    request.status === 'sms_sent' ? 'bg-orange-100 text-orange-800 animate-pulse' :
                    request.status === 'waiting_for_additional_sms' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {request.status === 'pending' ? '⏳ In Bearbeitung' :
                     request.status === 'activated' ? '✅ Aktiviert' :
                     request.status === 'sms_requested' ? '🚨 SMS Code benötigt' :
                     request.status === 'sms_sent' ? '📤 SMS unterwegs' :
                     request.status === 'waiting_for_additional_sms' ? '📱 SMS gesendet' :
                     '✅ Abgeschlossen'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {request.updatedAt.toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {request.status === 'pending' && (
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => handleActivate(request.id)}
                        size="sm"
                        className="bg-orange hover:bg-orange-dark transition-all"
                      >
                        Aktivieren
                      </Button>
                    </div>
                  )}
                  
                  {(request.status === 'activated' || 
                    request.status === 'sms_requested' || 
                    request.status === 'sms_sent') && (
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => handleSendSMS(request.id)}
                        size="sm" 
                        className={`transition-all ${
                          request.status === 'sms_requested'
                            ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-2 ring-red-300' 
                            : request.status === 'activated'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-orange hover:bg-orange-dark'
                        }`}
                      >
                        📨 {request.status === 'activated' ? 'Neuen SMS Code senden' : 'SMS Code eingeben'}
                      </Button>
                    </div>
                  )}
                  
                  {request.status === 'waiting_for_additional_sms' && (
                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm text-blue-500 flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        <span>SMS Code gesendet</span>
                      </div>
                      <div>
                        SMS Code: <span className="font-medium bg-blue-100 px-2 py-1 rounded">{request.smsCode}</span>
                      </div>
                      <Button 
                        onClick={() => handleSendSMS(request.id)}
                        size="sm"
                        variant="outline" 
                        className="text-blue-500 border-blue-500 hover:bg-blue-50"
                      >
                        Neuen SMS Code senden
                      </Button>
                    </div>
                  )}
                  
                  {request.status === 'completed' && (
                    <div className="text-sm text-gray-500 flex flex-col gap-2 items-center">
                      <div>
                        SMS Code: <span className="font-medium bg-green-100 px-2 py-1 rounded">{request.smsCode}</span>
                      </div>
                      <Button 
                        onClick={() => handleSendSMS(request.id)}
                        size="sm"
                        variant="outline"
                        className="text-blue-500 border-blue-500 hover:bg-blue-50"
                      >
                        Neuen SMS Code senden
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <Tabs defaultValue="requests" className="w-full">
      <TabsList className="mb-6 bg-gray-100 p-1">
        <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-orange data-[state=active]:text-white">
          <List size={18} />
          Anfragen ({requestsList.length})
        </TabsTrigger>
        <TabsTrigger value="phoneNumbers" className="flex items-center gap-2 data-[state=active]:bg-orange data-[state=active]:text-white">
          <Phone size={18} />
          Telefonnummer
        </TabsTrigger>
        <TabsTrigger value="supportTickets" className="flex items-center gap-2 data-[state=active]:bg-orange data-[state=active]:text-white">
          <MessageSquare size={18} />
          Support Tickets
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="requests" className="mt-0">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Admin Panel - Anfragen</h2>
          
          {selectedRequest && (
            <div className="mb-6 p-6 border-2 border-orange rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg">
              <h3 className="text-lg font-medium mb-3 text-orange-800">📨 SMS Code senden</h3>
              <p className="mb-3 text-gray-700">
                <strong>Anfrage ID:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{selectedRequest}</code>
              </p>
              <div className="flex space-x-3">
                <Input
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="SMS Code eingeben"
                  className="flex-1"
                  autoFocus
                />
                <Button 
                  onClick={submitSMS} 
                  className="bg-orange hover:bg-orange-dark transition-all"
                  disabled={!smsCode.trim()}
                >
                  ✅ Senden
                </Button>
                <Button 
                  onClick={handleCancelSMS}
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50 transition-all"
                >
                  ❌ Abbrechen
                </Button>
              </div>
            </div>
          )}
          
          {renderRequests()}
        </div>
      </TabsContent>
      
      <TabsContent value="phoneNumbers" className="mt-0">
        <PhoneNumberManager />
      </TabsContent>
      
      <TabsContent value="supportTickets" className="mt-0">
        <SupportTickets />
      </TabsContent>
    </Tabs>
  );
};

export default AdminPanel;
