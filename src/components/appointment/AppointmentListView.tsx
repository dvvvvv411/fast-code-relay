import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Eye, 
  RefreshCw, 
  Edit,
  Save,
  X,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentListViewProps {
  appointments: any[];
  onAppointmentSelect: (appointment: any) => void;
  onStatusChange: (appointmentId: string, newStatus: string) => void;
  onPhoneNoteUpdate: (recipientId: string, phoneNote: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onMissedEmailSend: (appointment: any) => void;
}

const AppointmentListView = ({
  appointments,
  onAppointmentSelect,
  onStatusChange,
  onPhoneNoteUpdate,
  onRefresh,
  isRefreshing,
  onMissedEmailSend
}: AppointmentListViewProps) => {
  const [editingPhoneNote, setEditingPhoneNote] = useState<string | null>(null);
  const [tempPhoneNote, setTempPhoneNote] = useState('');
  const [sendingContractEmails, setSendingContractEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { label: 'Ausstehend', variant: 'secondary' as const },
      'confirmed': { label: 'Bestätigt', variant: 'default' as const },
      'completed': { label: 'Abgeschlossen', variant: 'default' as const },
      'cancelled': { label: 'Abgesagt', variant: 'destructive' as const },
      'missed': { label: 'Verpasst', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const handlePhoneEdit = (recipientId: string, currentNote: string) => {
    setEditingPhoneNote(recipientId);
    setTempPhoneNote(currentNote || '');
  };

  const handlePhoneSave = async (recipientId: string) => {
    try {
      await onPhoneNoteUpdate(recipientId, tempPhoneNote);
      setEditingPhoneNote(null);
      setTempPhoneNote('');
    } catch (error) {
      console.error('Error updating phone note:', error);
    }
  };

  const handlePhoneCancel = () => {
    setEditingPhoneNote(null);
    setTempPhoneNote('');
  };

  const handleSendContractEmail = async (appointment: any) => {
    if (sendingContractEmails.has(appointment.id)) {
      return;
    }

    setSendingContractEmails(prev => new Set(prev).add(appointment.id));

    try {
      const { data, error } = await supabase.functions.invoke('send-contract-request-email', {
        body: {
          appointmentId: appointment.id
        }
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: `Arbeitsvertrag-E-Mail wurde erfolgreich an ${appointment.recipient?.first_name} ${appointment.recipient?.last_name} gesendet.`,
      });
    } catch (error: any) {
      console.error('Error sending contract email:', error);
      toast({
        title: "Fehler",
        description: error.message || "E-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setSendingContractEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointment.id);
        return newSet;
      });
    }
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Termine gefunden.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange" />
                <div>
                  <CardTitle className="text-lg">
                    {formatDate(appointment.appointment_date)}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formatTime(appointment.appointment_time)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(appointment.status)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Recipient Information */}
            {appointment.recipient && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Bewerber-Informationen</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAppointmentSelect(appointment)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {appointment.recipient.first_name} {appointment.recipient.last_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{appointment.recipient.email}</span>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      {editingPhoneNote === appointment.recipient.id ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <Input
                            value={tempPhoneNote}
                            onChange={(e) => setTempPhoneNote(e.target.value)}
                            placeholder="Telefonnummer eingeben..."
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePhoneSave(appointment.recipient.id)}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePhoneCancel}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-sm">
                            {appointment.recipient.phone_note || 'Keine Telefonnummer'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePhoneEdit(appointment.recipient.id, appointment.recipient.phone_note)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div>
                  <Label htmlFor={`status-${appointment.id}`} className="text-sm font-medium">
                    Status ändern:
                  </Label>
                  <Select
                    value={appointment.status}
                    onValueChange={(value) => onStatusChange(appointment.id, value)}
                  >
                    <SelectTrigger className="w-40 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ausstehend</SelectItem>
                      <SelectItem value="confirmed">Bestätigt</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                      <SelectItem value="cancelled">Abgesagt</SelectItem>
                      <SelectItem value="missed">Verpasst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {appointment.status === 'missed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMissedEmailSend(appointment)}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Verpasst-E-Mail
                  </Button>
                )}
                
                {(appointment.status === 'confirmed' || appointment.status === 'completed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendContractEmail(appointment)}
                    disabled={sendingContractEmails.has(appointment.id)}
                    className="flex items-center gap-2"
                  >
                    {sendingContractEmails.has(appointment.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Arbeitsvertrag Infos
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AppointmentListView;
