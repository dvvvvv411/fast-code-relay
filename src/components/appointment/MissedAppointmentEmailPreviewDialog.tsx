
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import MissedAppointmentEmailTemplate from './MissedAppointmentEmailTemplate';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unique_token: string;
  email_sent: boolean;
  created_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  recipient?: Recipient;
}

interface MissedAppointmentEmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const MissedAppointmentEmailPreviewDialog: React.FC<MissedAppointmentEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  appointment
}) => {
  if (!appointment || !appointment.recipient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>E-Mail Vorschau - Verpasster Termin</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-4">
            <MissedAppointmentEmailTemplate
              recipientFirstName={appointment.recipient.first_name}
              recipientLastName={appointment.recipient.last_name}
              recipient={appointment.recipient}
              appointment={appointment}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MissedAppointmentEmailPreviewDialog;
