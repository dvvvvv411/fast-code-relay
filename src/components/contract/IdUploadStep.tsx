
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface IdUploadStepProps {
  formData: {
    idCardFront: File | null;
    idCardBack: File | null;
  };
  onFileChange: (field: 'idCardFront' | 'idCardBack', file: File | null) => void;
}

const IdUploadStep = ({ formData, onFileChange }: IdUploadStepProps) => {
  const handleFileSelect = (field: 'idCardFront' | 'idCardBack', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(field, file);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personalausweis</h2>
        <p className="text-gray-600">Bitte laden Sie beide Seiten Ihres Personalausweises hoch (optional)</p>
      </div>

      <Alert className="mb-6">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Ihre Dokumente werden sicher verschlüsselt und nur für die Vertragsabwicklung verwendet.
          Das Hochladen der Ausweisbilder ist optional und kann auch später nachgereicht werden.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-orange ${
              formData.idCardFront ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}
            onClick={() => document.getElementById('idCardFront')?.click()}
          >
            {formData.idCardFront ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <span className="text-lg font-medium text-green-700 block mb-2">Vorderseite</span>
                <span className="text-sm text-green-600">✓ {formData.idCardFront.name}</span>
                <p className="text-xs text-gray-500 mt-2">Klicken zum Ändern</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <span className="text-lg font-medium text-gray-900 block mb-2">Vorderseite</span>
                <span className="text-sm text-gray-600">Klicken zum Hochladen</span>
              </>
            )}
          </div>
          <Input
            id="idCardFront"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileSelect('idCardFront', e)}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-orange ${
              formData.idCardBack ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}
            onClick={() => document.getElementById('idCardBack')?.click()}
          >
            {formData.idCardBack ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <span className="text-lg font-medium text-green-700 block mb-2">Rückseite</span>
                <span className="text-sm text-green-600">✓ {formData.idCardBack.name}</span>
                <p className="text-xs text-gray-500 mt-2">Klicken zum Ändern</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <span className="text-lg font-medium text-gray-900 block mb-2">Rückseite</span>
                <span className="text-sm text-gray-600">Klicken zum Hochladen</span>
              </>
            )}
          </div>
          <Input
            id="idCardBack"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileSelect('idCardBack', e)}
            className="hidden"
          />
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        <p>Unterstützte Formate: JPG, PNG, PDF • Maximale Dateigröße: 5MB pro Datei</p>
      </div>
    </div>
  );
};

export default IdUploadStep;
