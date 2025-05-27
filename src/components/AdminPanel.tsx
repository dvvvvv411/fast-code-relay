
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PhoneNumberManager from './PhoneNumberManager';
import AuftraegeManager from './AuftraegeManager';
import RequestStatus from './RequestStatus';
import SupportTickets from './SupportTickets';
import EmailManager from './EmailManager';
import AppointmentManager from './AppointmentManager';
import FeedbackManager from './FeedbackManager';
import AdminNavbar from './AdminNavbar';
import { useSMS } from '@/context/SMSContext';
import { MessageSquare } from 'lucide-react';

const AdminPanel = () => {
  const { requests } = useSMS();
  const [activeTab, setActiveTab] = useState('requests');

  const requestsArray = Object.values(requests);
  const pendingCount = requestsArray.filter(r => r.status === 'pending').length;
  const completedCount = requestsArray.filter(r => r.status === 'completed').length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestStatus />;
      case 'phones':
        return <PhoneNumberManager />;
      case 'auftraege':
        return <AuftraegeManager />;
      case 'support':
        return <SupportTickets />;
      case 'mails':
        return <EmailManager />;
      case 'appointments':
        return <AppointmentManager />;
      case 'feedback':
        return <FeedbackManager />;
      default:
        return <RequestStatus />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
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

      {/* Navigation */}
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="space-y-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminPanel;
