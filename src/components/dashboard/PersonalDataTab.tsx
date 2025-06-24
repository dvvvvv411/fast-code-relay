
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, CreditCard, Mail, Calendar, Phone, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPhoneData } from '@/hooks/useUserPhoneData';
import { useUserBankData } from '@/hooks/useUserBankData';

const PersonalDataTab = () => {
  const { user } = useAuth();
  const { phoneNumber, isLoading: phoneLoading } = useUserPhoneData();
  const { data: bankData, isLoading: bankLoading, error: bankError } = useUserBankData();
  
  // State for editable bank data
  const [editableBankData, setEditableBankData] = useState({
    iban: '',
    bic: '',
    bankName: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update editable bank data when real data is loaded
  useEffect(() => {
    if (bankData) {
      setEditableBankData({
        iban: bankData.iban || '',
        bic: bankData.bic || '',
        bankName: 'Commerzbank' // Keep default bank name for now
      });
    } else {
      // Fallback to default values if no bank data found
      setEditableBankData({
        iban: 'DE89 3704 0044 0532 0130 00',
        bic: 'COBADEFFXXX',
        bankName: 'Commerzbank'
      });
    }
  }, [bankData]);

  const personalInfo = {
    firstName: user?.user_metadata?.first_name || 'Max',
    lastName: user?.user_metadata?.last_name || 'Mustermann',
    email: user?.email || 'max.mustermann@example.com',
    phone: phoneNumber || user?.user_metadata?.phone || '+49 123 456789',
    joinDate: '15. Januar 2024'
  };

  const handleBankDataChange = (field: string, value: string) => {
    setEditableBankData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveBankData = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Update the employment contract with new bank data
      const { error } = await supabase
        .from('employment_contracts')
        .update({
          iban: editableBankData.iban,
          bic: editableBankData.bic || null
        })
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('❌ Error updating bank data:', error);
        toast.error('Fehler beim Speichern der Bankdaten');
      } else {
        console.log('✅ Bank data updated successfully');
        toast.success('Bankdaten erfolgreich gespeichert');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('Fehler beim Speichern der Bankdaten');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (bankLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
              <p className="text-gray-500">Lade Bankdaten...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (bankError) {
    console.error('Bank data error:', bankError);
  }

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
            {!bankData && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Standardwerte
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]">
            {/* Bank Card - Left Side */}
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-sm h-60 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-300 p-6 text-white animate-fade-in">
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
                      {editableBankData.iban}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs opacity-80">BIC</p>
                      <p className="text-sm font-mono">
                        {editableBankData.bic}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-80">BANK</p>
                      <p className="text-sm">{editableBankData.bankName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields - Right Side */}
            <div className="flex flex-col justify-center h-full space-y-6">
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
                    value={editableBankData.iban}
                    onChange={(e) => handleBankDataChange('iban', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bic">BIC</Label>
                  <Input
                    id="bic"
                    value={editableBankData.bic}
                    onChange={(e) => handleBankDataChange('bic', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bankName">Bank</Label>
                  <Input
                    id="bankName"
                    value={editableBankData.bankName}
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

              {!bankData && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-700">
                    <strong>Hinweis:</strong> Es wurden keine Bankdaten aus Ihrem Arbeitsvertrag gefunden. 
                    Es werden Standardwerte angezeigt. Sie können diese bearbeiten und speichern.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDataTab;
