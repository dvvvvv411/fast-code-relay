import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, User, Calendar, FileText, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface FeedbackData {
  id: string;
  assignment_id: string;
  question_text: string;
  star_rating: number;
  text_feedback: string | null;
  created_at: string;
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
}

const FeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [groupedFeedbacks, setGroupedFeedbacks] = useState<GroupedFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<GroupedFeedback | null>(null);
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
          evaluations: [feedback]
        });
      }
      return acc;
    }, [] as GroupedFeedback[]);

    // Calculate average rating for each group
    grouped.forEach(group => {
      const totalRating = group.evaluations.reduce((sum, evaluation) => sum + evaluation.star_rating, 0);
      group.average_rating = totalRating / group.evaluations.length;
      group.total_questions = group.evaluations.length;
    });

    // Sort by completion date (most recent first)
    grouped.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    setGroupedFeedbacks(grouped);
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

  const getAverageRating = () => {
    if (groupedFeedbacks.length === 0) return 0;
    const total = groupedFeedbacks.reduce((sum, group) => sum + group.average_rating, 0);
    return (total / groupedFeedbacks.length).toFixed(1);
  };

  const getTotalEvaluations = () => {
    return groupedFeedbacks.reduce((sum, group) => sum + group.total_questions, 0);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{groupedFeedbacks.length}</p>
                <p className="text-sm text-gray-600">Bewertete Aufträge</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Assignment List */}
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
                        Details
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
                                <CardTitle className="text-lg">{evaluation.question_text}</CardTitle>
                                {renderStars(evaluation.star_rating)}
                              </div>
                            </CardHeader>
                            {evaluation.text_feedback && (
                              <CardContent className="pt-0">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="text-gray-700">{evaluation.text_feedback}</p>
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
