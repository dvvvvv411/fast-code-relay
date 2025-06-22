
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import ContractEmailTemplate from './ContractEmailTemplate';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unique_token: string;
  email_sent: boolean;
  created_at: string;
}

interface ContractEmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Recipient | null;
  contractToken: string | null;
}

const ContractEmailPreviewDialog: React.FC<ContractEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  recipient,
  contractToken
}) => {
  if (!recipient || !contractToken) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>E-Mail Vorschau - Arbeitsvertrag Infos</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-4">
            <ContractEmailTemplate
              recipientFirstName={recipient.first_name}
              recipientLastName={recipient.last_name}
              contractToken={contractToken}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ContractEmailPreviewDialog;
