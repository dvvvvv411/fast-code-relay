
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PhoneNumberManager from './PhoneNumberManager';
import SupportTickets from './SupportTickets';
import AuftraegeManager from './AuftraegeManager';
import SMSRequests from './SMSRequests';
import { useSMS } from '@/context/SMSContext';

const AdminPanel = () => {
  const { requests } = useSMS();
  const requestsArray = Object.values(requests);
  
  // Count different types of requests
  const pendingSMSCount = requestsArray.filter(req => req.status === 'pending').length;
  const activatedCount = requestsArray.filter(req => req.status === 'activated').length;
  const smsRequestedCount = requestsArray.filter(req => req.status === 'sms_requested').length;
  const smsSentCount = requestsArray.filter(req => req.status === 'sms_sent').length;
  const waitingForAdditionalCount = requestsArray.filter(req => req.status === 'waiting_for_additional_sms').length;
  const completedCount = requestsArray.filter(req => req.status === 'completed').length;
  
  const totalActiveRequests = pendingSMSCount + activatedCount + smsRequestedCount + smsSentCount + waitingForAdditionalCount;

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Anfragen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveRequests}</div>
            <p className="text-xs text-muted-foreground">
              Ausstehend & In Bearbeitung
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Anfragen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSMSCount}</div>
            <p className="text-xs text-muted-foreground">
              Warten auf Aktivierung
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS angefordert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsRequestedCount + smsSentCount + waitingForAdditionalCount}</div>
            <p className="text-xs text-muted-foreground">
              Warten auf SMS Code
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Erfolgreich beendet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="sms-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sms-requests">SMS Anfragen</TabsTrigger>
          <TabsTrigger value="numbers">Telefonnummern</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="auftraege">Aufträge</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sms-requests" className="space-y-4">
          <SMSRequests />
        </TabsContent>
        
        <TabsContent value="numbers" className="space-y-4">
          <PhoneNumberManager />
        </TabsContent>
        
        <TabsContent value="support" className="space-y-4">
          <SupportTickets />
        </TabsContent>
        
        <TabsContent value="auftraege" className="space-y-4">
          <AuftraegeManager />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Systemeinstellungen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Weitere Einstellungen werden hier in Zukunft verfügbar sein.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
