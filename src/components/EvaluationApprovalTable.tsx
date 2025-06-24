
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface EvaluationRow {
  id: string;
  assignment_id: string;
  question_text: string;
  star_rating: number;
  text_feedback: string | null;
  status: string;
  created_at: string;
  worker_first_name: string;
  worker_last_name: string;
  auftrag_title: string;
  auftrag_auftragsnummer: string;
  rejection_reason: string | null;
}

const EvaluationApprovalTable = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingEvaluation, setProcessingEvaluation] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationRow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvaluations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('evaluations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluations'
        },
        () => {
          fetchEvaluations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          id,
          assignment_id,
          star_rating,
          text_feedback,
          status,
          created_at,
          rejection_reason,
          evaluation_questions!inner(question_text),
          auftrag_assignments!inner(
            worker_first_name,
            worker_last_name,
            auftraege!inner(title, auftragsnummer)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data?.map((item: any) => ({
        id: item.id,
        assignment_id: item.assignment_id,
        question_text: item.evaluation_questions.question_text,
        star_rating: item.star_rating,
        text_feedback: item.text_feedback,
        status: item.status,
        created_at: item.created_at,
        worker_first_name: item.auftrag_assignments.worker_first_name,
        worker_last_name: item.auftrag_assignments.worker_last_name,
        auftrag_title: item.auftrag_assignments.auftraege.title,
        auftrag_auftragsnummer: item.auftrag_assignments.auftraege.auftragsnummer,
        rejection_reason: item.rejection_reason
      })) || [];

      setEvaluations(transformedData);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast({
        title: "Fehler",
        description: "Bewertungen konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveEvaluation = async (evaluationId: string) => {
    if (!user?.id) return;

    setProcessingEvaluation(evaluationId);
    try {
      const { error } = await supabase
        .from('evaluations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          rejection_reason: null
        })
        .eq('id', evaluationId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Bewertung erfolgreich genehmigt.",
      });
    } catch (error) {
      console.error('Error approving evaluation:', error);
      toast({
        title: "Fehler",
        description: "Bewertung konnte nicht genehmigt werden.",
        variant: "destructive"
      });
    } finally {
      setProcessingEvaluation(null);
    }
  };

  const handleRejectEvaluation = async (evaluationId: string, reason: string) => {
    if (!user?.id || !reason.trim()) return;

    setProcessingEvaluation(evaluationId);
    try {
      const { error } = await supabase
        .from('evaluations')
        .update({
          status: 'rejected',
          approved_at: null,
          approved_by: user.id,
          rejection_reason: reason.trim()
        })
        .eq('id', evaluationId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Bewertung wurde abgelehnt.",
      });

      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting evaluation:', error);
      toast({
        title: "Fehler",
        description: "Bewertung konnte nicht abgelehnt werden.",
        variant: "destructive"
      });
    } finally {
      setProcessingEvaluation(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Genehmigt</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Abgelehnt</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Lade Bewertungen...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead>Auftrag</TableHead>
              <TableHead>Frage</TableHead>
              <TableHead>Bewertung</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell className="font-medium">
                  {evaluation.worker_first_name} {evaluation.worker_last_name}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{evaluation.auftrag_title}</div>
                    <div className="text-xs text-gray-500">{evaluation.auftrag_auftragsnummer}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm truncate" title={evaluation.question_text}>
                      {evaluation.question_text}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {renderStars(evaluation.star_rating)}
                    <span className="text-sm text-gray-600">({evaluation.star_rating})</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(evaluation.status)}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {new Date(evaluation.created_at).toLocaleDateString('de-DE')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvaluation(evaluation)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Bewertungsdetails</DialogTitle>
                        </DialogHeader>
                        {selectedEvaluation && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">{selectedEvaluation.question_text}</h4>
                              <div className="flex items-center gap-2 mt-2">
                                {renderStars(selectedEvaluation.star_rating)}
                                <span>({selectedEvaluation.star_rating}/5)</span>
                              </div>
                            </div>
                            
                            {selectedEvaluation.text_feedback && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Feedback:</h5>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm">{selectedEvaluation.text_feedback}</p>
                                </div>
                              </div>
                            )}

                            {selectedEvaluation.rejection_reason && (
                              <div>
                                <h5 className="font-medium text-sm mb-2">Ablehnungsgrund:</h5>
                                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                  <p className="text-sm text-red-700">{selectedEvaluation.rejection_reason}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Status:</span>
                              {getStatusBadge(selectedEvaluation.status)}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {evaluation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproveEvaluation(evaluation.id)}
                          disabled={processingEvaluation === evaluation.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Genehmigen
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={processingEvaluation === evaluation.id}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Ablehnen
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Bewertung ablehnen</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">
                                Bitte geben Sie einen Grund für die Ablehnung an:
                              </p>
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Grund für die Ablehnung..."
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleRejectEvaluation(evaluation.id, rejectionReason)}
                                  disabled={!rejectionReason.trim() || processingEvaluation === evaluation.id}
                                  variant="destructive"
                                >
                                  Bewertung ablehnen
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {evaluations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Keine Bewertungen gefunden.
        </div>
      )}
    </div>
  );
};

export default EvaluationApprovalTable;
