
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText } from 'lucide-react';

interface IdUploadStepProps {
  formData: {
    idCardFront: File | null;
    idCardBack: File | null;
  };
  onFileChange: (field: 'idCardFront' | 'idCardBack', file: File | null) => void;
}

const IdUploadStep = ({ formData, onFileChange }: IdUploadStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personalausweis</h2>
        <p className="text-gray-600">Bitte laden Sie beide Seiten Ihres Personalausweises hoch</p>
      </div>

      <Alert className="mb-6">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Ihre Dokumente werden sicher verschlüsselt und nur für die Vertragsabwicklung verwendet.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Label htmlFor="idCardFront" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900 block mb-2">Vorderseite</span>
              <span className="text-sm text-gray-600">Klicken zum Hochladen</span>
            </Label>
            <Input
              id="idCardFront"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => onFileChange('idCardFront', e.target.files?.[0] || null)}
              className="hidden"
            />
            {formData.idCardFront && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {formData.idCardFront.name}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Label htmlFor="idCardBack" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900 block mb-2">Rückseite</span>
              <span className="text-sm text-gray-600">Klicken zum Hochladen</span>
            </Label>
            <Input
              id="idCardBack"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => onFileChange('idCardBack', e.target.files?.[0] || null)}
              className="hidden"
            />
            {formData.idCardBack && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {formData.idCardBack.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdUploadStep;
