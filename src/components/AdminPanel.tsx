
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSMS } from '../context/SMSContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneNumberManager from './PhoneNumberManager';
import { List, Phone, MessageSquare, Loader, AlertTriangle } from 'lucide-react';
import SupportTickets from './SupportTickets';
import { Skeleton } from '@/components/ui/skeleton';

const AdminPanel = () => {
  const { requests, activateRequest, submitSMSCode, isLoading } = useSMS();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [smsCode, setSmsCode] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  
  const handleActivate = (requestId: string) => {
    activateRequest(requestId);
  };
  
  const handleSendSMS = (requestId: string) => {
    setSelectedRequest(requestId);
  };
  
  const submitSMS = () => {
    if (selectedRequest && smsCode) {
      submitSMSCode(selectedRequest, smsCode);
      setSmsCode('');
      setSelectedRequest(null);
    }
  };
  
  const requestsList = Object.values(requests);
  
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
                Aktion
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requestsList.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{request.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{request.accessCode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'activated' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'sms_requested' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {request.status === 'pending' ? 'In Bearbeitung' :
                     request.status === 'activated' ? 'Aktiviert' :
                     request.status === 'sms_requested' ? 'SMS Code benötigt' :
                     'Abgeschlossen'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {request.status === 'pending' && (
                    <Button 
                      onClick={() => handleActivate(request.id)}
                      size="sm"
                      className="bg-orange hover:bg-orange-dark"
                    >
                      Aktivieren
                    </Button>
                  )}
                  {request.status === 'sms_requested' && (
                    <Button 
                      onClick={() => handleSendSMS(request.id)}
                      size="sm" 
                      className="bg-orange hover:bg-orange-dark"
                    >
                      SMS Code eingeben
                    </Button>
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
          Anfragen
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
            <div className="mb-6 p-4 border border-orange rounded-lg bg-orange-50">
              <h3 className="text-lg font-medium mb-2">SMS Code senden</h3>
              <p className="mb-2">Anfrage ID: {selectedRequest}</p>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="SMS Code eingeben"
                />
                <Button onClick={submitSMS} className="bg-orange hover:bg-orange-dark">
                  Senden
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
