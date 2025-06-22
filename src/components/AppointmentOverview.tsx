
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Grid3X3, CalendarIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointmentData } from '@/hooks/useAppointmentData';
import AppointmentCalendarView from './appointment/AppointmentCalendarView';
import AppointmentListView from './appointment/AppointmentListView';
import AppointmentDetailView from './appointment/AppointmentDetailView';

const AppointmentOverview = () => {
  const [overviewMode, setOverviewMode] = useState<'calendar' | 'list'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const {
    appointments,
    isLoading,
    isRefreshing,
    handleRefresh,
    handleAppointmentStatusChange,
    handlePhoneNoteUpdate,
    handleSendMissedAppointmentEmail
  } = useAppointmentData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
          <p className="mt-2 text-gray-500">Lade Terminübersicht...</p>
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
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Terminübersicht</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Wird aktualisiert..." : "Aktualisieren"}
          </Button>
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
          onAppointmentSelect={setSelectedAppointment}
        />
      ) : (
        <AppointmentListView
          appointments={appointments}
          onAppointmentSelect={setSelectedAppointment}
          onStatusChange={handleAppointmentStatusChange}
          onPhoneNoteUpdate={handlePhoneNoteUpdate}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onMissedEmailSend={handleSendMissedAppointmentEmail}
        />
      )}
    </div>
  );
};

export default AppointmentOverview;
