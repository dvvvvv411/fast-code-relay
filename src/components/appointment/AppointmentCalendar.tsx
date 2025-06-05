import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfDay, isWeekend, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

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

interface AppointmentCalendarProps {
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  onDateSelect: (date: Date) => void;
}

const AppointmentCalendar = ({ appointments, blockedTimes, onDateSelect }: AppointmentCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const isDateFullyBooked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Count available time slots (8:00-17:30, 30min intervals = 19 slots)
    const totalSlots = 19;
    
    // Count booked appointments
    const bookedSlots = appointments.filter(
      appointment => 
        appointment.appointment_date === dateStr && 
        appointment.status !== 'cancelled'
    ).length;
    
    // Count blocked slots
    const blockedSlots = blockedTimes.filter(
      blocked => blocked.block_date === dateStr
    ).length;
    
    return (bookedSlots + blockedSlots) >= totalSlots;
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (date < startOfDay(new Date())) return true;
    
    // Disable fully booked dates
    if (isDateFullyBooked(date)) return true;
    
    return false;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isDateDisabled(date)) {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  const getDateStatus = (date: Date) => {
    if (isDateDisabled(date)) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const bookedCount = appointments.filter(
      appointment => 
        appointment.appointment_date === dateStr && 
        appointment.status !== 'cancelled'
    ).length;
    
    if (bookedCount === 0) return 'available';
    if (bookedCount < 10) return 'limited';
    return 'busy';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <CalendarIcon className="h-5 w-5" />
            Datum auswählen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              locale={de}
              className="rounded-md border"
              classNames={{
                day_selected: "bg-orange text-white hover:bg-orange/90",
                day_today: "bg-orange/10 text-orange font-semibold",
              }}
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Begrenzt verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Ausgebucht</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Nicht verfügbar</span>
            </div>
          </div>

          {selectedDate && (
            <div className="text-center p-4 bg-orange/10 rounded-lg">
              <p className="text-orange font-medium">
                Ausgewähltes Datum: {format(selectedDate, 'PPPP', { locale: de })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;
