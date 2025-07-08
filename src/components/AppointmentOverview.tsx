import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, Plus, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AppointmentListView from './appointment/AppointmentListView';
import AppointmentDetailView from './appointment/AppointmentDetailView';
import AppointmentEmailPreviewDialog from './appointment/AppointmentEmailPreviewDialog';
import MissedAppointmentEmailTemplate from './appointment/MissedAppointmentEmailTemplate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  recipient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_note?: string;
  };
}

const AppointmentOverview = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showMissedEmailPreview, setShowMissedEmailPreview] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingContractEmails, setSendingContractEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_recipients (
            id,
            first_name,
            last_name,
            email,
            phone_note
          )
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;

      const formattedAppointments = data.map(appointment => ({
        ...appointment,
        recipient: appointment.appointment_recipients
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Fehler beim Laden der Termine');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Status erfolgreich aktualisiert');
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const handlePhoneNoteUpdate = async (recipientId: string, phoneNote: string) => {
    try {
      const { error } = await supabase
        .from('appointment_recipients')
        .update({ phone_note: phoneNote })
        .eq('id', recipientId);

      if (error) throw error;

      toast.success('Telefonnummer erfolgreich aktualisiert');
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating phone note:', error);
      toast.error('Fehler beim Aktualisieren der Telefonnummer');
    }
  };

  const handleMissedEmailSend = async (appointment: Appointment) => {
    if (!appointment.recipient) return;

    setSelectedAppointment(appointment);
    setSelectedRecipient(appointment.recipient);
    setShowMissedEmailPreview(true);
  };

  const handleContractInfoSend = async (appointment: Appointment) => {
    if (!appointment.recipient) return;

    // Add appointment ID to loading set
    setSendingContractEmails(prev => new Set(prev).add(appointment.id));

    try {
      console.log('🚀 Starting contract info send process for appointment:', appointment.id);
      
      // Generate a secure token for the contract form
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_secure_token');

      if (tokenError) throw tokenError;

      console.log('🔑 Generated secure token:', tokenData);

      // Insert the token into contract_request_tokens table
      const { error: insertError } = await supabase
        .from('contract_request_tokens')
        .insert({
          appointment_id: appointment.id,
          token: tokenData,
          email_sent: false
        });

      if (insertError) throw insertError;

      console.log('💾 Token saved to database');

      // Send the contract email directly
      const { error: emailError } = await supabase.functions.invoke('send-contract-email', {
        body: {
          appointment: appointment,
          recipient: appointment.recipient,
          contractToken: tokenData
        }
      });

      if (emailError) throw emailError;

      console.log('📧 Contract email sent successfully');

      // Mark token as email sent and update appointment status to 'infos_angefragt'
      const [tokenUpdateResult, statusUpdateResult] = await Promise.all([
        supabase
          .from('contract_request_tokens')
          .update({ email_sent: true })
          .eq('token', tokenData),
        supabase
          .from('appointments')
          .update({ status: 'infos_angefragt' })
          .eq('id', appointment.id)
      ]);

      if (tokenUpdateResult.error) {
        console.error('❌ Error updating token:', tokenUpdateResult.error);
        throw tokenUpdateResult.error;
      }

      if (statusUpdateResult.error) {
        console.error('❌ Error updating appointment status:', statusUpdateResult.error);
        throw statusUpdateResult.error;
      }

      console.log('✅ Status updated to infos_angefragt successfully');

      toast.success(`Arbeitsvertrag-E-Mail erfolgreich an ${appointment.recipient.first_name} ${appointment.recipient.last_name} gesendet`);
      
      // Refresh appointments to show updated status
      await fetchAppointments();
    } catch (error) {
      console.error('❌ Error sending contract email:', error);
      toast.error('Fehler beim Senden der Arbeitsvertrag-E-Mail');
    } finally {
      // Remove appointment ID from loading set
      setSendingContractEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointment.id);
        return newSet;
      });
    }
  };

  const sendMissedAppointmentEmail = async () => {
    if (!selectedAppointment) return;

    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-missed-appointment-email', {
        body: {
          appointmentId: selectedAppointment.id
        }
      });

      if (error) throw error;

      toast.success('E-Mail für verpassten Termin erfolgreich gesendet');
      setShowMissedEmailPreview(false);
    } catch (error) {
      console.error('Error sending missed appointment email:', error);
      toast.error('Fehler beim Senden der E-Mail');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (selectedAppointment) {
    return (
      <>
        <AppointmentDetailView 
          appointment={selectedAppointment} 
          onBack={() => setSelectedAppointment(null)}
          onStatusChange={handleStatusChange}
        />
        
        <AppointmentEmailPreviewDialog
          isOpen={showEmailPreview}
          onClose={() => setShowEmailPreview(false)}
          recipient={selectedRecipient}
        />

        <Dialog open={showMissedEmailPreview} onOpenChange={setShowMissedEmailPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>E-Mail Vorschau - Verpasster Termin</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] w-full">
              <div className="p-4">
                {selectedAppointment && selectedRecipient && (
                  <MissedAppointmentEmailTemplate
                    recipientFirstName={selectedRecipient.first_name}
                    recipientLastName={selectedRecipient.last_name}
                    recipient={selectedRecipient}
                    appointment={selectedAppointment}
                  />
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowMissedEmailPreview(false)}
                disabled={sendingEmail}
              >
                Abbrechen
              </Button>
              <Button 
                onClick={sendMissedAppointmentEmail}
                disabled={sendingEmail}
                className="bg-orange hover:bg-orange/90"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    E-Mail senden
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Termine Übersicht</h2>
        </div>
      </div>

      <AppointmentListView
        appointments={appointments}
        onAppointmentSelect={setSelectedAppointment}
        onStatusChange={handleStatusChange}
        onPhoneNoteUpdate={handlePhoneNoteUpdate}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        onMissedEmailSend={handleMissedEmailSend}
        onContractInfoSend={handleContractInfoSend}
        sendingContractEmails={sendingContractEmails}
      />
    </div>
  );
};

export default AppointmentOverview;
