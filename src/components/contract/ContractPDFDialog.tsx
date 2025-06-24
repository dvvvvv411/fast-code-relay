
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import ContractPDFPreview from './ContractPDFPreview';

const ContractPDFDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full mb-6 py-3 text-base bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
        >
          <FileText className="h-5 w-5 mr-2" />
          Arbeitsvertrag Vorschau
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange" />
            Arbeitsvertrag-Vorlage
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ContractPDFPreview />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractPDFDialog;
