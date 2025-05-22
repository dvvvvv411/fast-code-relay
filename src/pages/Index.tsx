import Header from '@/components/Header';
import UserForm from '@/components/UserForm';
import RequestStatus from '@/components/RequestStatus';
import { Toaster } from "@/components/ui/toaster";
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Shield, MessageSquare, Clock } from 'lucide-react';
import ProblemReportForm from '@/components/ProblemReportForm';
import { useSMS } from '@/context/SMSContext';

const Index = () => {
  const { currentRequest } = useSMS();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Empfangen Sie jetzt Ihren <br className="hidden md:block" />
              <span className="text-orange-500">SMS</span> Code
            </h1>
            <p className="text-gray-600 mb-6">
              Geben Sie die Informationen, die Sie in der E-Mail erhalten haben, ein und aktivieren Sie Ihre Nummer
            </p>
          </div>
          
          {/* Form and Status Container */}
          <div className="grid md:grid-cols-5 gap-8 mb-16">
            <div className="md:col-span-3">
              {/* Form Container */}
              <div className="bg-white p-8 rounded-lg shadow-md form-container transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Nummer aktivieren</h2>
                  <ProblemReportForm phone={currentRequest?.phone} />
                </div>
                
                {/* Show either the UserForm or RequestStatus based on request state */}
                {(!currentRequest || currentRequest.status === 'completed') ? (
                  <UserForm />
                ) : (
                  <RequestStatus />
                )}
              </div>
            </div>
            
            {/* Features Card */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <Card className="bg-white shadow-md">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Warum unser SMS-Dienst?</h2>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="mt-1 text-orange-500"><Shield className="h-5 w-5" /></div>
                      <div>
                        <h3 className="font-medium">Sicher & Zuverlässig</h3>
                        <p className="text-sm text-gray-600">Verschlüsselte Übertragung und höchste Sicherheitsstandards für Ihre Daten.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 text-orange-500"><Clock className="h-5 w-5" /></div>
                      <div>
                        <h3 className="font-medium">Schnelle Zustellung</h3>
                        <p className="text-sm text-gray-600">Erhalten Sie Ihren Code innerhalb weniger Sekunden nach Aktivierung.</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 text-orange-500"><MessageSquare className="h-5 w-5" /></div>
                      <div>
                        <h3 className="font-medium">Einfache Bedienung</h3>
                        <p className="text-sm text-gray-600">Unkomplizierter Prozess ohne unnötige Schritte oder Registrierungen.</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* How It Works Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">So funktioniert's</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-500 font-bold text-xl">1</span>
                </div>
                <h3 className="font-medium mb-2">Aktivieren Sie Ihre Nummer</h3>
                <p className="text-gray-600 text-sm">Geben Sie Ihre Telefonnummer und den Zugangscode ein, den Sie per E-Mail erhalten haben.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-500 font-bold text-xl">2</span>
                </div>
                <h3 className="font-medium mb-2">Fordern Sie den SMS-Code an</h3>
                <p className="text-gray-600 text-sm">Nach erfolgreicher Aktivierung können Sie mit einem Klick Ihren SMS-Code anfordern.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-500 font-bold text-xl">3</span>
                </div>
                <h3 className="font-medium mb-2">Code erhalten & verwenden</h3>
                <p className="text-gray-600 text-sm">Sobald der Code eintrifft, wird er angezeigt und steht Ihnen zur Verfügung.</p>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Häufig gestellte Fragen</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-medium mb-2">Wie lange ist ein SMS-Code gültig?</h3>
                <p className="text-gray-600 text-sm">Die Gültigkeit des Codes hängt vom jeweiligen Dienst ab. In der Regel sind SMS-Codes für 5-15 Minuten gültig.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-medium mb-2">Was passiert, wenn ich keinen Code erhalte?</h3>
                <p className="text-gray-600 text-sm">Sie können den Code erneut anfordern. Falls weiterhin Probleme bestehen, melden Sie diese über den "Problem melden" Button.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-medium mb-2">Muss ich mich registrieren?</h3>
                <p className="text-gray-600 text-sm">Nein, eine Registrierung ist nicht erforderlich. Sie benötigen nur Ihre Telefonnummer und den Zugangscode.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-medium mb-2">Fallen Kosten für die SMS an?</h3>
                <p className="text-gray-600 text-sm">Nein, für Sie entstehen keine Kosten beim Empfang der SMS-Codes über unseren Dienst.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
};

export default Index;
