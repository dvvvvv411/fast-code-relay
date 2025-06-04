
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PhoneNumberManager from './PhoneNumberManager';
import AuftraegeManager from './AuftraegeManager';
import AllRequestsList from './AllRequestsList';
import SupportTickets from './SupportTickets';
import EmailManager from './EmailManager';
import AppointmentManager from './AppointmentManager';
import FeedbackManager from './FeedbackManager';
import AdminNavbar from './AdminNavbar';
import { useSMS } from '@/context/SMSContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, TestTube, Bell } from 'lucide-react';

const AdminPanel = () => {
  const { requests } = useSMS();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('requests');
  const [isTestingReminders, setIsTestingReminders] = useState(false);

  const requestsArray = Object.values(requests);
  const pendingCount = requestsArray.filter(r => r.status === 'pending').length;
  const completedCount = requestsArray.filter(r => r.status === 'completed').length;

  const testReminderSystem = async () => {
    setIsTestingReminders(true);
    try {
      console.log('🧪 Testing reminder system...');
      
      const { data, error } = await supabase.functions.invoke('test-telegram-reminder');
      
      if (error) {
        console.error('❌ Test failed:', error);
        toast({
          title: "Test fehlgeschlagen",
          description: `Fehler beim Testen des Erinnerungssystems: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Test results:', data);
        
        if (data.summary?.allTestsPassed) {
          toast({
            title: "Test erfolgreich! ✅",
            description: `Alle Tests bestanden. Telegram funktioniert, Datenbank verbunden.`,
          });
        } else {
          const issues = [];
          if (!data.tests.telegram.success) issues.push("Telegram");
          if (!data.tests.database.success) issues.push("Datenbank");
          
          toast({
            title: "Test teilweise fehlgeschlagen ⚠️",
            description: `Probleme gefunden: ${issues.join(', ')}. Prüfen Sie die Logs.`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      toast({
        title: "Test Fehler",
        description: "Unerwarteter Fehler beim Testen des Systems.",
        variant: "destructive"
      });
    } finally {
      setIsTestingReminders(false);
    }
  };

  const sendTestReminder = async () => {
    setIsTestingReminders(true);
    try {
      console.log('📨 Sending test reminder...');
      
      const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
        body: { manual_test: true }
      });
      
      if (error) {
        console.error('❌ Reminder test failed:', error);
        toast({
          title: "Erinnerung fehlgeschlagen",
          description: `Fehler beim Senden der Erinnerung: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Reminder results:', data);
        toast({
          title: "Erinnerung gesendet! 📨",
          description: `${data.message || 'Erinnerungssystem ausgeführt'}`,
        });
      }
    } catch (error) {
      console.error('❌ Reminder error:', error);
      toast({
        title: "Erinnerung Fehler",
        description: "Unerwarteter Fehler beim Senden der Erinnerung.",
        variant: "destructive"
      });
    } finally {
      setIsTestingReminders(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <AllRequestsList />;
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
        return <AllRequestsList />;
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

      {/* Reminder System Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Terminerinnerung System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={testReminderSystem}
              disabled={isTestingReminders}
              className="flex items-center gap-2"
              variant="outline"
            >
              <TestTube className="h-4 w-4" />
              {isTestingReminders ? 'Teste...' : 'System Test'}
            </Button>
            <Button
              onClick={sendTestReminder}
              disabled={isTestingReminders}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isTestingReminders ? 'Sende...' : 'Erinnerung Jetzt Senden'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Verwenden Sie diese Buttons um das Telegram-Erinnerungssystem zu testen. 
            Der Cron-Job läuft automatisch alle 5 Minuten.
          </p>
        </CardContent>
      </Card>

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
