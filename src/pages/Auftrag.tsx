
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Smartphone, Download, User, Mail, MessageCircle, Target, Search, Sync } from 'lucide-react';

const Auftrag = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Smartphone className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Auftrag 093399: XXX
              </h1>
            </div>
            <p className="text-gray-600">
              App-Testing Auftrag - Google Keep
            </p>
          </div>

          {/* Auftragsinformationen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Auftragsinformationen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Auftragsnummer:</h3>
                  <p className="text-gray-700">093399: XXX</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Anbieter:</h3>
                  <p className="text-gray-700">Google</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projektziel */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Projektziel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Testen Sie die Funktionalität und Benutzerfreundlichkeit der offiziellen Google Keep App, indem Sie die 
                Notizerstellung, Suchfunktionen und Synchronisationsmöglichkeiten untersuchen, um die Effizienz und 
                Anwenderfreundlichkeit der App zu bewerten.
              </p>
            </CardContent>
          </Card>

          {/* Download-Links */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-orange-500" />
                Download-Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">App Store:</h3>
                  <a 
                    href="https://apps.apple.com/de/app/google-keep-notes-and-lists/id1029207872" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    https://apps.apple.com/de/app/google-keep-notes-and-lists/id1029207872
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Google Play Store:</h3>
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.google.android.keep&hl=de&gl=DE" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    https://play.google.com/store/apps/details?id=com.google.android.keep&hl=de&gl=DE
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anweisungen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Anweisungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* App-Setup */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    App-Setup:
                  </h3>
                  <p className="text-gray-700">
                    Installieren Sie die App und loggen Sie sich mit Ihrem Google-Konto ein, um auf alle Funktionen zugreifen zu können.
                  </p>
                </div>

                <Separator />

                {/* Notizerstellung und -verwaltung */}
                <div>
                  <h3 className="font-semibold mb-3">Notizerstellung und -verwaltung:</h3>
                  <p className="text-gray-700">
                    Testen Sie das Erstellen von Textnotizen, Listen und das Hinzufügen von Bildern oder Audioaufnahmen zu Ihren Notizen.
                  </p>
                </div>

                <Separator />

                {/* Such- und Organisationsfunktionen */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Such- und Organisationsfunktionen:
                  </h3>
                  <p className="text-gray-700">
                    Nutzen Sie die Suchfunktion, um spezifische Notizen schnell zu finden. Bewerten Sie, wie effektiv das 
                    Farbkodieren und das Labeln von Notizen bei der Organisation hilft.
                  </p>
                </div>

                <Separator />

                {/* Synchronisation */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sync className="h-4 w-4" />
                    Synchronisation und plattformübergreifende Nutzung:
                  </h3>
                  <p className="text-gray-700">
                    Überprüfen Sie die Synchronisationsfähigkeiten der App, indem Sie die Notizen auf verschiedenen Geräten (z.B. 
                    Telefon, Tablet, Web) bearbeiten und auf Konsistenz prüfen.
                  </p>
                </div>

                <Separator />

                {/* Erinnerungen */}
                <div>
                  <h3 className="font-semibold mb-3">Erinnerungen und Benachrichtigungen:</h3>
                  <p className="text-gray-700">
                    Setzen Sie Erinnerungen für bestimmte Notizen und testen Sie, wie gut die App Sie zu den gewünschten Zeiten 
                    benachrichtigt, einschließlich standortbasierter Erinnerungen.
                  </p>
                </div>

                <Separator />

                {/* Abschluss */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Nach Abschluss des Tests</strong> geben Sie Ihr Feedback und alle gesammelten Daten an die Projektleitung weiter.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Kontakt bei Fragen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Bei Fragen oder Unklarheiten wenden Sie sich bitte an:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Friedrich Hautmann</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-700">Live Chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <a 
                      href="mailto:f.hautmann@sls-advisors.net" 
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      f.hautmann@sls-advisors.net
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auftrag;
