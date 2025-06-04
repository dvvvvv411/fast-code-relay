import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Phone } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
}

const AppointmentCalendarView = ({ appointments, onAppointmentSelect }: AppointmentCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get appointments for the selected date
  const appointmentsForDate = appointments.filter(appointment =>
    isSameDay(new Date(appointment.appointment_date), selectedDate)
  );

  // Get dates that have appointments
  const datesWithAppointments = appointments.map(appointment => 
    new Date(appointment.appointment_date)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
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
      default:
        return 'Ausstehend';
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    // If there's a phone number, copy it to clipboard
    if (appointment.recipient?.phone_note) {
      const success = await copyToClipboard(appointment.recipient.phone_note);
      
      if (success) {
        toast({
          title: "Telefonnummer kopiert",
          description: `${appointment.recipient.phone_note} wurde in die Zwischenablage kopiert.`,
        });
      } else {
        toast({
          title: "Fehler beim Kopieren",
          description: "Die Telefonnummer konnte nicht kopiert werden.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Keine Telefonnummer",
        description: "Für diesen Termin ist keine Telefonnummer hinterlegt.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Terminkalender
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={de}
            className="rounded-md border"
            modifiers={{
              hasAppointment: datesWithAppointments
            }}
            modifiersStyles={{
              hasAppointment: {
                backgroundColor: '#ff6b35',
                color: 'white',
                fontWeight: 'bold'
              }
            }}
          />
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange"></div>
              <span>Tage mit Terminen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Termine für {format(selectedDate, 'PPP', { locale: de })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsForDate.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Termine an diesem Tag</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentsForDate
                .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                .map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAppointmentClick(appointment)}
                  title={appointment.recipient?.phone_note ? `Klicken um Telefonnummer zu kopieren: ${appointment.recipient.phone_note}` : "Klicken für Details"}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-lg">
                          {appointment.appointment_time}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          <span>
                            {appointment.recipient?.first_name} {appointment.recipient?.last_name}
                          </span>
                        </div>
                        {appointment.recipient?.phone_note && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{appointment.recipient.phone_note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-white", getStatusColor(appointment.status))}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {appointment.recipient?.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendarView;
