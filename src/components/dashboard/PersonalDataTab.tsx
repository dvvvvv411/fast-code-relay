
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, CreditCard, Mail, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PersonalDataTab = () => {
  const { user } = useAuth();

  // Mock bank data - in a real app, this would come from the user's profile or employment contract
  const bankData = {
    iban: 'DE89 3704 0044 0532 0130 00',
    bic: 'COBADEFFXXX',
    bankName: 'Commerzbank'
  };

  const personalInfo = {
    firstName: user?.user_metadata?.first_name || 'Max',
    lastName: user?.user_metadata?.last_name || 'Mustermann',
    email: user?.email || 'max.mustermann@example.com',
    joinDate: '15. Januar 2024'
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
          <div className="flex justify-center mb-6">
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Ihre Bankdaten werden sicher gespeichert und nur für Gehaltsauszahlungen verwendet.
              Bei Änderungen wenden Sie sich bitte an die Personalabteilung.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDataTab;
