import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Smartphone, Download, Target, Key, Phone, Eye, ExternalLink, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSMS } from '@/context/SMSContext';
import EvaluationForm from '@/components/EvaluationForm';
import UserForm from '@/components/UserForm';
import RequestStatus from '@/components/RequestStatus';
import ProblemReportForm from '@/components/ProblemReportForm';
import LiveChatWidget from '@/components/LiveChatWidget';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

const iconMap = {
  'smartphone': Smartphone,
  'search': Target,
  'refresh-ccw': RefreshCw,
  'arrow-down': ArrowLeft,
  'arrow-up': ArrowLeft,
  'mouse-pointer-click': Eye,
  'file-down': Download,
  'trash-2': Target,
};

const AssignmentDetail = () => {
  const { assignmentUrl } = useParams<{ assignmentUrl: string }>();
  const navigate = useNavigate();
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [evaluationQuestions, setEvaluationQuestions] = useState<EvaluationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { currentRequest, resetCurrentRequest, showSimulation } = useSMS();

  useEffect(() => {
    if (assignmentUrl) {
      console.log('🔍 Assignment URL from params:', assignmentUrl);
      fetchAssignmentData();
    }
  }, [assignmentUrl]);

  const fetchAssignmentData = async () => {
    if (!assignmentUrl) return;
    
    console.log('📡 Starting to fetch assignment data for URL:', assignmentUrl);
    setIsLoading(true);
    try {
      const decodedUrl = decodeURIComponent(assignmentUrl);
      console.log('🔓 Decoded URL:', decodedUrl);

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('auftrag_assignments')
        .select(`
          *,
          auftraege(*)
        `)
        .eq('assignment_url', decodedUrl)
        .single();

      console.log('📋 Raw assignment data from database:', assignmentData);
      console.log('❌ Assignment query error:', assignmentError);

      if (assignmentError) throw assignmentError;
      
      // Log specific access data fields
      console.log('🔑 Access data debug:');
      console.log('  - ident_code:', assignmentData.ident_code);
      console.log('  - ident_link:', assignmentData.ident_link);
      console.log('  - access_email:', assignmentData.access_email);
      console.log('  - access_password:', assignmentData.access_password);
      console.log('  - access_phone:', assignmentData.access_phone);
      
      const typedAssignmentData: AssignmentData = {
        ...assignmentData,
        auftraege: {
          ...assignmentData.auftraege,
          anweisungen: Array.isArray(assignmentData.auftraege.anweisungen) 
            ? assignmentData.auftraege.anweisungen 
            : []
        }
      };
      
      console.log('✅ Processed assignment data:', typedAssignmentData);
      setAssignmentData(typedAssignmentData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('evaluation_questions')
        .select('*')
        .eq('auftrag_id', assignmentData.auftraege.id)
        .order('question_order');

      if (questionsError) throw questionsError;
      
      setEvaluationQuestions(questionsData || []);
    } catch (error) {
      console.error('💥 Error fetching assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluationComplete = () => {
    fetchAssignmentData();
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap];
  };

  const shouldShowUserForm = !currentRequest || (currentRequest && showSimulation && currentRequest.status === 'pending');
  const shouldShowRequestStatus = currentRequest && !showSimulation;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto mb-4"></div>
            <p className="text-gray-500">Lade Auftrag...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Auftrag nicht gefunden</h2>
            <p className="text-gray-500 mb-4">Der angeforderte Auftrag konnte nicht gefunden werden.</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-orange hover:bg-orange-dark text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const data = assignmentData.auftraege;
  
  // Enhanced debugging for hasAccessData condition
  const hasAccessData = assignmentData && (
    assignmentData.ident_code || 
    assignmentData.ident_link || 
    assignmentData.access_email || 
    assignmentData.access_password || 
    assignmentData.access_phone
  );
  
  console.log('🔍 hasAccessData evaluation:');
  console.log('  - assignmentData exists:', !!assignmentData);
  console.log('  - ident_code truthy:', !!assignmentData.ident_code);
  console.log('  - ident_link truthy:', !!assignmentData.ident_link);
  console.log('  - access_email truthy:', !!assignmentData.access_email);
  console.log('  - access_password truthy:', !!assignmentData.access_password);
  console.log('  - access_phone truthy:', !!assignmentData.access_phone);
  console.log('  - FINAL hasAccessData result:', hasAccessData);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-orange-500" />
              Auftrag {data.auftragsnummer}
            </h1>
            <p className="text-gray-600">{data.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-3 space-y-6">
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
                          Zur Website
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
                <p className="text-gray-700">{data.projektziel}</p>
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
          </div>

          {/* Right Column - Tools and Support */}
          <div className="xl:col-span-1 space-y-6">
            {/* Nummer aktivieren */}
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
                        <RefreshCw className="h-3 w-3" /> Neue Anfrage
                      </Button>
                    )}
                    <ProblemReportForm phone={currentRequest?.phone} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shouldShowUserForm && <UserForm />}
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

        {/* Full Width Instructions and Evaluation Section */}
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <p className="text-gray-700">{instruction.content}</p>
                        </div>
                        {index < data.anweisungen.length - 1 && <hr className="mt-6" />}
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
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-green-800 mb-2">
                        Vielen Dank für Ihre Bewertung!
                      </h3>
                      <p className="text-green-700">
                        Ihre Bewertung wurde erfolgreich eingereicht und wird nun bearbeitet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AssignmentDetail;
