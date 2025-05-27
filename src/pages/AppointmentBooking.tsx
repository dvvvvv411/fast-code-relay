
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppointmentCalendar from '@/components/appointment/AppointmentCalendar';
import AppointmentTimeSlots from '@/components/appointment/AppointmentTimeSlots';
import AppointmentConfirmation from '@/components/appointment/AppointmentConfirmation';
import AppointmentSuccess from '@/components/appointment/AppointmentSuccess';
import AppointmentProgress from '@/components/appointment/AppointmentProgress';
import AppointmentBreadcrumb from '@/components/appointment/AppointmentBreadcrumb';
import AppointmentPreparation from '@/components/appointment/AppointmentPreparation';
import { format } from 'date-fns';

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
  const [currentStep, setCurrentStep] = useState<'date' | 'time' | 'confirm' | 'success'>('date');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time selection
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep('confirm');
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
      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .insert({
          recipient_id: recipient.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-appointment-confirmation', {
          body: {
            appointmentId: appointmentData.id
          }
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the booking if email fails, just show a warning
          toast({
            title: "Termin gebucht",
            description: "Ihr Termin wurde erfolgreich gebucht, aber die Bestätigungs-E-Mail konnte nicht versendet werden.",
            variant: "default",
          });
        } else {
          console.log('Confirmation email sent:', emailData);
          toast({
            title: "Termin erfolgreich gebucht",
            description: "Eine Bestätigungs-E-Mail wurde an Sie gesendet.",
          });
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        toast({
          title: "Termin gebucht",
          description: "Ihr Termin wurde erfolgreich gebucht, aber die Bestätigungs-E-Mail konnte nicht versendet werden.",
          variant: "default",
        });
      }

      setCurrentStep('success');
      
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

  const handleBackToDate = () => {
    setCurrentStep('date');
    setSelectedTime('');
  };

  const handleBackToTime = () => {
    setCurrentStep('time');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
            <p className="mt-2 text-gray-500">Lade Terminbuchung...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1">
          <AppointmentSuccess 
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            recipient={recipient}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terminbuchung</h1>
            {recipient && (
              <p className="text-gray-600">
                Hallo {recipient.first_name} {recipient.last_name}, wählen Sie Ihren Wunschtermin:
              </p>
            )}
          </div>

          <AppointmentBreadcrumb currentStep={currentStep} />
          <AppointmentProgress currentStep={currentStep} />

          <div className="mt-8">
            {currentStep === 'date' && (
              <>
                <AppointmentCalendar 
                  appointments={appointments}
                  blockedTimes={blockedTimes}
                  onDateSelect={handleDateSelect}
                />
                <AppointmentPreparation />
              </>
            )}

            {currentStep === 'time' && selectedDate && (
              <AppointmentTimeSlots
                selectedDate={selectedDate}
                appointments={appointments}
                blockedTimes={blockedTimes}
                onTimeSelect={handleTimeSelect}
                onBack={handleBackToDate}
              />
            )}

            {currentStep === 'confirm' && selectedDate && selectedTime && (
              <AppointmentConfirmation
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onConfirm={handleBookAppointment}
                onBack={handleBackToTime}
                isBooking={isBooking}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AppointmentBooking;
