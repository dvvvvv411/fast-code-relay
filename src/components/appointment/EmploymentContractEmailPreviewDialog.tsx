
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmploymentContractEmailTemplate from './EmploymentContractEmailTemplate';
import { Send, X } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  recipient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface EmploymentContractEmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSend: () => void;
}

const EmploymentContractEmailPreviewDialog: React.FC<EmploymentContractEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  onSend
}) => {
  if (!appointment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>E-Mail Vorschau - Arbeitsvertrag Informationen</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full">
          <div className="p-4">
            <EmploymentContractEmailTemplate
              appointment={appointment}
              token="PREVIEW-TOKEN"
            />
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={onSend} className="bg-orange hover:bg-orange/90">
            <Send className="h-4 w-4 mr-2" />
            E-Mail senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmploymentContractEmailPreviewDialog;
