
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PhoneNumberManager from './PhoneNumberManager';
import AuftraegeManager from './AuftraegeManager';
import RequestStatus from './RequestStatus';
import SupportTickets from './SupportTickets';
import EmailManager from './EmailManager';
import AppointmentManager from './AppointmentManager';
import FeedbackManager from './FeedbackManager';
import { useSMS } from '@/context/SMSContext';
import { Phone, Briefcase, MessageSquare, Headphones, Mail, Calendar, Star } from 'lucide-react';

const AdminPanel = () => {
  const { requests } = useSMS();
  const [activeTab, setActiveTab] = useState('requests');

  const requestsArray = Object.values(requests);
  const pendingCount = requestsArray.filter(r => r.status === 'pending').length;
  const completedCount = requestsArray.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamte Anfragen</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestsArray.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Badge variant="secondary">{pendingCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
            <Badge variant="default">{completedCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erfolgsrate</CardTitle>
            <Badge variant="outline">
              {requestsArray.length > 0 ? Math.round((completedCount / requestsArray.length) * 100) : 0}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requestsArray.length > 0 ? Math.round((completedCount / requestsArray.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="phones" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Nummern
          </TabsTrigger>
          <TabsTrigger value="auftraege" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Aufträge
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            Support
          </TabsTrigger>
          <TabsTrigger value="mails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Mails
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Termine
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Bewertungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <RequestStatus />
        </TabsContent>

        <TabsContent value="phones" className="space-y-4">
          <PhoneNumberManager />
        </TabsContent>

        <TabsContent value="auftraege" className="space-y-4">
          <AuftraegeManager />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <SupportTickets />
        </TabsContent>

        <TabsContent value="mails" className="space-y-4">
          <EmailManager />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentManager />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
