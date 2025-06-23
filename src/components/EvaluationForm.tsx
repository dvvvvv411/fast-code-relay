import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface EvaluationQuestion {
  id: string;
  question_text: string;
  question_order: number;
}

interface EvaluationFormProps {
  assignmentId: string;
  questions: EvaluationQuestion[];
  onEvaluationComplete?: () => void;
}

const EvaluationForm = ({ assignmentId, questions, onEvaluationComplete }: EvaluationFormProps) => {
  const [evaluations, setEvaluations] = useState<{ [key: string]: { rating: number; feedback: string } }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRatingChange = (questionId: string, rating: number) => {
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        rating
      }
    }));
  };

  const handleFeedbackChange = (questionId: string, feedback: string) => {
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        feedback
      }
    }));
  };

  const handleSubmit = async () => {
    // Validate that all questions have ratings
    const missingRatings = questions.filter(q => !evaluations[q.id]?.rating);
    if (missingRatings.length > 0) {
      toast({
        title: "Bewertung unvollständig",
        description: "Bitte bewerten Sie alle Fragen mit Sternen.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🎯 Starting evaluation submission for assignment:', assignmentId);
      console.log('👤 Current user:', user?.id || 'anonymous');
      
      // Insert evaluations
      const evaluationInserts = questions.map(question => ({
        assignment_id: assignmentId,
        question_id: question.id,
        star_rating: evaluations[question.id]?.rating || 0,
        text_feedback: evaluations[question.id]?.feedback || null,
      }));

      const { error: evaluationError } = await supabase
        .from('evaluations')
        .insert(evaluationInserts);

      if (evaluationError) {
        console.error('❌ Error inserting evaluations:', evaluationError);
        throw evaluationError;
      }

      console.log('✅ Evaluations inserted successfully');

      // Update assignment status - this is the key change
      const updateData: any = {
        is_evaluated: true,
      };

      // If user is logged in (registered), set status to 'under_review'
      // If user is anonymous, keep existing logic
      if (user?.id) {
        updateData.status = 'under_review';
        console.log('👤 User is registered, setting status to under_review');
      } else {
        console.log('👤 User is anonymous, keeping default status logic');
      }

      const { error: updateError } = await supabase
        .from('auftrag_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (updateError) {
        console.error('❌ Error updating assignment:', updateError);
        throw updateError;
      }

      console.log('✅ Assignment updated successfully with status:', updateData.status || 'evaluated');

      toast({
        title: "Bewertung eingereicht",
        description: user?.id 
          ? "Ihre Bewertung wurde eingereicht und wird nun überprüft." 
          : "Vielen Dank für Ihre Bewertung!",
      });

      // Call the callback if provided
      onEvaluationComplete?.();

      // Navigate to success page
      const currentUrl = window.location.pathname;
      const assignmentUrl = currentUrl.includes('/assignment/') 
        ? currentUrl.split('/assignment/')[1]
        : currentUrl.includes('/assignment-detail/')
        ? currentUrl.split('/assignment-detail/')[1]
        : undefined;
        
      navigate(`/evaluation-success${assignmentUrl ? `/${encodeURIComponent(assignmentUrl)}` : ''}`);

    } catch (error) {
      console.error('❌ Error submitting evaluation:', error);
      toast({
        title: "Fehler",
        description: "Es gab einen Fehler beim Einreichen Ihrer Bewertung. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-orange-500" />
          Bewertung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="space-y-3">
            <h3 className="font-medium">{question.question_text}</h3>
            
            {/* Star Rating */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(question.id, star)}
                  className={`transition-colors ${
                    evaluations[question.id]?.rating >= star
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
              {evaluations[question.id]?.rating && (
                <span className="text-sm text-gray-600 ml-2">
                  ({evaluations[question.id].rating} von 5 Sternen)
                </span>
              )}
            </div>

            {/* Optional Text Feedback */}
            <Textarea
              placeholder="Optionales Feedback zu dieser Frage..."
              value={evaluations[question.id]?.feedback || ''}
              onChange={(e) => handleFeedbackChange(question.id, e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        ))}

        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || questions.some(q => !evaluations[q.id]?.rating)}
            className="w-full bg-orange hover:bg-orange-dark text-white"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Wird eingereicht...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Bewertung einreichen
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvaluationForm;
