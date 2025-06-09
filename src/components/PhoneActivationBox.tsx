
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, MessageSquare, Clock } from 'lucide-react';

const PhoneActivationBox = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'input' | 'waiting' | 'code'>('input');
  const [smsCode, setSmsCode] = useState('');

  const handleRequestCode = () => {
    if (phoneNumber.trim()) {
      setStep('waiting');
      // Simulate waiting for SMS
      setTimeout(() => {
        setStep('code');
      }, 2000);
    }
  };

  const handleVerifyCode = () => {
    if (smsCode.trim()) {
      // Handle verification logic here
      console.log('Verifying code:', smsCode);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-orange-500" />
          Telefonnummer aktivieren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'input' && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Telefonnummer eingeben
              </label>
              <Input
                type="tel"
                placeholder="+49 123 456 789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleRequestCode}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={!phoneNumber.trim()}
            >
              SMS-Code anfordern
            </Button>
          </>
        )}

        {step === 'waiting' && (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-600">
              SMS wird versendet...
            </p>
          </div>
        )}

        {step === 'code' && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                SMS-Code eingeben
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="w-full text-center text-lg font-mono"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleVerifyCode}
              className="w-full bg-green-500 hover:bg-green-600"
              disabled={!smsCode.trim()}
            >
              Code bestätigen
            </Button>
            <Button 
              onClick={() => setStep('input')}
              variant="outline"
              className="w-full"
            >
              Neue Nummer eingeben
            </Button>
          </>
        )}

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Warum Telefonnummer?</p>
              <p>
                Für manche Aufträge benötigen Sie eine verifizierte Telefonnummer 
                zur SMS-Aktivierung von Apps oder Diensten.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhoneActivationBox;
