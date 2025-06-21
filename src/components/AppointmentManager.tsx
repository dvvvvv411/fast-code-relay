
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AppointmentListView from './appointment/AppointmentListView';
import AppointmentDetailView from './appointment/AppointmentDetailView';
import { CalendarDays } from 'lucide-react';

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
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          recipient:appointment_recipients(
            id,
            first_name,
            last_name,
            email,
            phone_note
          )
        `)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = data?.map(appointment => ({
        ...appointment,
        recipient: appointment.recipient
      })) || [];

      setAppointments(transformedData);
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAppointments();
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );

      toast({
        title: "Status aktualisiert",
        description: "Der Terminstatus wurde erfolgreich geändert.",
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
      setAppointments(prev =>
        prev.map(apt => 
          apt.recipient?.id === recipientId 
            ? { 
                ...apt, 
                recipient: { 
                  ...apt.recipient, 
                  phone_note: phoneNote 
                } 
              }
            : apt
        )
      );

      toast({
        title: "Telefonnummer aktualisiert",
        description: "Die Telefonnummer wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error('Error updating phone note:', error);
      toast({
        title: "Fehler",
        description: "Telefonnummer konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleMissedEmailSend = async (appointment: Appointment) => {
    if (!appointment.recipient) return;

    try {
      const { error } = await supabase.functions.invoke('send-missed-appointment-email', {
        body: {
          appointmentId: appointment.id,
          recipientEmail: appointment.recipient.email,
          recipientFirstName: appointment.recipient.first_name,
          recipientLastName: appointment.recipient.last_name,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
        },
      });

      if (error) throw error;

      toast({
        title: "E-Mail gesendet",
        description: "Die E-Mail für den verpassten Termin wurde erfolgreich gesendet.",
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
    if (!appointment.recipient) return;

    try {
      const { error } = await supabase.functions.invoke('send-contract-request-email', {
        body: {
          appointmentId: appointment.id,
          recipientEmail: appointment.recipient.email,
          recipientFirstName: appointment.recipient.first_name,
          recipientLastName: appointment.recipient.last_name,
        },
      });

      if (error) throw error;

      toast({
        title: "Arbeitsvertrag-Anfrage gesendet",
        description: "Die E-Mail mit dem Arbeitsvertrag-Link wurde erfolgreich gesendet.",
      });
    } catch (error) {
      console.error('Error sending contract request email:', error);
      toast({
        title: "Fehler",
        description: "Arbeitsvertrag-Anfrage konnte nicht gesendet werden.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Terminverwaltung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Lade Termine...</div>
          </div>
        </CardContent>
      </Card>
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
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      onMissedEmailSend={handleMissedEmailSend}
      onContractRequestSend={handleContractRequestSend}
    />
  );
};

export default AppointmentManager;
