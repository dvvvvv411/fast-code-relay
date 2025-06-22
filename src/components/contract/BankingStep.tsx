
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditCard } from 'lucide-react';

interface BankingStepProps {
  formData: {
    iban: string;
    bic: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const BankingStep = ({ formData, onInputChange }: BankingStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bankverbindung</h2>
        <p className="text-gray-600">Für die Überweisung Ihres Gehalts</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-80 h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-300 p-6 text-white animate-fade-in">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs opacity-80">BANK CARD</p>
                <p className="text-sm font-medium">Gehaltskonto</p>
              </div>
              <CreditCard className="h-8 w-8 opacity-80" />
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs opacity-80">IBAN</p>
                <p className="text-sm font-mono tracking-wider">
                  {formData.iban || "DE** **** **** **** ****"}
                </p>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-xs opacity-80">BIC</p>
                  <p className="text-sm font-mono">
                    {formData.bic || "BANKDEFF"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80">VALID</p>
                  <p className="text-sm">∞</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <Label htmlFor="iban">IBAN *</Label>
          <Input
            id="iban"
            value={formData.iban}
            onChange={(e) => onInputChange('iban', e.target.value)}
            placeholder="DE89 3704 0044 0532 0130 00"
            required
            className="mt-1 font-mono"
          />
        </div>
        
        <div>
          <Label htmlFor="bic">BIC (optional)</Label>
          <Input
            id="bic"
            value={formData.bic}
            onChange={(e) => onInputChange('bic', e.target.value)}
            placeholder="z.B. COBADEFFXXX"
            className="mt-1 font-mono"
          />
        </div>
      </div>
    </div>
  );
};

export default BankingStep;
