
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const EvaluationSuccess = () => {
  const navigate = useNavigate();
  const { assignmentUrl } = useParams<{ assignmentUrl: string }>();

  useEffect(() => {
    // Auto-redirect to dashboard after 10 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center px-4">
        <Card className="max-w-md w-full mx-auto">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bewertung eingereicht!
              </h1>
              <p className="text-gray-600 mb-4">
                Vielen Dank für Ihre Bewertung. Sie wurde erfolgreich eingereicht.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-800">Status: In Überprüfung</h3>
                  <p className="text-sm text-blue-700">
                    Ihre Bewertung wird nun von unserem Team überprüft. Sie erhalten eine Benachrichtigung, sobald die Überprüfung abgeschlossen ist.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-orange hover:bg-orange-dark text-white"
              >
                Zurück zum Dashboard
              </Button>
              
              {assignmentUrl && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/assignment-detail/${encodeURIComponent(assignmentUrl)}`)}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zum Auftrag
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Sie werden in 10 Sekunden automatisch zum Dashboard weitergeleitet.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default EvaluationSuccess;
