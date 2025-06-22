
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PersonalDataStepProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    startDate: string;
    maritalStatus: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const PersonalDataStep = ({ formData, onInputChange }: PersonalDataStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Persönliche Daten</h2>
        <p className="text-gray-600">Bitte geben Sie Ihre persönlichen Informationen ein</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="firstName">Vorname *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Nachname *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            required
            className="mt-1"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="startDate">Gewünschtes Startdatum *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => onInputChange('startDate', e.target.value)}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="maritalStatus">Familienstand</Label>
          <Select value={formData.maritalStatus} onValueChange={(value) => onInputChange('maritalStatus', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Bitte auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ledig">Ledig</SelectItem>
              <SelectItem value="verheiratet">Verheiratet</SelectItem>
              <SelectItem value="geschieden">Geschieden</SelectItem>
              <SelectItem value="verwitwet">Verwitwet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PersonalDataStep;
