import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Trash2, Clock, Users, Ban, Upload, List, Grid3X3, Send, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RecipientImport from './RecipientImport';
import AppointmentCalendarView from './appointment/AppointmentCalendarView';
import AppointmentListView from './appointment/AppointmentListView';
import AppointmentDetailView from './appointment/AppointmentDetailView';

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

interface BlockedTime {
  id: string;
  block_date: string;
  block_time: string;
  reason: string | null;
  created_at: string;
}

const AppointmentManager = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'recipients'>('overview');
  const [overviewMode, setOverviewMode] = useState<'calendar' | 'list'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // New recipient form
  const [newRecipient, setNewRecipient] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Add state for import panel visibility
  const [showImportPanel, setShowImportPanel] = useState(false);

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
        loadAppointments(),
        loadBlockedTimes()
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

  const loadBlockedTimes = async () => {
    const { data, error } = await supabase
      .from('blocked_times')
      .select('*')
      .order('block_date', { ascending: true });

    if (error) throw error;
    setBlockedTimes(data || []);
  };

  const generateUniqueToken = () => {
    return Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
  };

  const createRecipient = async () => {
    if (!newRecipient.firstName || !newRecipient.lastName || !newRecipient.email) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
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
          unique_token: generateUniqueToken()
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Empfänger wurde erfolgreich erstellt.",
      });

      setNewRecipient({ firstName: '', lastName: '', email: '' });
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

  const handleAppointmentStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Terminstatus wurde aktualisiert.",
      });

      loadAppointments();
      setSelectedAppointment(null);
    } catch (error: any) {
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

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
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
    } finally {
      setSendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipient.id);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
          <p className="mt-2 text-gray-500">Lade Terminverwaltung...</p>
        </div>
      </div>
    );
  }

  // If viewing appointment details
  if (selectedAppointment) {
    return (
      <AppointmentDetailView
        appointment={selectedAppointment}
        onBack={() => setSelectedAppointment(null)}
        onStatusChange={handleAppointmentStatusChange}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
            activeTab === 'overview' 
              ? "bg-white text-orange shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Grid3X3 className="h-4 w-4" />
          Übersicht ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('recipients')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
            activeTab === 'recipients' 
              ? "bg-white text-orange shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Users className="h-4 w-4" />
          Empfänger ({recipients.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Terminübersicht</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Wird aktualisiert..." : "Aktualisieren"}
              </Button>
              <Button
                variant={overviewMode === 'list' ? "default" : "outline"}
                onClick={() => setOverviewMode('list')}
                className={overviewMode === 'list' ? "bg-orange hover:bg-orange/90" : ""}
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
              <Button
                variant={overviewMode === 'calendar' ? "default" : "outline"}
                onClick={() => setOverviewMode('calendar')}
                className={overviewMode === 'calendar' ? "bg-orange hover:bg-orange/90" : ""}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Kalender
              </Button>
            </div>
          </div>

          {/* Overview Content */}
          {overviewMode === 'calendar' ? (
            <AppointmentCalendarView
              appointments={appointments}
              onAppointmentSelect={handleAppointmentSelect}
            />
          ) : (
            <AppointmentListView
              appointments={appointments}
              onAppointmentSelect={handleAppointmentSelect}
              onStatusChange={handleAppointmentStatusChange}
              onPhoneNoteUpdate={handlePhoneNoteUpdate}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          )}
        </div>
      )}

      {/* Recipients Tab */}
      {activeTab === 'recipients' && (
        <div className="space-y-6">
          {/* Import/Manual toggle */}
          <div className="flex space-x-2">
            <Button
              variant={!showImportPanel ? "default" : "outline"}
              onClick={() => setShowImportPanel(false)}
              className={!showImportPanel ? "bg-orange hover:bg-orange/90" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Manuell hinzufügen
            </Button>
            <Button
              variant={showImportPanel ? "default" : "outline"}
              onClick={() => setShowImportPanel(true)}
              className={showImportPanel ? "bg-orange hover:bg-orange/90" : ""}
            >
              <Upload className="h-4 w-4 mr-2" />
              TXT-Import
            </Button>
          </div>

          {/* Import Panel */}
          {showImportPanel ? (
            <RecipientImport onImportComplete={loadRecipients} />
          ) : (
            // Manual Entry Panel
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Neuen Empfänger hinzufügen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={newRecipient.firstName}
                      onChange={(e) => setNewRecipient(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Vorname eingeben"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      value={newRecipient.lastName}
                      onChange={(e) => setNewRecipient(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Nachname eingeben"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newRecipient.email}
                      onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="E-Mail eingeben"
                    />
                  </div>
                </div>
                <Button onClick={createRecipient} className="bg-orange hover:bg-orange/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Empfänger erstellen
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Empfänger verwalten</CardTitle>
            </CardHeader>
            <CardContent>
              {recipients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine Empfänger vorhanden.</p>
              ) : (
                <div className="space-y-3">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{recipient.first_name} {recipient.last_name}</p>
                        <p className="text-sm text-gray-500">{recipient.email}</p>
                        <p className="text-xs text-gray-400">Token: {recipient.unique_token}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={recipient.email_sent ? "default" : "secondary"}>
                          {recipient.email_sent ? "E-Mail gesendet" : "E-Mail ausstehend"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendEmail(recipient)}
                          disabled={sendingEmails.has(recipient.id)}
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {sendingEmails.has(recipient.id) ? "Wird gesendet..." : "E-Mail versenden"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRecipient(recipient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AppointmentManager;
