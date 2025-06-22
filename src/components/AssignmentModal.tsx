
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText, Smartphone, Download, Target, Search, RefreshCw, ArrowDown, ArrowUp, Key, Phone, Eye, MousePointerClick, FileDown, Trash2, ExternalLink, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSMS } from '@/context/SMSContext';
import EvaluationForm from '@/components/EvaluationForm';
import UserForm from '@/components/UserForm';
import RequestStatus from '@/components/RequestStatus';
import ProblemReportForm from '@/components/ProblemReportForm';
import LiveChatWidget from '@/components/LiveChatWidget';

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

interface AssignmentModalProps {
  assignmentUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEvaluationComplete?: () => void;
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

const AssignmentModal = ({ assignmentUrl, open, onOpenChange, onEvaluationComplete }: AssignmentModalProps) => {
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [evaluationQuestions, setEvaluationQuestions] = useState<EvaluationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { currentRequest, resetCurrentRequest, showSimulation } = useSMS();

  useEffect(() => {
    if (assignmentUrl && open) {
      fetchAssignmentData();
    }
  }, [assignmentUrl, open]);

  const fetchAssignmentData = async () => {
    if (!assignmentUrl) return;
    
    setIsLoading(true);
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
    onEvaluationComplete?.();
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap];
  };

  const shouldShowUserForm = !currentRequest || (currentRequest && showSimulation && currentRequest.status === 'pending');
  const shouldShowRequestStatus = currentRequest && !showSimulation;

  if (!assignmentData && !isLoading) {
    return null;
  }

  const data = assignmentData?.auftraege;
  const hasAccessData = assignmentData && (assignmentData.ident_code || assignmentData.ident_link || assignmentData.access_email || assignmentData.access_password || assignmentData.access_phone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-orange-500" />
            {data ? `Auftrag ${data.auftragsnummer}` : 'Lade Auftrag...'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto mb-4"></div>
              <p className="text-gray-500">Lade Auftrag...</p>
            </div>
          </div>
        ) : data && assignmentData ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-4">
              {/* Auftragsinformationen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Auftragsinformationen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Auftragsnummer:</h3>
                      <p className="text-gray-700 text-sm">{data.auftragsnummer}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Anbieter:</h3>
                      <p className="text-gray-700 text-sm">{data.anbieter}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zugangsdaten */}
              {hasAccessData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Key className="h-4 w-4 text-orange-500" />
                      Zugangsdaten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {assignmentData.ident_code && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm">Ident Code:</h3>
                          <p className="text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded text-sm">
                            {assignmentData.ident_code}
                          </p>
                        </div>
                      )}
                      {assignmentData.ident_link && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm">Ident Link:</h3>
                          <a 
                            href={assignmentData.ident_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Zur Identifikation
                          </a>
                        </div>
                      )}
                      {assignmentData.access_email && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm">E-Mail:</h3>
                          <p className="text-gray-700 text-sm">{assignmentData.access_email}</p>
                        </div>
                      )}
                      {assignmentData.access_password && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm">Passwort:</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded flex-1 text-sm">
                              {showPassword ? assignmentData.access_password : '••••••••'}
                            </p>
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      {assignmentData.access_phone && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm">Telefonnummer:</h3>
                          <p className="text-gray-700 flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
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
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-orange-500" />
                    Projektziel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm">{data.projektziel}</p>
                </CardContent>
              </Card>

              {/* Download-Links */}
              {data.show_download_links && (data.app_store_link || data.google_play_link) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Download className="h-4 w-4 text-orange-500" />
                      Download-Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.app_store_link && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm">App Store:</h3>
                          <a 
                            href={data.app_store_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                          >
                            {data.app_store_link}
                          </a>
                        </div>
                      )}
                      {data.google_play_link && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm">Google Play Store:</h3>
                          <a 
                            href={data.google_play_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
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
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-orange-500" />
                      Anweisungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.anweisungen.map((instruction: any, index) => (
                        <div key={instruction.id}>
                          <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                              {instruction.icon && getIconComponent(instruction.icon) && (
                                (() => {
                                  const IconComponent = getIconComponent(instruction.icon);
                                  return <IconComponent className="h-3 w-3" />;
                                })()
                              )}
                              {instruction.title}
                            </h3>
                            <p className="text-gray-700 text-sm">{instruction.content}</p>
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
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <FileText className="h-4 w-4" />
                      <p className="font-medium text-sm">Vielen Dank für Ihre Bewertung!</p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Ihre Bewertung wurde erfolgreich eingereicht.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Tools and Support */}
            <div className="xl:col-span-1 space-y-4">
              {/* Nummer aktivieren */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-orange-500" />
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
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Auftrag nicht gefunden</h2>
            <p className="text-gray-500">Der angeforderte Auftrag konnte nicht gefunden werden.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;
