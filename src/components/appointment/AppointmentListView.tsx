import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, Mail, Calendar, Eye, Star, Heart, X, Voicemail, Filter, RefreshCw, Phone, Check, Loader2, CalendarDays, FileText } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, addDays, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

interface AppointmentListViewProps {
  appointments: Appointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
  onPhoneNoteUpdate?: (recipientId: string, phoneNote: string) => Promise<void>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onMissedEmailSend?: (appointment: Appointment) => void;
  onContractInfoSend?: (appointment: Appointment) => void;
  sendingContractEmails?: Set<string>;
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

const AppointmentListView = ({ 
  appointments, 
  onAppointmentSelect, 
  onStatusChange,
  onPhoneNoteUpdate, 
  onRefresh,
  isRefreshing = false,
  onMissedEmailSend,
  onContractInfoSend,
  sendingContractEmails = new Set()
}: AppointmentListViewProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPhoneNote, setEditingPhoneNote] = useState<string | null>(null);
  const [phoneNoteValue, setPhoneNoteValue] = useState<string>('');
  const [updatingPhoneNote, setUpdatingPhoneNote] = useState<string | null>(null);
  const [showAllAppointments, setShowAllAppointments] = useState<boolean>(false);
  const { toast } = useToast();
  
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  // Filter appointments by date (today and tomorrow only) and status
  const filteredAppointments = appointments.filter(appointment => {
    // If showing all appointments, skip date filtering
    if (!showAllAppointments) {
      const appointmentDate = new Date(appointment.appointment_date);
      const isToday = startOfDay(appointmentDate).getTime() === today.getTime();
      const isTomorrow = startOfDay(appointmentDate).getTime() === tomorrow.getTime();
      
      // Only show appointments from today and tomorrow
      if (!isToday && !isTomorrow) return false;
    }
    
    // Apply status filter
    if (statusFilter === 'all') return true;
    return appointment.status === statusFilter;
  });

  // Sort appointments: upcoming first, then by date and time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
    const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
    
    // Upcoming appointments first
    const aIsUpcoming = isAfter(dateA, now);
    const bIsUpcoming = isAfter(dateB, now);
    
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    
    // Then sort by date/time
    return dateA.getTime() - dateB.getTime();
  });

  // Get the next upcoming appointment
  const nextAppointment = sortedAppointments.find(appointment => 
    isAfter(new Date(`${appointment.appointment_date}T${appointment.appointment_time}`), now) &&
    appointment.status !== 'cancelled'
  );

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
      case 'infos_angefragt':
        return 'bg-purple-500';
      default:
        return 'bg-yellow-500';
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
      case 'infos_angefragt':
        return 'Infos angefragt';
      default:
        return 'Ausstehend';
    }
  };

  const validateStatus = (status: string): status is ValidStatus => {
    return VALID_STATUSES.includes(status as ValidStatus);
  };

  const handleQuickAction = async (appointmentId: string, newStatus: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    console.log('🎯 Quick action triggered:', {
      appointmentId,
      newStatus,
      isValidStatus: validateStatus(newStatus),
      validStatuses: VALID_STATUSES
    });

    // Validate the status before sending
    if (!validateStatus(newStatus)) {
      console.error('❌ Invalid status attempted:', newStatus, 'Valid statuses:', VALID_STATUSES);
      toast({
        title: "Fehler",
        description: `Ungültiger Status: "${newStatus}". Erlaubte Status: ${VALID_STATUSES.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (onStatusChange) {
      try {
        console.log('📤 Calling onStatusChange with validated status:', { appointmentId, newStatus });
        await onStatusChange(appointmentId, newStatus);
        console.log('✅ Status change completed successfully');
      } catch (error) {
        console.error('❌ Error in handleQuickAction:', error);
        toast({
          title: "Fehler",
          description: `Fehler beim Aktualisieren des Status: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
          variant: "destructive",
        });
      }
    }
  };

  const isUpcoming = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    return isAfter(appointmentDateTime, now);
  };

  const isPast = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    return isBefore(appointmentDateTime, now);
  };

  const handlePhoneNoteEdit = (recipientId: string, currentValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingPhoneNote(recipientId);
    setPhoneNoteValue(currentValue || '');
  };

  const handlePhoneNoteSave = async (recipientId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onPhoneNoteUpdate) return;

    setUpdatingPhoneNote(recipientId);
    try {
      await onPhoneNoteUpdate(recipientId, phoneNoteValue);
      setEditingPhoneNote(null);
    } catch (error) {
      console.error('Error updating phone note:', error);
    } finally {
      setUpdatingPhoneNote(null);
    }
  };

  const handlePhoneNoteCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingPhoneNote(null);
    setPhoneNoteValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent, recipientId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handlePhoneNoteSave(recipientId, event as any);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handlePhoneNoteCancel(event as any);
    }
  };

  const handleMissedEmailClick = (appointment: Appointment, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onMissedEmailSend) {
      onMissedEmailSend(appointment);
    }
  };

  const handleContractInfoClick = (appointment: Appointment, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onContractInfoSend) {
      onContractInfoSend(appointment);
    }
  };

  return (
    <div className="space-y-6">
      {/* Next Appointment Highlight */}
      {nextAppointment && (
        <Card className="border-orange bg-orange/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange">
              <Star className="h-5 w-5" />
              Nächster Termin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-orange" />
                  <span className="font-medium">
                    {format(new Date(nextAppointment.appointment_date), 'PPP', { locale: de })}
                  </span>
                  <Clock className="h-4 w-4 text-orange ml-4" />
                  <span className="font-medium">{nextAppointment.appointment_time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <span>
                    {nextAppointment.recipient?.first_name} {nextAppointment.recipient?.last_name}
                  </span>
                  <Mail className="h-4 w-4 text-gray-600 ml-4" />
                  <span className="text-gray-600">{nextAppointment.recipient?.email}</span>
                  {nextAppointment.recipient?.phone_note && (
                    <>
                      <Phone className="h-4 w-4 text-gray-600 ml-4" />
                      <span className="text-gray-600">{nextAppointment.recipient.phone_note}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={cn("text-white", getStatusColor(nextAppointment.status))}
                >
                  {getStatusText(nextAppointment.status)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAppointmentSelect(nextAppointment)}
                  className="border-orange text-orange hover:bg-orange hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Appointments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {showAllAppointments ? `Alle Termine (${filteredAppointments.length})` : `Termine heute & morgen (${filteredAppointments.length})`}
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {/* Show All Appointments Toggle */}
              <Button
                variant={showAllAppointments ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllAppointments(!showAllAppointments)}
                className={cn(
                  "flex items-center gap-2",
                  showAllAppointments && "bg-orange hover:bg-orange/90"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                {showAllAppointments ? "Nur heute & morgen" : "Alle anzeigen"}
              </Button>
              
              {/* Refresh Button */}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Lädt..." : "Aktualisieren"}
                </Button>
              )}
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                    <SelectItem value="confirmed">Bestätigt</SelectItem>
                    <SelectItem value="interessiert">Interessiert</SelectItem>
                    <SelectItem value="abgelehnt">Abgelehnt</SelectItem>
                    <SelectItem value="mailbox">Mailbox</SelectItem>
                    <SelectItem value="infos_angefragt">Infos angefragt</SelectItem>
                    <SelectItem value="cancelled">Abgesagt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Uhrzeit</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schnellaktionen</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAppointments.map((appointment) => (
                <TableRow 
                  key={appointment.id}
                  className={cn(
                    "cursor-pointer hover:bg-gray-50",
                    isUpcoming(appointment) && "bg-blue-50/30",
                    isPast(appointment) && "opacity-60",
                    nextAppointment?.id === appointment.id && "bg-orange/10 border-l-4 border-l-orange"
                  )}
                  onClick={() => onAppointmentSelect(appointment)}
                >
                  <TableCell className="font-medium">
                    {format(new Date(appointment.appointment_date), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>{appointment.appointment_time}</TableCell>
                  <TableCell>
                    {appointment.recipient?.first_name} {appointment.recipient?.last_name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {appointment.recipient?.email}
                  </TableCell>
                  <TableCell className="text-gray-600" onClick={(e) => e.stopPropagation()}>
                    {appointment.recipient && editingPhoneNote === appointment.recipient.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={phoneNoteValue}
                          onChange={(e) => setPhoneNoteValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, appointment.recipient!.id)}
                          placeholder="Telefonnummer eingeben"
                          className="h-8 w-32"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handlePhoneNoteSave(appointment.recipient!.id, e)}
                          disabled={updatingPhoneNote === appointment.recipient.id}
                          className="h-8 w-8 p-0"
                        >
                          {updatingPhoneNote === appointment.recipient.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePhoneNoteCancel}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[2rem] flex items-center"
                        onClick={(e) => appointment.recipient && handlePhoneNoteEdit(appointment.recipient.id, appointment.recipient.phone_note || '', e)}
                      >
                        {appointment.recipient?.phone_note || (
                          <span className="text-gray-400 italic">Telefon hinzufügen</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("text-white text-xs", getStatusColor(appointment.status))}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleQuickAction(appointment.id, 'interessiert', e)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                        title="Interessiert"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleQuickAction(appointment.id, 'abgelehnt', e)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        title="Abgelehnt"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleQuickAction(appointment.id, 'mailbox', e)}
                        className="h-8 w-8 p-0 hover:bg-yellow-100 hover:text-yellow-600"
                        title="Mailbox"
                      >
                        <Voicemail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(appointment.created_at), 'dd.MM.yy', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentSelect(appointment);
                        }}
                        title="Details anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isPast(appointment) && onMissedEmailSend && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMissedEmailClick(appointment, e)}
                          className="hover:bg-orange/10 hover:text-orange"
                          title="E-Mail für verpassten Termin senden"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {onContractInfoSend && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleContractInfoClick(appointment, e)}
                          className="hover:bg-blue/10 hover:text-blue-600"
                          title="Arbeitsvertrag Infos senden"
                          disabled={sendingContractEmails.has(appointment.id)}
                        >
                          {sendingContractEmails.has(appointment.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sortedAppointments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {statusFilter === 'all' 
                  ? (showAllAppointments ? 'Keine Termine vorhanden' : 'Keine Termine für heute oder morgen vorhanden')
                  : (showAllAppointments 
                      ? `Keine Termine mit Status "${getStatusText(statusFilter)}" vorhanden`
                      : `Keine Termine mit Status "${getStatusText(statusFilter)}" für heute oder morgen vorhanden`
                    )
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentListView;
