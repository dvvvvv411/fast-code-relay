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
import { CalendarIcon, Plus, Trash2, Clock, Users, Ban, Upload, List, Grid3X3, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RecipientImport from './RecipientImport';
import AppointmentCalendarView from './appointment/AppointmentCalendarView';
import AppointmentListView from './appointment/AppointmentListView';
import AppointmentDetailView from './appointment/AppointmentDetailView';
import AppointmentEmailPreviewDialog from './appointment/AppointmentEmailPreviewDialog';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unique_token: string;
  email_sent: boolean;
  created_at: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'recipients' | 'appointments' | 'blocked'>('overview');
  const [overviewMode, setOverviewMode] = useState<'calendar' | 'list'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [selectedRecipientForPreview, setSelectedRecipientForPreview] = useState<Recipient | null>(null);
  const { toast } = useToast();

  // New recipient form
  const [newRecipient, setNewRecipient] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // New appointment form
  const [newAppointment, setNewAppointment] = useState({
    recipientId: '',
    date: undefined as Date | undefined,
    time: ''
  });

  // New blocked time form
  const [newBlockedTime, setNewBlockedTime] = useState({
    date: undefined as Date | undefined,
    time: '',
    reason: ''
  });

  // Add state for import panel visibility
  const [showImportPanel, setShowImportPanel] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const createAppointment = async () => {
    if (!newAppointment.recipientId || !newAppointment.date || !newAppointment.time) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          recipient_id: newAppointment.recipientId,
          appointment_date: format(newAppointment.date, 'yyyy-MM-dd'),
          appointment_time: newAppointment.time
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Termin wurde erfolgreich erstellt.",
      });

      setNewAppointment({ recipientId: '', date: undefined, time: '' });
      loadAppointments();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Termin konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const createBlockedTime = async () => {
    if (!newBlockedTime.date || !newBlockedTime.time) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie Datum und Uhrzeit aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('blocked_times')
        .insert({
          block_date: format(newBlockedTime.date, 'yyyy-MM-dd'),
          block_time: newBlockedTime.time,
          reason: newBlockedTime.reason || null
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Zeit wurde erfolgreich gesperrt.",
      });

      setNewBlockedTime({ date: undefined, time: '', reason: '' });
      loadBlockedTimes();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Zeit konnte nicht gesperrt werden.",
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

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Termin wurde gelöscht.",
      });

      loadAppointments();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Termin konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const deleteBlockedTime = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Gesperrte Zeit wurde entfernt.",
      });

      loadBlockedTimes();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Gesperrte Zeit konnte nicht entfernt werden.",
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

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleEmailPreview = (recipient: Recipient) => {
    setSelectedRecipientForPreview(recipient);
    setEmailPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">Bestätigt</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Abgesagt</Badge>;
      default:
        return <Badge variant="secondary">Ausstehend</Badge>;
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

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
        <button
          onClick={() => setActiveTab('appointments')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
            activeTab === 'appointments' 
              ? "bg-white text-orange shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Clock className="h-4 w-4" />
          Termine ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
            activeTab === 'blocked' 
              ? "bg-white text-orange shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Ban className="h-4 w-4" />
          Gesperrt ({blockedTimes.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Terminübersicht</h2>
            <div className="flex space-x-2">
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
                          onClick={() => handleEmailPreview(recipient)}
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          E-Mail Vorschau
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

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Neuen Termin erstellen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="recipient">Empfänger</Label>
                  <Select value={newAppointment.recipientId} onValueChange={(value) => 
                    setNewAppointment(prev => ({ ...prev, recipientId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Empfänger auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          {recipient.first_name} {recipient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Datum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newAppointment.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newAppointment.date ? format(newAppointment.date, "PPP", { locale: de }) : "Datum auswählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newAppointment.date}
                        onSelect={(date) => setNewAppointment(prev => ({ ...prev, date }))}
                        initialFocus
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="time">Uhrzeit</Label>
                  <Select value={newAppointment.time} onValueChange={(value) => 
                    setNewAppointment(prev => ({ ...prev, time: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Uhrzeit auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createAppointment} className="bg-orange hover:bg-orange/90">
                <Plus className="h-4 w-4 mr-2" />
                Termin erstellen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termine verwalten</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine Termine vorhanden.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {appointment.recipient?.first_name} {appointment.recipient?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.appointment_date), "PPP", { locale: de })} um {appointment.appointment_time}
                        </p>
                        <p className="text-xs text-gray-400">
                          Erstellt: {format(new Date(appointment.created_at), "PPP", { locale: de })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAppointment(appointment.id)}
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

      {/* Blocked Times Tab */}
      {activeTab === 'blocked' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Zeit sperren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Datum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newBlockedTime.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBlockedTime.date ? format(newBlockedTime.date, "PPP", { locale: de }) : "Datum auswählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newBlockedTime.date}
                        onSelect={(date) => setNewBlockedTime(prev => ({ ...prev, date }))}
                        initialFocus
                        locale={de}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="blockedTime">Uhrzeit</Label>
                  <Select value={newBlockedTime.time} onValueChange={(value) => 
                    setNewBlockedTime(prev => ({ ...prev, time: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Uhrzeit auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reason">Grund (optional)</Label>
                  <Input
                    id="reason"
                    value={newBlockedTime.reason}
                    onChange={(e) => setNewBlockedTime(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Grund der Sperrung"
                  />
                </div>
              </div>
              <Button onClick={createBlockedTime} className="bg-orange hover:bg-orange/90">
                <Ban className="h-4 w-4 mr-2" />
                Zeit sperren
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gesperrte Zeiten verwalten</CardTitle>
            </CardHeader>
            <CardContent>
              {blockedTimes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keine gesperrten Zeiten vorhanden.</p>
              ) : (
                <div className="space-y-3">
                  {blockedTimes.map((blockedTime) => (
                    <div key={blockedTime.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {format(new Date(blockedTime.block_date), "PPP", { locale: de })} um {blockedTime.block_time}
                        </p>
                        {blockedTime.reason && (
                          <p className="text-sm text-gray-500">Grund: {blockedTime.reason}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Erstellt: {format(new Date(blockedTime.created_at), "PPP", { locale: de })}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBlockedTime(blockedTime.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Preview Dialog */}
      <AppointmentEmailPreviewDialog
        isOpen={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        recipient={selectedRecipientForPreview}
      />
    </div>
  );
};

export default AppointmentManager;
