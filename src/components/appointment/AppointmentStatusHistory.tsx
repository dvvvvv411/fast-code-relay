
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, History } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  created_at: string;
}

interface AppointmentStatusHistoryProps {
  appointmentId: string;
}

const AppointmentStatusHistory = ({ appointmentId }: AppointmentStatusHistoryProps) => {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatusHistory();
  }, [appointmentId]);

  const loadStatusHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_status_history')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading status history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bestätigt';
      case 'cancelled':
        return 'Abgesagt';
      case 'interessiert':
        return 'Interessiert';
      case 'abgelehnt':
        return 'Abgelehnt';
      case 'mailbox':
        return 'Mailbox';
      case 'pending':
        return 'Ausstehend';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'interessiert':
        return 'bg-blue-500';
      case 'abgelehnt':
        return 'bg-red-400';
      case 'mailbox':
        return 'bg-yellow-600';
      default:
        return 'bg-yellow-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Status-Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Status-Verlauf
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Kein Status-Verlauf verfügbar.</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  index === 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {entry.old_status && (
                        <>
                          <Badge 
                            variant="outline" 
                            className={cn("text-white text-xs", getStatusColor(entry.old_status))}
                          >
                            {getStatusText(entry.old_status)}
                          </Badge>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn("text-white text-xs", getStatusColor(entry.new_status))}
                      >
                        {getStatusText(entry.new_status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(new Date(entry.changed_at), 'PPp', { locale: de })}
                    </p>
                  </div>
                </div>
                {index === 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Aktuell
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentStatusHistory;
