
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppointmentEmailTemplate from './AppointmentEmailTemplate';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unique_token: string;
  email_sent: boolean;
  created_at: string;
}

interface AppointmentEmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Recipient | null;
}

const AppointmentEmailPreviewDialog: React.FC<AppointmentEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  recipient
}) => {
  if (!recipient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>E-Mail Vorschau - Terminbuchung</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-4">
            <AppointmentEmailTemplate
              recipientFirstName={recipient.first_name}
              recipientLastName={recipient.last_name}
              recipient={recipient}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentEmailPreviewDialog;
