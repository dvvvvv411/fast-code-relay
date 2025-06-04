
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Calendar, Mail, Phone, FileText, TestTube, Settings } from 'lucide-react';
import UserForm from './UserForm';
import AllRequestsList from './AllRequestsList';
import AppointmentManager from './AppointmentManager';
import EmailManager from './EmailManager';
import PhoneNumberManager from './PhoneNumberManager';
import AuftraegeManager from './AuftraegeManager';
import FeedbackManager from './FeedbackManager';
import SupportTickets from './SupportTickets';
import AppointmentReminderTest from './AppointmentReminderTest';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
          <TabsTrigger value="requests" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Anfragen</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Termine</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-1">
            <TestTube className="h-4 w-4" />
            <span className="hidden sm:inline">Erinnerungen</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">E-Mails</span>
          </TabsTrigger>
          <TabsTrigger value="phones" className="flex items-center gap-1">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Telefon</span>
          </TabsTrigger>
          <TabsTrigger value="auftraege" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Aufträge</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">User</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <AllRequestsList />
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentManager />
        </TabsContent>

        <TabsContent value="reminders" className="mt-6">
          <AppointmentReminderTest />
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <EmailManager />
        </TabsContent>

        <TabsContent value="phones" className="mt-6">
          <PhoneNumberManager />
        </TabsContent>

        <TabsContent value="auftraege" className="mt-6">
          <AuftraegeManager />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackManager />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <SupportTickets />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
