
import { useState } from 'react';
import { useSMS } from '../context/SMSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AdminPanel = () => {
  const { requests, activateRequest, submitSMSCode } = useSMS();
  const [smsCode, setSmsCode] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  
  const handleActivate = (phone: string) => {
    activateRequest(phone);
  };
  
  const handleSendSMS = (phone: string) => {
    setSelectedPhone(phone);
  };
  
  const submitSMS = () => {
    if (selectedPhone && smsCode) {
      submitSMSCode(selectedPhone, smsCode);
      setSmsCode('');
      setSelectedPhone(null);
    }
  };
  
  const requestsList = Object.values(requests);
  
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Panel - Anfragen</h2>
      
      {selectedPhone && (
        <div className="mb-6 p-4 border border-orange rounded-lg bg-orange-50">
          <h3 className="text-lg font-medium mb-2">SMS Code senden</h3>
          <p className="mb-2">Telefon: {selectedPhone}</p>
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
      
      {requestsList.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Keine Anfragen vorhanden</p>
        </div>
      ) : (
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
                <tr key={request.phone}>
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
                        onClick={() => handleActivate(request.phone)}
                        size="sm"
                        className="bg-orange hover:bg-orange-dark"
                      >
                        Aktivieren
                      </Button>
                    )}
                    {request.status === 'sms_requested' && (
                      <Button 
                        onClick={() => handleSendSMS(request.phone)}
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
      )}
    </div>
  );
};

export default AdminPanel;
