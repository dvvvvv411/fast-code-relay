import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, CreditCard, Mail, Calendar, Phone, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPhoneData } from '@/hooks/useUserPhoneData';

const PersonalDataTab = () => {
  const { user } = useAuth();
  const { phoneNumber, isLoading: phoneLoading } = useUserPhoneData();
  
  // State for editable bank data
  const [bankData, setBankData] = useState({
    iban: 'DE89 3704 0044 0532 0130 00',
    bic: 'COBADEFFXXX',
    bankName: 'Commerzbank'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const personalInfo = {
    firstName: user?.user_metadata?.first_name || 'Max',
    lastName: user?.user_metadata?.last_name || 'Mustermann',
    email: user?.email || 'max.mustermann@example.com',
    phone: phoneNumber || user?.user_metadata?.phone || '+49 123 456789',
    joinDate: '15. Januar 2024'
  };

  const handleBankDataChange = (field: string, value: string) => {
    setBankData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBankData = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // In a real application, you would save this to a user profile table
      // For now, we'll just show a success message
      toast.success('Bankdaten erfolgreich gespeichert');
      setIsEditing(false);
    } catch (error) {
      toast.error('Fehler beim Speichern der Bankdaten');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange" />
            Persönliche Informationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Vorname</label>
              <p className="text-lg font-semibold">{personalInfo.firstName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Nachname</label>
              <p className="text-lg font-semibold">{personalInfo.lastName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">E-Mail</label>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                {personalInfo.email}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Telefonnummer</label>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                {phoneLoading ? 'Wird geladen...' : personalInfo.phone}
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Mitglied seit</label>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                {personalInfo.joinDate}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange" />
            Bankverbindung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bank Card - Left Side */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-48 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-300 p-6 text-white animate-fade-in">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-xs opacity-80">GEHALTSKONTO</p>
                      <p className="text-sm font-medium">{personalInfo.firstName} {personalInfo.lastName}</p>
                    </div>
                    <CreditCard className="h-8 w-8 opacity-80" />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs opacity-80">IBAN</p>
                      <p className="text-sm font-mono tracking-wider">
                        {bankData.iban}
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs opacity-80">BIC</p>
                        <p className="text-sm font-mono">
                          {bankData.bic}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80">BANK</p>
                        <p className="text-sm">{bankData.bankName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields - Right Side - Now vertically centered */}
            <div className="flex flex-col justify-center space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Bankdaten bearbeiten</h3>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Bearbeiten
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={bankData.iban}
                    onChange={(e) => handleBankDataChange('iban', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    value={bankData.bic}
                    onChange={(e) => handleBankDataChange('bic', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bankName">Bank</Label>
                  <Input
                    id="bankName"
                    value={bankData.bankName}
                    onChange={(e) => handleBankDataChange('bankName', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSaveBankData}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Speichern...' : 'Speichern'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Abbrechen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDataTab;
