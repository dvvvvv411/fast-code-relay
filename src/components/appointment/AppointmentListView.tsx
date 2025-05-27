
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, User, Mail, Calendar, Eye, Star } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  recipient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AppointmentListViewProps {
  appointments: Appointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
}

const AppointmentListView = ({ appointments, onAppointmentSelect }: AppointmentListViewProps) => {
  const now = new Date();
  const today = startOfDay(now);

  // Sort appointments: upcoming first, then by date and time
  const sortedAppointments = [...appointments].sort((a, b) => {
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

  const isUpcoming = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    return isAfter(appointmentDateTime, now);
  };

  const isPast = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    return isBefore(appointmentDateTime, now);
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alle Termine ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Uhrzeit</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("text-white text-xs", getStatusColor(appointment.status))}
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(appointment.created_at), 'dd.MM.yy', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentSelect(appointment);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {appointments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Termine vorhanden</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentListView;
