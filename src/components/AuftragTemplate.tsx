
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Smartphone, Download, User, Mail, Target } from 'lucide-react';
import { Auftrag } from '@/types/auftrag';
import * as LucideIcons from 'lucide-react';

interface AuftragTemplateProps {
  auftrag: Auftrag;
}

const AuftragTemplate = ({ auftrag }: AuftragTemplateProps) => {
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    
    // Get the icon component dynamically
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    return null;
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
                Auftrag {auftrag.auftragsnummer}: {auftrag.title}
              </h1>
            </div>
            <p className="text-gray-600">
              App-Testing Auftrag - {auftrag.anbieter}
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
                  <p className="text-gray-700">{auftrag.auftragsnummer}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Anbieter:</h3>
                  <p className="text-gray-700">{auftrag.anbieter}</p>
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
              <p className="text-gray-700">{auftrag.projektziel}</p>
            </CardContent>
          </Card>

          {/* Download-Links (Optional) */}
          {auftrag.show_download_links && (auftrag.app_store_link || auftrag.google_play_link) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-orange-500" />
                  Download-Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auftrag.app_store_link && (
                    <div>
                      <h3 className="font-semibold mb-2">App Store:</h3>
                      <a 
                        href={auftrag.app_store_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {auftrag.app_store_link}
                      </a>
                    </div>
                  )}
                  {auftrag.google_play_link && (
                    <div>
                      <h3 className="font-semibold mb-2">Google Play Store:</h3>
                      <a 
                        href={auftrag.google_play_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {auftrag.google_play_link}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                {auftrag.anweisungen.map((anweisung, index) => (
                  <div key={anweisung.id}>
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        {getIcon(anweisung.icon)}
                        {anweisung.title}
                      </h3>
                      <p className="text-gray-700">{anweisung.content}</p>
                    </div>
                    {index < auftrag.anweisungen.length - 1 && <Separator />}
                  </div>
                ))}
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
                <h3 className="font-semibold mb-3">{auftrag.kontakt_name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <a 
                      href={`mailto:${auftrag.kontakt_email}`} 
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {auftrag.kontakt_email}
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
