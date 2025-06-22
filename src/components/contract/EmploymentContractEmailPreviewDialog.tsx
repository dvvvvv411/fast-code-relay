
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmploymentContractEmailTemplate from './EmploymentContractEmailTemplate';

interface EmploymentContract {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  start_date: string;
}

interface EmploymentContractEmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: EmploymentContract | null;
}

const EmploymentContractEmailPreviewDialog: React.FC<EmploymentContractEmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  contract
}) => {
  if (!contract) {
    return null;
  }

  // Generate a sample password for preview (7 characters like in the edge function)
  const samplePassword = 'ABC123X';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>E-Mail Vorschau - Arbeitsvertrag Annahme</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-4">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Hinweis:</strong> Dies ist eine Vorschau der E-Mail, die nach Annahme des Arbeitsvertrags versendet wird. 
                Das tatsächliche Passwort wird automatisch generiert und ist sicher.
              </p>
            </div>
            <EmploymentContractEmailTemplate
              firstName={contract.first_name}
              lastName={contract.last_name}
              email={contract.email}
              password={samplePassword}
              startDate={contract.start_date}
              isNewAccount={true}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EmploymentContractEmailPreviewDialog;
