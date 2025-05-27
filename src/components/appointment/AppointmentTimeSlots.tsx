import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

interface BlockedTime {
  id: string;
  block_date: string;
  block_time: string;
}

interface AppointmentTimeSlotsProps {
  selectedDate: Date;
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  onTimeSelect: (time: string) => void;
  onBack: () => void;
}

const AppointmentTimeSlots = ({ 
  selectedDate, 
  appointments, 
  blockedTimes, 
  onTimeSelect, 
  onBack 
}: AppointmentTimeSlotsProps) => {
  // Generate time slots from 8:00 to 17:30 in 30-minute intervals
  const timeSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 17) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  // Add 17:30 as the final slot
  timeSlots.push('17:30');

  // Helper function to normalize time format for comparison
  const normalizeTime = (time: string) => {
    // If time already has seconds, keep it as is
    if (time.includes(':') && time.split(':').length === 3) {
      return time;
    }
    // If time doesn't have seconds, add ":00"
    return `${time}:00`;
  };

  const isTimeSlotAvailable = (time: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if selected date is today and time slot is in the past
    if (dateStr === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [slotHour, slotMinute] = time.split(':').map(Number);
      
      // If the time slot is in the past, it's not available
      if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
        return false;
      }
    }
    
    // Normalize the current time slot for comparison
    const normalizedSlotTime = normalizeTime(time);
    
    // Check if time is blocked
    const isBlocked = blockedTimes.some(
      blocked => {
        const normalizedBlockedTime = normalizeTime(blocked.block_time);
        return blocked.block_date === dateStr && normalizedBlockedTime === normalizedSlotTime;
      }
    );
    
    // Check if time is already booked
    const isBooked = appointments.some(
      appointment => {
        const normalizedAppointmentTime = normalizeTime(appointment.appointment_time);
        return appointment.appointment_date === dateStr && 
               normalizedAppointmentTime === normalizedSlotTime &&
               appointment.status !== 'cancelled';
      }
    );
    
    return !isBlocked && !isBooked;
  };

  const availableSlots = timeSlots.filter(isTimeSlotAvailable);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 justify-center">
                <Clock className="h-5 w-5" />
                Uhrzeit auswählen
              </CardTitle>
            </div>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              {format(selectedDate, 'PPPP', { locale: de })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">Keine freien Termine verfügbar</p>
                <p className="text-sm">Bitte wählen Sie ein anderes Datum.</p>
              </div>
              <Button onClick={onBack} variant="outline">
                Anderes Datum wählen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {timeSlots.map((time) => {
                const isAvailable = isTimeSlotAvailable(time);
                return (
                  <Button
                    key={time}
                    variant={isAvailable ? "outline" : "ghost"}
                    className={cn(
                      "h-12 text-sm",
                      isAvailable && "hover:bg-orange hover:text-white hover:border-orange",
                      !isAvailable && "opacity-30 cursor-not-allowed"
                    )}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && onTimeSelect(time)}
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
  );
};

export default AppointmentTimeSlots;
