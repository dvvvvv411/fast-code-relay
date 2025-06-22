
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppointmentListView from './appointment/AppointmentListView';
import AppointmentDetailView from './appointment/AppointmentDetailView';
import { Loader2 } from 'lucide-react';

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

const AppointmentManager = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingContractRequest, setSendingContractRequest] = useState(false);
  const { toast } = useToast();

  const fetchAppointments = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          recipient:appointment_recipients(*)
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Fehler",
        description: "Termine konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(prev => prev.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status: newStatus }
          : appointment
      ));

      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Status aktualisiert",
        description: `Terminstatus wurde geändert.`,
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handlePhoneNoteUpdate = async (recipientId: string, phoneNote: string) => {
    try {
      const { error } = await supabase
        .from('appointment_recipients')
        .update({ phone_note: phoneNote })
        .eq('id', recipientId);

      if (error) throw error;

      // Update local state
      setAppointments(prev => prev.map(appointment => 
        appointment.recipient?.id === recipientId 
          ? { 
              ...appointment, 
              recipient: { ...appointment.recipient, phone_note: phoneNote }
            }
          : appointment
      ));

      if (selectedAppointment?.recipient?.id === recipientId) {
        setSelectedAppointment(prev => prev ? {
          ...prev,
          recipient: prev.recipient ? { ...prev.recipient, phone_note: phoneNote } : prev.recipient
        } : null);
      }

      toast({
        title: "Telefonnummer aktualisiert",
        description: "Die Telefonnummer wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error('Error updating phone note:', error);
      throw error;
    }
  };

  const handleMissedEmailSend = async (appointment: Appointment) => {
    if (!appointment.recipient) {
      toast({
        title: "Fehler",
        description: "Empfänger-Informationen nicht verfügbar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-missed-appointment-email', {
        body: {
          appointmentId: appointment.id,
          recipientEmail: appointment.recipient.email,
          recipientName: `${appointment.recipient.first_name} ${appointment.recipient.last_name}`,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time
        }
      });

      if (error) throw error;

      toast({
        title: "E-Mail gesendet",
        description: "E-Mail für verpassten Termin wurde erfolgreich versendet.",
      });
    } catch (error) {
      console.error('Error sending missed appointment email:', error);
      toast({
        title: "Fehler",
        description: "E-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      });
    }
  };

  const handleContractRequestSend = async (appointment: Appointment) => {
    if (!appointment.recipient) {
      toast({
        title: "Fehler",
        description: "Empfänger-Informationen nicht verfügbar.",
        variant: "destructive",
      });
      return;
    }

    setSendingContractRequest(true);

    try {
      const { error } = await supabase.functions.invoke('send-contract-request-email', {
        body: {
          appointmentId: appointment.id,
          recipientEmail: appointment.recipient.email,
          recipientName: `${appointment.recipient.first_name} ${appointment.recipient.last_name}`
        }
      });

      if (error) throw error;

      toast({
        title: "Arbeitsvertrag angefordert",
        description: "E-Mail für Arbeitsvertrag wurde erfolgreich versendet.",
      });
    } catch (error) {
      console.error('Error sending contract request email:', error);
      toast({
        title: "Fehler",
        description: "E-Mail für Arbeitsvertrag konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setSendingContractRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange" />
      </div>
    );
  }

  if (selectedAppointment) {
    return (
      <AppointmentDetailView
        appointment={selectedAppointment}
        onBack={() => setSelectedAppointment(null)}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <AppointmentListView
      appointments={appointments}
      onAppointmentSelect={setSelectedAppointment}
      onStatusChange={handleStatusChange}
      onPhoneNoteUpdate={handlePhoneNoteUpdate}
      onRefresh={() => fetchAppointments(false)}
      isRefreshing={isRefreshing}
      onMissedEmailSend={handleMissedEmailSend}
      onContractRequestSend={handleContractRequestSend}
    />
  );
};

export default AppointmentManager;
