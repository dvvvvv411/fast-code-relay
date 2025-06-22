
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AcceptContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string) => void;
  contractData: {
    first_name: string;
    last_name: string;
    email: string;
    start_date: string;
  };
  isLoading: boolean;
}

const AcceptContractDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  contractData, 
  isLoading 
}: AcceptContractDialogProps) => {
  const [startDate, setStartDate] = useState(contractData.start_date);

  const handleConfirm = () => {
    onConfirm(startDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Arbeitsvertrag annehmen
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Vertragsdetails</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Name:</strong> {contractData.first_name} {contractData.last_name}</div>
              <div><strong>E-Mail:</strong> {contractData.email}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Startdatum bestätigen oder anpassen
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Aktuelles Datum: {format(new Date(startDate), 'dd.MM.yyyy', { locale: de })}
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Nach der Annahme wird automatisch ein Benutzerkonto erstellt und die Zugangsdaten per E-Mail versendet.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Vertrag annehmen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptContractDialog;
