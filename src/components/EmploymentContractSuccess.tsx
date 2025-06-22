
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Lock, Clock } from 'lucide-react';

interface EmploymentContractSuccessProps {
  onBackToForm: () => void;
}

const EmploymentContractSuccess = ({ onBackToForm }: EmploymentContractSuccessProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className={`max-w-2xl w-full transition-all duration-700 transform ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className={`h-16 w-16 text-green-500 transition-all duration-1000 transform ${
                showAnimation ? 'scale-100 rotate-0' : 'scale-50 rotate-180'
              }`} />
              <div className={`absolute inset-0 rounded-full border-4 border-green-500 transition-all duration-1500 ${
                showAnimation ? 'animate-ping opacity-20' : 'opacity-0'
              }`} />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600 mb-2">
            Erfolgreich übermittelt!
          </CardTitle>
          <p className="text-gray-600">
            Ihre Vertragsdaten wurden sicher und erfolgreich übermittelt.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Security Confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-green-600 animate-pulse" />
              <h3 className="font-semibold text-green-800">Datensicherheit bestätigt</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Lock className="h-4 w-4" />
              <span>Alle Daten wurden verschlüsselt übertragen und sicher gespeichert</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange" />
              Wie geht es weiter?
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Clock className="h-5 w-5 text-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-800">Bearbeitung</p>
                  <p className="text-sm text-orange-600">
                    Wir bearbeiten Ihre Unterlagen und melden uns innerhalb von 1-2 Werktagen bei Ihnen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              Referenznummer: <strong>#{new Date().getTime().toString().slice(-8)}</strong>
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              Bewahren Sie diese Nummer für Ihre Unterlagen auf
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmploymentContractSuccess;
