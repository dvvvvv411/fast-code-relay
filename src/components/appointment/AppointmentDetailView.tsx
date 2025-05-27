
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, User, Mail, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
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

interface AppointmentDetailViewProps {
  appointment: Appointment;
  onBack: () => void;
  onStatusChange: (appointmentId: string, newStatus: string) => void;
}

const AppointmentDetailView = ({ appointment, onBack, onStatusChange }: AppointmentDetailViewProps) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Check className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Button>
      </div>

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Termindetails
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-white flex items-center gap-2", getStatusColor(appointment.status))}
            >
              {getStatusIcon(appointment.status)}
              {getStatusText(appointment.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Datum</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {format(new Date(appointment.appointment_date), 'PPPP', { locale: de })}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Uhrzeit</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{appointment.appointment_time}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recipient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Teilnehmer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Name</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">
                    {appointment.recipient?.first_name} {appointment.recipient?.last_name}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">E-Mail</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{appointment.recipient?.email}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Verlauf</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <span className="font-medium">Termin erstellt</span>
                  <p className="text-sm text-gray-600">
                    {format(new Date(appointment.created_at), 'PPP um HH:mm', { locale: de })}
                  </p>
                </div>
              </div>
              
              {appointment.confirmed_at && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <span className="font-medium">Termin bestätigt</span>
                    <p className="text-sm text-gray-600">
                      {format(new Date(appointment.confirmed_at), 'PPP um HH:mm', { locale: de })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Aktionen</h3>
            <div className="flex flex-wrap gap-3">
              {appointment.status === 'pending' && (
                <>
                  <Button
                    onClick={() => onStatusChange(appointment.id, 'confirmed')}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Bestätigen
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onStatusChange(appointment.id, 'cancelled')}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Absagen
                  </Button>
                </>
              )}
              
              {appointment.status === 'confirmed' && (
                <Button
                  variant="destructive"
                  onClick={() => onStatusChange(appointment.id, 'cancelled')}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Absagen
                </Button>
              )}
              
              {appointment.status === 'cancelled' && (
                <Button
                  onClick={() => onStatusChange(appointment.id, 'pending')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Reaktivieren
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentDetailView;
