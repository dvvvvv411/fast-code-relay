
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PhoneNumberManager from './PhoneNumberManager';
import SupportTickets from './SupportTickets';
import AuftraegeManager from './AuftraegeManager';
import { useSMS } from '@/context/SMSContext';

const AdminPanel = () => {
  const { requests } = useSMS();
  const requestsArray = Object.values(requests);
  
  const pendingCount = requestsArray.filter(req => req.status === 'pending').length;
  const inProgressCount = requestsArray.filter(req => req.status === 'in_progress').length;
  const completedCount = requestsArray.filter(req => req.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehende Anfragen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="numbers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="numbers">Telefonnummern</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="auftraege">Aufträge</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>
        
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
