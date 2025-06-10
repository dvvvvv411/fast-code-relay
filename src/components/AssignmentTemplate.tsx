import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EvaluationForm from '@/components/EvaluationForm';
import UserForm from '@/components/UserForm';
import RequestStatus from '@/components/RequestStatus';
import ProblemReportForm from '@/components/ProblemReportForm';
import LiveChatWidget from '@/components/LiveChatWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText, Smartphone, Download, Target, Search, RefreshCw, ArrowDown, ArrowUp, Key, Phone, Eye, MousePointerClick, FileDown, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSMS } from '@/context/SMSContext';

interface AssignmentData {
  id: string;
  assignment_url: string;
  worker_first_name: string;
  worker_last_name: string;
  ident_code: string | null;
  ident_link: string | null;
  access_email: string | null;
  access_password: string | null;
  access_phone: string | null;
  is_completed: boolean;
  is_evaluated: boolean;
  auftraege: {
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
  };
}

interface EvaluationQuestion {
  id: string;
  question_text: string;
  question_order: number;
}

interface AssignmentTemplateProps {
  assignmentUrl?: string;
}

const iconMap = {
  'smartphone': Smartphone,
  'search': Search,
  'refresh-ccw': RefreshCw,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  'mouse-pointer-click': MousePointerClick,
  'file-down': FileDown,
  'trash-2': Trash2,
};

const AssignmentTemplate = ({ assignmentUrl }: AssignmentTemplateProps) => {
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [evaluationQuestions, setEvaluationQuestions] = useState<EvaluationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(!!assignmentUrl);
  const [showPassword, setShowPassword] = useState(false);
  const { currentRequest, resetCurrentRequest, showSimulation } = useSMS();

  useEffect(() => {
    if (assignmentUrl) {
      fetchAssignmentData();
    }
  }, [assignmentUrl]);

  const fetchAssignmentData = async () => {
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('auftrag_assignments')
        .select(`
          *,
          auftraege(*)
        `)
        .eq('assignment_url', assignmentUrl)
        .single();

      if (assignmentError) throw assignmentError;
      
      // Type cast the anweisungen to ensure it's an array
      const typedAssignmentData: AssignmentData = {
        ...assignmentData,
        auftraege: {
          ...assignmentData.auftraege,
          anweisungen: Array.isArray(assignmentData.auftraege.anweisungen) 
            ? assignmentData.auftraege.anweisungen 
            : []
        }
      };
      
      setAssignmentData(typedAssignmentData);

      // Fetch evaluation questions for this auftrag
      const { data: questionsData, error: questionsError } = await supabase
        .from('evaluation_questions')
        .select('*')
        .eq('auftrag_id', assignmentData.auftraege.id)
        .order('question_order');

      if (questionsError) throw questionsError;
      
      setEvaluationQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluationComplete = () => {
    fetchAssignmentData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Lade Auftrag...</p>
        </div>
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auftrag nicht gefunden</h1>
          <p className="text-gray-500">Der angeforderte Auftrag konnte nicht gefunden werden.</p>
        </div>
      </div>
    );
  }

  const data = assignmentData.auftraege;
  const hasAccessData = assignmentData.ident_code || assignmentData.ident_link || assignmentData.access_email || assignmentData.access_password || assignmentData.access_phone;

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap];
  };

  // Show UserForm if no request OR if simulation is running
  // Show RequestStatus if there's a request AND simulation is not running
  const shouldShowUserForm = !currentRequest || (currentRequest && showSimulation && currentRequest.status === 'pending');
  const shouldShowRequestStatus = currentRequest && !showSimulation;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>Expandere - Auftragsbearbeitung: {data.title}</title>
        <meta name="description" content={`Persönlicher Auftrag für ${assignmentData.worker_first_name} ${assignmentData.worker_last_name} - ${data.anbieter} ${data.auftragsnummer}. ${data.projektziel.substring(0, 150)}...`} />
      </Helmet>
      
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Smartphone className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Auftrag {data.auftragsnummer}
              </h1>
            </div>
            <p className="text-gray-600 mb-2">
              {data.title}
            </p>
            <p className="text-sm text-gray-500">
              Zugewiesen an: <strong>{assignmentData.worker_first_name} {assignmentData.worker_last_name}</strong>
            </p>
          </div>

          {/* Main 2-Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Auftragsinformationen */}
              <Card>
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

              {/* Zugangsdaten */}
              {hasAccessData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-orange-500" />
                      Zugangsdaten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {assignmentData.ident_code && (
                        <div>
                          <h3 className="font-semibold mb-2">Ident Code:</h3>
                          <p className="text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded">
                            {assignmentData.ident_code}
                          </p>
                        </div>
                      )}
                      {assignmentData.ident_link && (
                        <div>
                          <h3 className="font-semibold mb-2">Ident Link:</h3>
                          <a 
                            href={assignmentData.ident_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Zur Identifikation
                          </a>
                        </div>
                      )}
                      {assignmentData.access_email && (
                        <div>
                          <h3 className="font-semibold mb-2">E-Mail:</h3>
                          <p className="text-gray-700">{assignmentData.access_email}</p>
                        </div>
                      )}
                      {assignmentData.access_password && (
                        <div>
                          <h3 className="font-semibold mb-2">Passwort:</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded flex-1">
                              {showPassword ? assignmentData.access_password : '••••••••'}
                            </p>
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      {assignmentData.access_phone && (
                        <div>
                          <h3 className="font-semibold mb-2">Telefonnummer:</h3>
                          <p className="text-gray-700 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {assignmentData.access_phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Projektziel */}
              <Card>
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
                <Card>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-500" />
                      Anweisungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {data.anweisungen.map((instruction: any, index) => (
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

              {/* Bewertungsform */}
              {evaluationQuestions.length > 0 && !assignmentData.is_evaluated && (
                <div>
                  <EvaluationForm
                    assignmentId={assignmentData.id}
                    questions={evaluationQuestions}
                    onEvaluationComplete={handleEvaluationComplete}
                  />
                </div>
              )}

              {/* Bewertung abgeschlossen */}
              {assignmentData.is_evaluated && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <FileText className="h-5 w-5" />
                      <p className="font-medium">Vielen Dank für Ihre Bewertung!</p>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      Ihre Bewertung wurde erfolgreich eingereicht.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Tools and Support */}
            <div className="xl:col-span-1 space-y-6">
              {/* Nummer aktivieren - Exactly like on the landing page */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-orange-500" />
                      Nummer aktivieren
                    </div>
                    <div className="flex items-center gap-2">
                      {currentRequest && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={resetCurrentRequest} 
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="h-4 w-4" /> Neue Anfrage
                        </Button>
                      )}
                      <ProblemReportForm phone={currentRequest?.phone} />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Show UserForm if no request OR if simulation is running */}
                  {shouldShowUserForm && <UserForm />}
                  
                  {/* Show RequestStatus if there's a request AND simulation is not running */}
                  {shouldShowRequestStatus && <RequestStatus />}
                </CardContent>
              </Card>
              
              {/* Live Chat Widget */}
              <LiveChatWidget 
                assignmentId={assignmentData.id}
                workerName={`${assignmentData.worker_first_name} ${assignmentData.worker_last_name}`}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AssignmentTemplate;
