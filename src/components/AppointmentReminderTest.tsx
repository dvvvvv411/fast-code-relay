
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Send, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  remindersSent: number;
  totalChecked: number;
  chatIds: number;
  germanTime: string;
  processedAppointments: Array<{
    appointmentId: string;
    status: string;
    minutesAway?: number;
    error?: string;
  }>;
  message: string;
}

const AppointmentReminderTest = () => {
  const [isTestingReminders, setIsTestingReminders] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const testReminderFunction = async () => {
    setIsTestingReminders(true);
    try {
      console.log('🧪 Testing appointment reminder function...');
      
      const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
        body: { test: true, triggered_by: 'manual_test' }
      });

      if (error) {
        console.error('❌ Error testing reminder function:', error);
        throw error;
      }

      console.log('✅ Reminder function test result:', data);
      setLastTestResult(data);

      toast({
        title: "Reminder Test Completed",
        description: `${data.remindersSent} reminders sent, ${data.totalChecked} appointments checked`,
      });
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test reminder function",
        variant: "destructive",
      });
    } finally {
      setIsTestingReminders(false);
    }
  };

  const testTelegramBot = async () => {
    setIsTestingTelegram(true);
    try {
      console.log('🧪 Testing Telegram bot...');
      
      const { data, error } = await supabase.functions.invoke('test-telegram-reminder');

      if (error) {
        console.error('❌ Error testing Telegram bot:', error);
        throw error;
      }

      console.log('✅ Telegram bot test result:', data);

      toast({
        title: "Telegram Test Completed",
        description: `Messages sent to ${data.successCount}/${data.totalChatIds} chat IDs`,
      });
    } catch (error: any) {
      console.error('❌ Telegram test failed:', error);
      toast({
        title: "Telegram Test Failed",
        description: error.message || "Failed to test Telegram bot",
        variant: "destructive",
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'not_in_window':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Erinnerung gesendet';
      case 'failed':
        return 'Senden fehlgeschlagen';
      case 'error':
        return 'Fehler';
      case 'not_in_window':
        return 'Außerhalb Zeitfenster';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Terminerinnerung Test & Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testReminderFunction}
            disabled={isTestingReminders}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            {isTestingReminders ? 'Teste Erinnerungen...' : 'Erinnerungen Testen'}
          </Button>
          
          <Button
            onClick={testTelegramBot}
            disabled={isTestingTelegram}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isTestingTelegram ? 'Teste Telegram...' : 'Telegram Testen'}
          </Button>
        </div>

        {lastTestResult && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastTestResult.remindersSent}
                </div>
                <div className="text-sm text-gray-500">Erinnerungen gesendet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lastTestResult.totalChecked}
                </div>
                <div className="text-sm text-gray-500">Termine geprüft</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {lastTestResult.chatIds}
                </div>
                <div className="text-sm text-gray-500">Chat IDs</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  {new Date(lastTestResult.germanTime).toLocaleString('de-DE')}
                </div>
                <div className="text-sm text-gray-500">Deutsche Zeit</div>
              </div>
            </div>

            {lastTestResult.processedAppointments && lastTestResult.processedAppointments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Verarbeitete Termine:</h4>
                <div className="space-y-1">
                  {lastTestResult.processedAppointments.map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(appointment.status)}
                        <span className="text-sm font-mono">
                          {appointment.appointmentId.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getStatusText(appointment.status)}
                        </Badge>
                        {appointment.minutesAway !== undefined && (
                          <span className="text-xs text-gray-500">
                            {appointment.minutesAway} Min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p><strong>Info:</strong> Das System prüft alle 5 Minuten automatisch nach Terminen und sendet Erinnerungen 30 Minuten vor dem Termin.</p>
          <p><strong>Zeitzone:</strong> Alle Zeiten werden in deutscher Zeit (CEST/CET) berechnet.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentReminderTest;
