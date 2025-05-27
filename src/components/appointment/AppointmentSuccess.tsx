
import React from 'react';
import { CheckCircle, Calendar, Clock, Mail, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Recipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AppointmentSuccessProps {
  selectedDate: Date | null;
  selectedTime: string;
  recipient: Recipient | null;
}

const AppointmentSuccess: React.FC<AppointmentSuccessProps> = ({
  selectedDate,
  selectedTime,
  recipient
}) => {
  const formattedDate = selectedDate ? format(selectedDate, 'EEEE, dd. MMMM yyyy', { locale: de }) : '';
  const formattedTime = selectedTime ? selectedTime.slice(0, 5) : '';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Termin erfolgreich gebucht!
            </h1>
            <p className="text-gray-600 text-lg">
              Vielen Dank, {recipient?.first_name}! Ihr Bewerbungsgespräch wurde bestätigt.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 mb-6 border border-green-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Ihre Termindetails
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 font-medium">Datum:</span>
                <span className="text-gray-700">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900 font-medium">Uhrzeit:</span>
                <span className="text-gray-700">{formattedTime} Uhr</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Bestätigung per E-Mail
            </h3>
            <p className="text-blue-800 mb-2">
              Eine Bestätigungs-E-Mail wurde an <strong>{recipient?.email}</strong> gesendet.
            </p>
            <p className="text-blue-700 text-sm">
              Bitte prüfen Sie auch Ihren Spam-Ordner, falls Sie die E-Mail nicht erhalten haben.
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-6 mb-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5 text-orange-600" />
              Wichtiger Hinweis
            </h3>
            <p className="text-orange-800 mb-2">
              Wir werden Sie kurz vor dem vereinbarten Termin telefonisch kontaktieren.
            </p>
            <p className="text-orange-700 text-sm">
              Bitte stellen Sie sicher, dass Sie zu der vereinbarten Zeit telefonisch erreichbar sind.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Was Sie erwartet:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                Persönliches Kennenlernen (ca. 30 Minuten)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                Vorstellung der Position und des Teams
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                Ihre Fragen zur Stelle und zum Unternehmen
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                Anruf kurz vor dem vereinbarten Termin
              </li>
            </ul>
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={() => window.close()}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
            >
              Fenster schließen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentSuccess;
