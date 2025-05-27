
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, Mail, Home } from 'lucide-react';
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

const AppointmentSuccess = ({ selectedDate, selectedTime, recipient }: AppointmentSuccessProps) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="shadow-lg border-green-200">
        <CardContent className="pt-12 pb-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                Termin erfolgreich gebucht!
              </h2>
              <p className="text-gray-600">
                Vielen Dank für Ihre Buchung. Ihr Termin wurde bestätigt.
              </p>
            </div>

            {selectedDate && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ihre Termindetails
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3 text-gray-700">
                    <Calendar className="h-5 w-5 text-orange" />
                    <span className="font-medium">
                      {format(selectedDate, 'PPPP', { locale: de })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 text-gray-700">
                    <Clock className="h-5 w-5 text-orange" />
                    <span className="font-medium">{selectedTime} Uhr</span>
                  </div>
                </div>
              </div>
            )}

            {recipient && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Mail className="h-5 w-5" />
                  <span className="text-sm">
                    Eine Bestätigungsmail wurde an <strong>{recipient.email}</strong> gesendet
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Was passiert als nächstes?</strong></p>
                <ul className="text-left space-y-1 max-w-md mx-auto">
                  <li>• Sie erhalten eine Bestätigungsmail mit allen Details</li>
                  <li>• Bitte notieren Sie sich den Termin in Ihrem Kalender</li>
                  <li>• Bei Fragen kontaktieren Sie uns gerne im Voraus</li>
                  <li>• Falls Sie den Termin nicht wahrnehmen können, informieren Sie uns bitte rechtzeitig</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-orange hover:bg-orange/90 px-6"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Zur Startseite
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentSuccess;
