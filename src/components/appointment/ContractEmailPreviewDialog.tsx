
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Loader2 } from 'lucide-react';
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
  onSendEmail?: () => void;
  isSending?: boolean;
}

const ContractEmailPreviewDialog: React.FC<ContractEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  recipient,
  contractToken,
  onSendEmail,
  isSending = false
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
        <ScrollArea className="h-[60vh] w-full">
          <div className="p-4">
            <ContractEmailTemplate
              recipientFirstName={recipient.first_name}
              recipientLastName={recipient.last_name}
              contractToken={contractToken}
            />
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSending}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={onSendEmail}
            disabled={isSending}
            className="bg-orange hover:bg-orange/90"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                E-Mail senden
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractEmailPreviewDialog;
