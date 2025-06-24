
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import AssignmentEmailTemplate from './AssignmentEmailTemplate';

interface AssignmentEmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    recipientFirstName: string;
    recipientLastName: string;
    assignmentId: string;
    phoneNumberId: string;
  };
  assignment: {
    assignment_url: string;
    auftraege: {
      title: string;
      anbieter: string;
      auftragsnummer: string;
      projektziel: string;
    };
  } | null;
  phoneNumber: {
    phone: string;
    access_code: string;
  } | null;
}

const AssignmentEmailPreviewDialog: React.FC<AssignmentEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  formData,
  assignment,
  phoneNumber
}) => {
  if (!assignment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>HTML E-Mail Vorschau</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-4">
            <AssignmentEmailTemplate
              recipientFirstName={formData.recipientFirstName}
              recipientLastName={formData.recipientLastName}
              assignment={assignment}
              phoneNumber={phoneNumber || undefined}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentEmailPreviewDialog;
