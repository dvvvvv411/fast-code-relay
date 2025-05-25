
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Smartphone, Download, User, Mail, Target, Search, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuftragData {
  id: string;
  title: string;
  auftragsnummer: string;
  anbieter: string;
  projektziel: string;
  app_store_link: string | null;
  google_play_link: string | null;
  show_download_links: boolean;
  anweisungen: any[];
  kontakt_name: string;
  kontakt_email: string;
}

interface Instruction {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

interface AuftragTemplateProps {
  auftragId?: string;
}

const iconMap = {
  'smartphone': Smartphone,
  'search': Search,
  'refresh-ccw': RefreshCw,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
};

const AuftragTemplate = ({ auftragId }: AuftragTemplateProps) => {
  const [auftragData, setAuftragData] = useState<AuftragData | null>(null);
  const [isLoading, setIsLoading] = useState(!!auftragId);

  useEffect(() => {
    if (auftragId) {
      fetchAuftragData();
    }
  }, [auftragId]);

  const fetchAuftragData = async () => {
    try {
      const { data, error } = await supabase
        .from('auftraege')
        .select('*')
        .eq('id', auftragId)
        .single();

      if (error) throw error;
      setAuftragData(data);
    } catch (error) {
      console.error('Error fetching auftrag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback to default data if no auftragId provided (original static content)
  const defaultData: AuftragData = {
    id: 'default',
    title: 'App-Testing Auftrag - Google Keep',
    auftragsnummer: '093399: XXX',
    anbieter: 'Google',
    projektziel: 'Testen Sie die Funktionalität und Benutzerfreundlichkeit der offiziellen Google Keep App, indem Sie die Notizerstellung, Suchfunktionen und Synchronisationsmöglichkeiten untersuchen, um die Effizienz und Anwenderfreundlichkeit der App zu bewerten.',
    app_store_link: 'https://apps.apple.com/de/app/google-keep-notes-and-lists/id1029207872',
    google_play_link: 'https://play.google.com/store/apps/details?id=com.google.android.keep&hl=de&gl=DE',
    show_download_links: true,
    anweisungen: [
      {
        id: '1',
        title: 'App-Setup:',
        content: 'Installieren Sie die App und loggen Sie sich mit Ihrem Google-Konto ein, um auf alle Funktionen zugreifen zu können.',
        icon: 'smartphone'
      },
      {
        id: '2',
        title: 'Notizerstellung und -verwaltung:',
        content: 'Testen Sie das Erstellen von Textnotizen, Listen und das Hinzufügen von Bildern oder Audioaufnahmen zu Ihren Notizen.',
        icon: ''
      },
      {
        id: '3',
        title: 'Such- und Organisationsfunktionen:',
        content: 'Nutzen Sie die Suchfunktion, um spezifische Notizen schnell zu finden. Bewerten Sie, wie effektiv das Farbkodieren und das Labeln von Notizen bei der Organisation hilft.',
        icon: 'search'
      },
      {
        id: '4',
        title: 'Synchronisation und plattformübergreifende Nutzung:',
        content: 'Überprüfen Sie die Synchronisationsfähigkeiten der App, indem Sie die Notizen auf verschiedenen Geräten (z.B. Telefon, Tablet, Web) bearbeiten und auf Konsistenz prüfen.',
        icon: 'refresh-ccw'
      },
      {
        id: '5',
        title: 'Erinnerungen und Benachrichtigungen:',
        content: 'Setzen Sie Erinnerungen für bestimmte Notizen und testen Sie, wie gut die App Sie zu den gewünschten Zeiten benachrichtigt, einschließlich standortbasierter Erinnerungen.',
        icon: ''
      }
    ],
    kontakt_name: 'Friedrich Hautmann',
    kontakt_email: 'f.hautmann@sls-advisors.net'
  };

  const data = auftragData || defaultData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Lade Auftrag...</p>
        </div>
      </div>
    );
  }

  if (auftragId && !auftragData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auftrag nicht gefunden</h1>
          <p className="text-gray-500">Der angeforderte Auftrag konnte nicht gefunden werden.</p>
        </div>
      </div>
    );
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap];
  };

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
                Auftrag {data.auftragsnummer}
              </h1>
            </div>
            <p className="text-gray-600">
              {data.title}
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
                  <p className="text-gray-700">{data.auftragsnummer}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Anbieter:</h3>
                  <p className="text-gray-700">{data.anbieter}</p>
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
                {data.projektziel}
              </p>
            </CardContent>
          </Card>

          {/* Download-Links */}
          {data.show_download_links && (data.app_store_link || data.google_play_link) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-orange-500" />
                  Download-Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.app_store_link && (
                    <div>
                      <h3 className="font-semibold mb-2">App Store:</h3>
                      <a 
                        href={data.app_store_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {data.app_store_link}
                      </a>
                    </div>
                  )}
                  {data.google_play_link && (
                    <div>
                      <h3 className="font-semibold mb-2">Google Play Store:</h3>
                      <a 
                        href={data.google_play_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {data.google_play_link}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anweisungen */}
          {data.anweisungen && data.anweisungen.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Anweisungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data.anweisungen.map((instruction: Instruction, index) => (
                    <div key={instruction.id}>
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          {instruction.icon && getIconComponent(instruction.icon) && (
                            (() => {
                              const IconComponent = getIconComponent(instruction.icon);
                              return <IconComponent className="h-4 w-4" />;
                            })()
                          )}
                          {instruction.title}
                        </h3>
                        <p className="text-gray-700">
                          {instruction.content}
                        </p>
                      </div>
                      {index < data.anweisungen.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                <h3 className="font-semibold mb-3">{data.kontakt_name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <a 
                      href={`mailto:${data.kontakt_email}`} 
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {data.kontakt_email}
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

export default AuftragTemplate;
