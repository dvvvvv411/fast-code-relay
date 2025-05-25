
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, User, Phone, Mail, Building } from 'lucide-react';

const Auftrag = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Auftrag für SMS-Relay Service
              </h1>
            </div>
            <p className="text-gray-600">
              Detaillierte Auftragsübersicht und Vereinbarung
            </p>
          </div>

          {/* Auftraggeber Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-orange-500" />
                Auftraggeber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Firma/Organisation:</h3>
                  <p className="text-gray-700">Expandere Agentur</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Ansprechpartner:</h3>
                  <p className="text-gray-700">[Ansprechpartner Name]</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    E-Mail:
                  </h3>
                  <p className="text-gray-700">[E-Mail Adresse]</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Telefon:
                  </h3>
                  <p className="text-gray-700">[Telefonnummer]</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auftragsdetails */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Auftragsdetails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Gegenstand des Auftrags:</h3>
                  <p className="text-gray-700">
                    Bereitstellung und Betrieb eines SMS-Relay Services für die Weiterleitung 
                    von SMS-Nachrichten und Verifizierungscodes.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Leistungsumfang:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Bereitstellung von virtuellen Telefonnummern</li>
                    <li>Empfang und Weiterleitung von SMS-Nachrichten</li>
                    <li>Sichere Übertragung von Verifizierungscodes</li>
                    <li>24/7 Verfügbarkeit des Systems</li>
                    <li>Technischer Support und Wartung</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Technische Spezifikationen:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>REST-API für Integration</li>
                    <li>SSL-verschlüsselte Datenübertragung</li>
                    <li>Automatische Fehlerbehandlung</li>
                    <li>Echtzeit-Benachrichtigungen</li>
                    <li>Backup und Redundanz</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Laufzeit und Konditionen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Laufzeit und Konditionen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Vertragslaufzeit:</h3>
                  <p className="text-gray-700">[Laufzeit definieren]</p>
                  
                  <h3 className="font-semibold mb-2 mt-4">Kündigungsfrist:</h3>
                  <p className="text-gray-700">[Kündigungsfrist definieren]</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Vergütung:</h3>
                  <p className="text-gray-700">[Vergütungsmodell definieren]</p>
                  
                  <h3 className="font-semibold mb-2 mt-4">Zahlungskonditionen:</h3>
                  <p className="text-gray-700">[Zahlungskonditionen definieren]</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datenschutz und Sicherheit */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Datenschutz und Sicherheit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Datenschutzbestimmungen:</h3>
                  <p className="text-gray-700">
                    Alle verarbeiteten Daten werden gemäß der Datenschutz-Grundverordnung (DSGVO) 
                    behandelt. Personenbezogene Daten werden nur im erforderlichen Umfang verarbeitet 
                    und nach Zweckerfüllung gelöscht.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sicherheitsmaßnahmen:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Ende-zu-Ende-Verschlüsselung</li>
                    <li>Sichere Serverinfrastruktur</li>
                    <li>Regelmäßige Sicherheitsupdates</li>
                    <li>Monitoring und Logging</li>
                    <li>Zugriffskontrollen</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Haftung und Gewährleistung */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Haftung und Gewährleistung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Service Level Agreement (SLA):</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>99,9% Verfügbarkeit</li>
                    <li>Maximale Antwortzeit: 30 Sekunden</li>
                    <li>Support-Reaktionszeit: 4 Stunden</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Haftungsbeschränkung:</h3>
                  <p className="text-gray-700">
                    Die Haftung beschränkt sich auf Vorsatz und grobe Fahrlässigkeit. 
                    Für mittelbare Schäden wird keine Haftung übernommen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unterschriften */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Vertragsunterzeichnung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Auftraggeber:</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Datum:</p>
                      <div className="border-b border-gray-300 h-8"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unterschrift:</p>
                      <div className="border-b border-gray-300 h-12"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name (Druckschrift):</p>
                      <div className="border-b border-gray-300 h-8"></div>
                    </div>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Auftragnehmer:</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Datum:</p>
                      <div className="border-b border-gray-300 h-8"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unterschrift:</p>
                      <div className="border-b border-gray-300 h-12"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name (Druckschrift):</p>
                      <div className="border-b border-gray-300 h-8"></div>
                    </div>
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
