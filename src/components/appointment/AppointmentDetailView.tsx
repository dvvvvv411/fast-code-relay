
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, User, Mail, Edit3, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import AppointmentStatusHistory from './AppointmentStatusHistory';

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
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(appointment.status);

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
      default:
        return 'Ausstehend';
    }
  };

  const handleSaveStatus = () => {
    onStatusChange(appointment.id, selectedStatus);
    setIsEditingStatus(false);
  };

  const handleCancelEdit = () => {
    setSelectedStatus(appointment.status);
    setIsEditingStatus(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Button>
        <h2 className="text-2xl font-bold">Termindetails</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Appointment Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Termin-Informationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Datum</label>
                  <p className="text-lg font-semibold">
                    {format(new Date(appointment.appointment_date), 'PPP', { locale: de })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Uhrzeit</label>
                  <p className="text-lg font-semibold">{appointment.appointment_time}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {isEditingStatus ? (
                    <div className="flex items-center gap-2">
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Ausstehend</SelectItem>
                          <SelectItem value="confirmed">Bestätigt</SelectItem>
                          <SelectItem value="interessiert">Interessiert</SelectItem>
                          <SelectItem value="abgelehnt">Abgelehnt</SelectItem>
                          <SelectItem value="mailbox">Mailbox</SelectItem>
                          <SelectItem value="cancelled">Abgesagt</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleSaveStatus}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-white", getStatusColor(appointment.status))}
                      >
                        {getStatusText(appointment.status)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingStatus(true)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Erstellt am</label>
                <p className="text-sm text-gray-700">
                  {format(new Date(appointment.created_at), 'PPp', { locale: de })}
                </p>
              </div>

              {appointment.confirmed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bestätigt am</label>
                  <p className="text-sm text-gray-700">
                    {format(new Date(appointment.confirmed_at), 'PPp', { locale: de })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kontakt-Informationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg font-semibold">
                  {appointment.recipient?.first_name} {appointment.recipient?.last_name}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">E-Mail</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">{appointment.recipient?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status History */}
        <div>
          <AppointmentStatusHistory appointmentId={appointment.id} />
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailView;
