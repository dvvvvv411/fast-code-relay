
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, CheckCircle2, Clock, FileText } from 'lucide-react';

const AppointmentPreparation = () => {
  const preparationSteps = [
    {
      icon: Phone,
      title: "Telefon bereithalten",
      description: "Stellen Sie sicher, dass Ihr Telefon griffbereit ist."
    },
    {
      icon: FileText,
      title: "Unterlagen vorbereiten",
      description: "Halten Sie alle relevanten Dokumente bereit."
    },
    {
      icon: Clock,
      title: "Pünktlichkeit",
      description: "Seien Sie zur vereinbarten Zeit verfügbar."
    }
  ];

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card className="shadow-lg border-orange/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center text-orange">
            <Phone className="h-5 w-5" />
            Vorbereitung auf Ihren Termin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preparationSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-orange/5 border border-orange/10 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-orange" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Hinweis zum Telefonat</h4>
                <p className="text-sm text-blue-700">
                  Sie erhalten zum vereinbarten Zeitpunkt einen Anruf von unserem Team. 
                  Bitte stellen Sie sicher, dass Sie in einer ruhigen Umgebung sind und 
                  ausreichend Zeit für das Gespräch einplanen.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentPreparation;
