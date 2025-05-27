
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AppointmentConfirmationProps {
  selectedDate: Date;
  selectedTime: string;
  onConfirm: () => void;
  onBack: () => void;
  isBooking: boolean;
}

const AppointmentConfirmation = ({ 
  selectedDate, 
  selectedTime, 
  onConfirm, 
  onBack, 
  isBooking 
}: AppointmentConfirmationProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
              disabled={isBooking}
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 justify-center">
                <CheckCircle className="h-5 w-5" />
                Termin bestätigen
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-orange/10 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bitte bestätigen Sie Ihren Termin
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <Calendar className="h-5 w-5 text-orange" />
                  <span className="font-medium">
                    {format(selectedDate, 'PPPP', { locale: de })}
                  </span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5 text-orange" />
                  <span className="font-medium">{selectedTime} Uhr</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 border-t pt-4">
                <p className="mb-2">
                  <strong>Wichtige Hinweise:</strong>
                </p>
                <ul className="text-left space-y-1 max-w-md mx-auto">
                  <li>• Sie erhalten eine Bestätigungsmail nach der Buchung</li>
                  <li>• Bitte seien Sie pünktlich zum vereinbarten Termin</li>
                  <li>• Bei Fragen kontaktieren Sie uns bitte im Voraus</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={onBack}
                variant="outline"
                disabled={isBooking}
                className="px-6"
              >
                Ändern
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isBooking}
                className="bg-orange hover:bg-orange/90 px-8"
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird gebucht...
                  </>
                ) : (
                  'Termin buchen'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentConfirmation;
