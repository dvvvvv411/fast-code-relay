
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, User, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
}

const FeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

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
        auftrag_auftragsnummer: item.auftrag_assignments.auftraege.auftragsnummer
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
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, feedback) => sum + feedback.star_rating, 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(feedback => {
      distribution[feedback.star_rating as keyof typeof distribution]++;
    });
    return distribution;
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
                <p className="text-2xl font-bold">{feedbacks.length}</p>
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
                <p className="text-2xl font-bold">
                  {feedbacks.filter(f => f.text_feedback).length}
                </p>
                <p className="text-sm text-gray-600">Mit Textfeedback</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Bewertungsverteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(getRatingDistribution()).reverse().map(([rating, count]) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="w-8 text-sm">{rating} ★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: feedbacks.length > 0 ? `${(count / feedbacks.length) * 100}%` : '0%' 
                    }}
                  />
                </div>
                <span className="w-8 text-sm text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Noch keine Bewertungen eingegangen.</p>
            </CardContent>
          </Card>
        ) : (
          feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{feedback.question_text}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {feedback.worker_first_name} {feedback.worker_last_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {feedback.auftrag_title} ({feedback.auftrag_auftragsnummer})
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(feedback.created_at).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                  {renderStars(feedback.star_rating)}
                </div>
              </CardHeader>
              {feedback.text_feedback && (
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{feedback.text_feedback}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackManager;
