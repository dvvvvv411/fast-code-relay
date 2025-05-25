
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EvaluationQuestion {
  id: string;
  question_text: string;
  question_order: number;
}

interface EvaluationFormProps {
  assignmentId: string;
  questions: EvaluationQuestion[];
  onEvaluationComplete: () => void;
}

interface EvaluationAnswer {
  questionId: string;
  starRating: number;
  textFeedback: string;
}

const EvaluationForm = ({ assignmentId, questions, onEvaluationComplete }: EvaluationFormProps) => {
  const [answers, setAnswers] = useState<EvaluationAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize answers for all questions
    const initialAnswers = questions.map(q => ({
      questionId: q.id,
      starRating: 0,
      textFeedback: ''
    }));
    setAnswers(initialAnswers);
  }, [questions]);

  const updateAnswer = (questionId: string, field: 'starRating' | 'textFeedback', value: number | string) => {
    setAnswers(prev => prev.map(answer => 
      answer.questionId === questionId 
        ? { ...answer, [field]: value }
        : answer
    ));
  };

  const isFormValid = () => {
    return answers.every(answer => answer.starRating > 0);
  };

  const sendTelegramNotification = async (assignmentData: any) => {
    try {
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          type: 'evaluation_completed',
          workerName: `${assignmentData.worker_first_name} ${assignmentData.worker_last_name}`,
          auftragTitle: assignmentData.auftraege.title,
          auftragsnummer: assignmentData.auftraege.auftragsnummer
        }
      });

      if (error) {
        console.error('Error sending Telegram notification:', error);
        // Don't throw error here - notification failure shouldn't block the evaluation
      } else {
        console.log('Telegram notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      // Don't throw error here - notification failure shouldn't block the evaluation
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Fehler",
        description: "Bitte bewerten Sie alle Fragen mit Sternen.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare evaluations for database insert
      const evaluationsToInsert = answers.map(answer => ({
        assignment_id: assignmentId,
        question_id: answer.questionId,
        star_rating: answer.starRating,
        text_feedback: answer.textFeedback || null
      }));

      const { error: insertError } = await supabase
        .from('evaluations')
        .insert(evaluationsToInsert);

      if (insertError) throw insertError;

      // Mark assignment as evaluated
      const { error: updateError } = await supabase
        .from('auftrag_assignments')
        .update({ is_evaluated: true })
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      // Fetch assignment data for Telegram notification
      const { data: assignmentData, error: fetchError } = await supabase
        .from('auftrag_assignments')
        .select(`
          worker_first_name,
          worker_last_name,
          auftraege!inner(title, auftragsnummer)
        `)
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching assignment data for notification:', fetchError);
      } else {
        // Send Telegram notification (non-blocking)
        await sendTelegramNotification(assignmentData);
      }

      toast({
        title: "Erfolg",
        description: "Ihre Bewertung wurde erfolgreich eingereicht."
      });

      onEvaluationComplete();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: "Fehler",
        description: "Bewertung konnte nicht eingereicht werden.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, questionId }: { rating: number; onRatingChange: (rating: number) => void; questionId: string }) => {
    const [hoveredRating, setHoveredRating] = useState(0);

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => onRatingChange(star)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Keine Bewertungsfragen für diesen Auftrag verfügbar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-orange-500" />
          Auftragsbewertung
        </CardTitle>
        <p className="text-sm text-gray-600">
          Bitte bewerten Sie den Auftrag anhand der folgenden Fragen:
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions
          .sort((a, b) => a.question_order - b.question_order)
          .map((question, index) => {
            const answer = answers.find(a => a.questionId === question.id);
            if (!answer) return null;

            return (
              <div key={question.id} className="space-y-3">
                <div>
                  <h3 className="font-medium mb-3">
                    {index + 1}. {question.question_text}
                  </h3>
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={answer.starRating}
                      onRatingChange={(rating) => updateAnswer(question.id, 'starRating', rating)}
                      questionId={question.id}
                    />
                    <span className="text-sm text-gray-500">
                      {answer.starRating > 0 && `(${answer.starRating}/5 Sterne)`}
                    </span>
                  </div>
                </div>
                <Textarea
                  placeholder="Bitte beantworten Sie diese Frage ausführlich und teilen Sie Ihre detaillierten Erfahrungen mit..."
                  value={answer.textFeedback}
                  onChange={(e) => updateAnswer(question.id, 'textFeedback', e.target.value)}
                  rows={3}
                />
              </div>
            );
          })}

        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="w-full bg-orange hover:bg-orange-dark"
          >
            {isSubmitting ? 'Wird eingereicht...' : 'Bewertung einreichen'}
          </Button>
          {!isFormValid() && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Bitte bewerten Sie alle Fragen mit Sternen.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EvaluationForm;
