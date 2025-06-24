
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, User, Calendar, FileText, Eye, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';

interface FeedbackData {
  id: string;
  assignment_id: string;
  question_text: string;
  star_rating: number;
  text_feedback: string | null;
  created_at: string;
  status: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  worker_first_name: string;
  worker_last_name: string;
  auftrag_title: string;
  auftrag_auftragsnummer: string;
  completed_at: string;
}

interface GroupedFeedback {
  assignment_id: string;
  worker_first_name: string;
  worker_last_name: string;
  auftrag_title: string;
  auftrag_auftragsnummer: string;
  average_rating: number;
  total_questions: number;
  completed_at: string;
  evaluations: FeedbackData[];
  overall_status: 'pending' | 'approved' | 'rejected' | 'mixed';
}

const FeedbackManager = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [groupedFeedbacks, setGroupedFeedbacks] = useState<GroupedFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<GroupedFeedback | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingEvaluation, setProcessingEvaluation] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    if (feedbacks.length > 0) {
      groupFeedbacksByAssignment();
    }
  }, [feedbacks]);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select(`
          id,
          assignment_id,
          star_rating,
          text_feedback,
          created_at,
          status,
          approved_at,
          approved_by,
          rejection_reason,
          evaluation_questions!inner(question_text),
          auftrag_assignments!inner(
            worker_first_name,
            worker_last_name,
            updated_at,
            auftraege!inner(title, auftragsnummer)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data structure
      const transformedData = data?.map((item: any) => ({
        id: item.id,
        assignment_id: item.assignment_id,
        question_text: item.evaluation_questions.question_text,
        star_rating: item.star_rating,
        text_feedback: item.text_feedback,
        created_at: item.created_at,
        status: item.status,
        approved_at: item.approved_at,
        approved_by: item.approved_by,
        rejection_reason: item.rejection_reason,
        worker_first_name: item.auftrag_assignments.worker_first_name,
        worker_last_name: item.auftrag_assignments.worker_last_name,
        auftrag_title: item.auftrag_assignments.auftraege.title,
        auftrag_auftragsnummer: item.auftrag_assignments.auftraege.auftragsnummer,
        completed_at: item.auftrag_assignments.updated_at
      })) || [];

      setFeedbacks(transformedData);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: "Fehler",
        description: "Bewertungen konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const groupFeedbacksByAssignment = () => {
    const grouped = feedbacks.reduce((acc, feedback) => {
      const existingGroup = acc.find(group => group.assignment_id === feedback.assignment_id);
      
      if (existingGroup) {
        existingGroup.evaluations.push(feedback);
      } else {
        acc.push({
          assignment_id: feedback.assignment_id,
          worker_first_name: feedback.worker_first_name,
          worker_last_name: feedback.worker_last_name,
          auftrag_title: feedback.auftrag_title,
          auftrag_auftragsnummer: feedback.auftrag_auftragsnummer,
          average_rating: 0,
          total_questions: 0,
          completed_at: feedback.completed_at || feedback.created_at,
          evaluations: [feedback],
          overall_status: 'pending'
        });
      }
      return acc;
    }, [] as GroupedFeedback[]);

    // Calculate average rating and overall status for each group
    grouped.forEach(group => {
      const totalRating = group.evaluations.reduce((sum, evaluation) => sum + evaluation.star_rating, 0);
      group.average_rating = totalRating / group.evaluations.length;
      group.total_questions = group.evaluations.length;

      // Determine overall status
      const statuses = group.evaluations.map(e => e.status);
      const uniqueStatuses = [...new Set(statuses)];
      
      if (uniqueStatuses.length === 1) {
        group.overall_status = uniqueStatuses[0] as 'pending' | 'approved' | 'rejected';
      } else {
        group.overall_status = 'mixed';
      }
    });

    // Sort by completion date (most recent first)
    grouped.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    setGroupedFeedbacks(grouped);
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

      fetchFeedbacks(); // Refresh data
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
      fetchFeedbacks(); // Refresh data
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
            className={`h-4 w-4 ${
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
      case 'mixed':
        return <Badge className="bg-blue-100 text-blue-800">Gemischt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAverageRating = () => {
    if (groupedFeedbacks.length === 0) return 0;
    const total = groupedFeedbacks.reduce((sum, group) => sum + group.average_rating, 0);
    return (total / groupedFeedbacks.length).toFixed(1);
  };

  const getTotalEvaluations = () => {
    return groupedFeedbacks.reduce((sum, group) => sum + group.total_questions, 0);
  };

  const getPendingCount = () => {
    return feedbacks.filter(f => f.status === 'pending').length;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bewertungen & Feedback</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{getAverageRating()}</p>
                <p className="text-sm text-gray-600">Durchschnittliche Bewertung</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{getTotalEvaluations()}</p>
                <p className="text-sm text-gray-600">Gesamt Bewertungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{getPendingCount()}</p>
                <p className="text-sm text-gray-600">Ausstehende Bewertungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{groupedFeedbacks.length}</p>
                <p className="text-sm text-gray-600">Bewertete Aufträge</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {groupedFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Noch keine Bewertungen eingegangen.</p>
            </CardContent>
          </Card>
        ) : (
          groupedFeedbacks.map((group) => (
            <Card key={group.assignment_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {group.worker_first_name} {group.worker_last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {group.auftrag_title} ({group.auftrag_auftragsnummer})
                        </span>
                      </div>
                      {getStatusBadge(group.overall_status)}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        {renderStars(Math.round(group.average_rating))}
                        <span className="text-sm font-medium">
                          {group.average_rating.toFixed(1)} ({group.total_questions} Fragen)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(group.completed_at).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => setSelectedAssignment(group)}
                      >
                        <Eye className="h-4 w-4" />
                        Details & Genehmigung
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Bewertungsdetails - {group.worker_first_name} {group.worker_last_name}
                        </DialogTitle>
                        <p className="text-sm text-gray-600">
                          {group.auftrag_title} ({group.auftrag_auftragsnummer})
                        </p>
                      </DialogHeader>
                      
                      <div className="space-y-4 mt-6">
                        {group.evaluations.map((evaluation) => (
                          <Card key={evaluation.id}>
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <CardTitle className="text-lg">{evaluation.question_text}</CardTitle>
                                  <div className="flex items-center gap-4 mt-2">
                                    {renderStars(evaluation.star_rating)}
                                    {getStatusBadge(evaluation.status)}
                                  </div>
                                </div>
                                
                                {evaluation.status === 'pending' && (
                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveEvaluation(evaluation.id)}
                                      disabled={processingEvaluation === evaluation.id}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Genehmigen
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          disabled={processingEvaluation === evaluation.id}
                                        >
                                          <X className="h-4 w-4 mr-1" />
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
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            {evaluation.text_feedback && (
                              <CardContent className="pt-0">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="text-gray-700">{evaluation.text_feedback}</p>
                                </div>
                              </CardContent>
                            )}
                            {evaluation.rejection_reason && (
                              <CardContent className="pt-0">
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                  <p className="text-red-800 font-medium text-sm mb-1">Ablehnungsgrund:</p>
                                  <p className="text-red-700 text-sm">{evaluation.rejection_reason}</p>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackManager;
