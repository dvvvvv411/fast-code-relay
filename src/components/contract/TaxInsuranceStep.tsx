
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lock, Shield } from 'lucide-react';

interface TaxInsuranceStepProps {
  formData: {
    socialSecurityNumber: string;
    taxNumber: string;
    healthInsuranceName: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const TaxInsuranceStep = ({ formData, onInputChange }: TaxInsuranceStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Steuer- und Versicherungsdaten</h2>
        <p className="text-gray-600">Ihre Daten werden verschlüsselt und sicher übertragen</p>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-orange-600" />
          <Shield className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">Sensible Daten - Sicher verschlüsselt</span>
        </div>
        <p className="text-xs text-orange-700">
          Alle sensiblen Informationen werden mit höchster Sicherheitsstufe behandelt und gemäß DSGVO verarbeitet.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="socialSecurityNumber">Sozialversicherungsnummer *</Label>
          <Input
            id="socialSecurityNumber"
            value={formData.socialSecurityNumber}
            onChange={(e) => onInputChange('socialSecurityNumber', e.target.value)}
            placeholder="z.B. 12 345678 A 123"
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="taxNumber">Steuernummer *</Label>
          <Input
            id="taxNumber"
            value={formData.taxNumber}
            onChange={(e) => onInputChange('taxNumber', e.target.value)}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="healthInsuranceName">Krankenkasse *</Label>
          <Input
            id="healthInsuranceName"
            value={formData.healthInsuranceName}
            onChange={(e) => onInputChange('healthInsuranceName', e.target.value)}
            placeholder="z.B. AOK, TK, Barmer"
            required
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default TaxInsuranceStep;
