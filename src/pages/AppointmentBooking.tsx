
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, addDays, startOfDay, isSameDay, isWeekend } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unique_token: string;
}

interface Appointment {
  id: string;
  recipient_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

interface BlockedTime {
  id: string;
  block_date: string;
  block_time: string;
}

const AppointmentBooking = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Generate time slots from 8:00 to 17:30 in 30-minute intervals
  const timeSlots = [];
  for (let hour = 8; hour < 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 17) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  // Generate next 14 weekdays
  const getNext14Weekdays = () => {
    const days = [];
    let currentDate = startOfDay(new Date());
    let addedDays = 0;
    
    while (addedDays < 14) {
      if (!isWeekend(currentDate)) {
        days.push(new Date(currentDate));
        addedDays++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  };

  const availableDates = getNext14Weekdays();

  useEffect(() => {
    if (token) {
      loadRecipientData();
    } else {
      navigate('/');
    }
  }, [token]);

  const loadRecipientData = async () => {
    try {
      setIsLoading(true);
      
      // Load recipient by token
      const { data: recipientData, error: recipientError } = await supabase
        .from('appointment_recipients')
        .select('*')
        .eq('unique_token', token)
        .single();

      if (recipientError || !recipientData) {
        toast({
          title: "Ungültiger Token",
          description: "Der Buchungslink ist ungültig oder abgelaufen.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setRecipient(recipientData);

      // Load existing appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', format(new Date(), 'yyyy-MM-dd'));

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // Load blocked times
      const { data: blockedTimesData, error: blockedTimesError } = await supabase
        .from('blocked_times')
        .select('*')
        .gte('block_date', format(new Date(), 'yyyy-MM-dd'));

      if (blockedTimesError) throw blockedTimesError;
      setBlockedTimes(blockedTimesData || []);
      
    } catch (error: any) {
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

  const isTimeSlotAvailable = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if time is blocked
    const isBlocked = blockedTimes.some(
      blocked => blocked.block_date === dateStr && blocked.block_time === time
    );
    
    // Check if time is already booked
    const isBooked = appointments.some(
      appointment => 
        appointment.appointment_date === dateStr && 
        appointment.appointment_time === time &&
        appointment.status !== 'cancelled'
    );
    
    return !isBlocked && !isBooked;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !recipient) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie Datum und Uhrzeit aus.",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          recipient_id: recipient.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Termin gebucht!",
        description: `Ihr Termin wurde für ${format(selectedDate, 'PPP', { locale: de })} um ${selectedTime} Uhr gebucht.`,
      });

      setBookingComplete(true);
      
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Fehler",
        description: error.message || "Termin konnte nicht gebucht werden.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
          <p className="mt-2 text-gray-500">Lade Terminbuchung...</p>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Termin bestätigt!</h2>
              <p className="text-gray-600">
                Ihr Termin wurde erfolgreich gebucht für:<br />
                <strong>{selectedDate && format(selectedDate, 'PPP', { locale: de })} um {selectedTime} Uhr</strong>
              </p>
              <p className="text-sm text-gray-500">
                Sie erhalten eine Bestätigungsmail an {recipient?.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terminbuchung</h1>
          {recipient && (
            <p className="text-gray-600">
              Hallo {recipient.first_name} {recipient.last_name}, wählen Sie Ihren Wunschtermin:
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datum auswählen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableDates.map((date) => (
                  <Button
                    key={date.toISOString()}
                    variant={selectedDate && isSameDay(date, selectedDate) ? "default" : "outline"}
                    className={cn(
                      "h-auto p-3 flex flex-col items-center justify-center",
                      selectedDate && isSameDay(date, selectedDate) && "bg-orange hover:bg-orange/90"
                    )}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(''); // Reset time selection
                    }}
                  >
                    <span className="text-sm font-medium">
                      {format(date, 'EEE', { locale: de })}
                    </span>
                    <span className="text-xs">
                      {format(date, 'dd.MM', { locale: de })}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Uhrzeit auswählen
                {selectedDate && (
                  <Badge variant="outline" className="ml-auto">
                    {format(selectedDate, 'dd.MM.yyyy', { locale: de })}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Bitte wählen Sie zuerst ein Datum aus</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {timeSlots.map((time) => {
                    const isAvailable = isTimeSlotAvailable(selectedDate, time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={cn(
                          "h-auto p-2",
                          selectedTime === time && "bg-orange hover:bg-orange/90",
                          !isAvailable && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!isAvailable}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Confirmation */}
        {selectedDate && selectedTime && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Termin bestätigen</h3>
                <p className="text-gray-600">
                  <strong>{format(selectedDate, 'PPPP', { locale: de })}</strong><br />
                  um <strong>{selectedTime} Uhr</strong>
                </p>
                <Button
                  onClick={handleBookAppointment}
                  disabled={isBooking}
                  className="bg-orange hover:bg-orange/90 px-8 py-2"
                >
                  {isBooking ? 'Wird gebucht...' : 'Termin buchen'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;
