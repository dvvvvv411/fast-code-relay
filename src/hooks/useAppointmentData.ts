import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unique_token: string;
  email_sent: boolean;
  created_at: string;
  phone_note?: string;
}

interface Appointment {
  id: string;
  recipient_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  recipient?: Recipient;
}

interface NewRecipient {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

// Define valid status values that match the database constraint
const VALID_STATUSES = [
  'pending',
  'confirmed', 
  'cancelled',
  'interessiert',
  'abgelehnt',
  'mailbox',
  'infos_angefragt'
] as const;

type ValidStatus = typeof VALID_STATUSES[number];

export const useAppointmentData = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions for appointments');
    
    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('📊 Appointments real-time update:', payload);
          handleAppointmentRealTimeUpdate(payload);
        }
      )
      .subscribe();

    const recipientsChannel = supabase
      .channel('recipients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_recipients'
        },
        (payload) => {
          console.log('👥 Recipients real-time update:', payload);
          handleRecipientRealTimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(recipientsChannel);
    };
  }, []);

  const handleAppointmentRealTimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setAppointments(prev => {
      switch (eventType) {
        case 'INSERT':
          console.log('➕ New appointment added:', newRecord);
          toast({
            title: "Neuer Termin",
            description: "Ein neuer Termin wurde erstellt.",
          });
          return [...prev, newRecord];
          
        case 'UPDATE':
          console.log('✏️ Appointment updated:', newRecord);
          if (oldRecord.status !== newRecord.status) {
            toast({
              title: "Termin aktualisiert",  
              description: `Terminstatus wurde auf "${newRecord.status}" geändert.`,
            });
          }
          return prev.map(apt => apt.id === newRecord.id ? newRecord : apt);
          
        case 'DELETE':
          console.log('🗑️ Appointment deleted:', oldRecord);
          toast({
            title: "Termin gelöscht",
            description: "Ein Termin wurde gelöscht.",
          });
          return prev.filter(apt => apt.id !== oldRecord.id);
          
        default:
          return prev;
      }
    });
  };

  const handleRecipientRealTimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setRecipients(prev => {
      switch (eventType) {
        case 'INSERT':
          console.log('➕ New recipient added:', newRecord);
          return [...prev, newRecord];
          
        case 'UPDATE':
          console.log('✏️ Recipient updated:', newRecord);
          return prev.map(rec => rec.id === newRecord.id ? newRecord : rec);
          
        case 'DELETE':
          console.log('🗑️ Recipient deleted:', oldRecord);
          return prev.filter(rec => rec.id !== oldRecord.id);
          
        default:
          return prev;
      }
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadRecipients(),
        loadAppointments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    
    try {
      await loadData();
      toast({
        title: "Aktualisiert",
        description: "Alle Daten wurden erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadRecipients = async () => {
    const { data, error } = await supabase
      .from('appointment_recipients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setRecipients(data || []);
  };

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        recipient:appointment_recipients(*)
      `)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    setAppointments(data || []);
  };

  const generateUniqueToken = () => {
    return Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
  };

  const createRecipient = async (newRecipient: NewRecipient) => {
    if (!newRecipient.firstName || !newRecipient.lastName || !newRecipient.email) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointment_recipients')
        .insert({
          first_name: newRecipient.firstName,
          last_name: newRecipient.lastName,
          email: newRecipient.email,
          phone_note: newRecipient.phoneNumber || null,
          unique_token: generateUniqueToken()
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Empfänger wurde erfolgreich erstellt.",
      });

      loadRecipients();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Empfänger konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const deleteRecipient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointment_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Empfänger wurde gelöscht.",
      });

      loadRecipients();
      loadAppointments(); // Reload appointments as they might be affected
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Empfänger konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const validateStatus = (status: string): status is ValidStatus => {
    return VALID_STATUSES.includes(status as ValidStatus);
  };

  const handleAppointmentStatusChange = async (appointmentId: string, newStatus: string) => {
    console.log('🔄 useAppointmentData handleAppointmentStatusChange called:', {
      appointmentId,
      newStatus,
      isValidStatus: validateStatus(newStatus),
      validStatuses: VALID_STATUSES
    });

    // Validate the status before making the database call
    if (!validateStatus(newStatus)) {
      console.error('❌ Invalid status attempted:', newStatus, 'Valid statuses:', VALID_STATUSES);
      toast({
        title: "Fehler",
        description: `Ungültiger Status: "${newStatus}". Erlaubte Status: ${VALID_STATUSES.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📤 Making database update with validated status:', { appointmentId, newStatus });
      
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)
        .select();

      if (error) {
        console.error('❌ Database error:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Database update successful:', data);

      toast({
        title: "Erfolg",
        description: "Terminstatus wurde aktualisiert.",
      });

      loadAppointments();
    } catch (error: any) {
      console.error('❌ Error in useAppointmentData handleAppointmentStatusChange:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      toast({
        title: "Fehler",
        description: error.message || "Status konnte nicht aktualisiert werden.",
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

      // Update local state optimistically
      setRecipients(prev => 
        prev.map(recipient => 
          recipient.id === recipientId 
            ? { ...recipient, phone_note: phoneNote }
            : recipient
        )
      );

      // Update appointments state as well since they include recipient data
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.recipient?.id === recipientId 
            ? { 
                ...appointment, 
                recipient: { ...appointment.recipient, phone_note: phoneNote }
              }
            : appointment
        )
      );

      toast({
        title: "Erfolg",
        description: "Telefonnummer wurde aktualisiert.",
      });
    } catch (error: any) {
      console.error('Error updating phone note:', error);
      toast({
        title: "Fehler",
        description: error.message || "Telefonnummer konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSendEmail = async (recipient: Recipient) => {
    if (sendingEmails.has(recipient.id)) {
      return;
    }

    setSendingEmails(prev => new Set(prev).add(recipient.id));

    try {
      const { data, error } = await supabase.functions.invoke('send-appointment-email', {
        body: {
          recipientId: recipient.id
        }
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: `E-Mail wurde erfolgreich an ${recipient.first_name} ${recipient.last_name} gesendet.`,
      });

      loadRecipients();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Fehler",
        description: error.message || "E-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipient.id);
        return newSet;
      });
    }
  };

  const handleSendMissedAppointmentEmail = async (appointment: Appointment) => {
    if (!appointment.recipient) {
      toast({
        title: "Fehler",
        description: "Empfänger-Informationen nicht verfügbar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-missed-appointment-email', {
        body: {
          appointmentId: appointment.id
        }
      });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: `E-Mail für verpassten Termin wurde erfolgreich an ${appointment.recipient.first_name} ${appointment.recipient.last_name} gesendet.`,
      });
    } catch (error: any) {
      console.error('Error sending missed appointment email:', error);
      toast({
        title: "Fehler",
        description: error.message || "E-Mail für verpassten Termin konnte nicht gesendet werden.",
        variant: "destructive",
      });
    }
  };

  return {
    recipients,
    appointments,
    isLoading,
    isRefreshing,
    sendingEmails,
    loadData,
    loadRecipients,
    loadAppointments,
    handleRefresh,
    createRecipient,
    deleteRecipient,
    handleAppointmentStatusChange,
    handlePhoneNoteUpdate,
    handleSendEmail,
    handleSendMissedAppointmentEmail
  };
};
